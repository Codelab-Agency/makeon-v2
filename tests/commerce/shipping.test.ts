import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Pool, type PoolClient } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Payload } from "payload";
import type { Order } from "../../src/payload-types";
import { shipmentPayment } from "../../src/lib/shipment-payment";
import { shippingInput, shipmentBody, createOrderShipment, shipmentFor } from "../../src/lib/order-shipping";
import { samedayForm, samedayCreate, samedayPDF, SamedayError } from "../../src/lib/sameday-client";
import { up } from "../../src/migrations/20261022_120000_sameday_shipments";

const input = { name: "Client Test", phone: "0712345678", county: "Cluj", city: "Cluj-Napoca", address: "Strada Test 10", postalCode: "400001", weight: 1.25, pickupPoint: 9, service: 7 };
const order = { id: 1, reference: "MK-shipping-test", status: "paid", fulfillmentStatus: "processing", shippingAddress: { address: { country: "RO" } }, customerEmail: "client@example.com", currency: "ron", totalBani: 10000, shippingBani: 2000, items: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Order;
const configure = () => {
  process.env.SAMEDAY_ENV = "sandbox";
  process.env.SAMEDAY_USERNAME = `unit-${randomUUID()}`;
  process.env.SAMEDAY_PASSWORD = "unit-test-only";
};
const mock = (awb: () => Promise<Response>) => (async (url: string | URL | Request) => {
  const path = String(url);
  if (path.endsWith("/api/authenticate")) return Response.json({ token: "test-only" });
  if (path.includes("/api/client/pickup-points")) return Response.json({ pages: 1, data: [{ id: 9, alias: "Test" }] });
  if (path.includes("/api/client/services")) return Response.json({ pages: 1, data: [{ id: 7, serviceCode: "24", name: "24H" }, { id: 15, serviceCode: "LN", name: "Locker" }] });
  if (path.endsWith("/api/awb")) return awb();
  throw new Error("Unexpected provider request");
}) as typeof fetch;

test("AWB validates package, recipient, payment, destination and encodes SDK fields", () => {
  const parsed = shippingInput(input);
  const body = shipmentBody(order, parsed);
  const form = samedayForm(body);
  assert.equal(form.get("cashOnDelivery"), "0");
  assert.equal(form.get("parcels[0][weight]"), "1.25");
  assert.equal(form.get("awbRecipient[phoneNumber]"), input.phone);
  assert.equal(form.get("awbRecipient[countyString]"), input.county);
  assert.equal(form.get("clientInternalReference"), order.reference);
  for (const change of [{ weight: 0 }, { weight: Infinity }, { weight: 32 }, { weight: "1" }, { phone: "invalid" }, { address: "" }, { service: -1 }])
    assert.throws(() => shippingInput({ ...input, ...change }));
  assert.throws(() => shipmentBody({ ...order, status: "pending" }, parsed));
  assert.throws(() => shipmentBody({ ...order, fulfillmentStatus: "shipped" }, parsed));
  assert.throws(() => shipmentBody({ ...order, shippingAddress: { country: "DE" } }, parsed));
});

test("provider acceptance is ambiguous on timeout, 5xx or invalid success; PDF is validated", async () => {
  configure();
  for (const response of [() => { throw new Error("timeout"); }, () => new Response("failed", { status: 500 }), () => Response.json({})]) {
    await assert.rejects(samedayCreate({}, mock(async () => response())), error => error instanceof SamedayError && error.uncertain);
  }
  await assert.rejects(samedayCreate({}, mock(async () => new Response("bad", { status: 400 }))), error => error instanceof SamedayError && !error.uncertain);
  const fetcher = (async (url: string | URL | Request) => String(url).endsWith("/api/authenticate")
    ? Response.json({ token: "test-only" }) : new Response("<html>Login</html>")) as typeof fetch;
  await assert.rejects(samedayPDF("TEST123456", "A4", fetcher));
});

// This suite creates its own random schema and fixtures. It never modifies public tables.
test("durable claims prevent duplicate AWBs across concurrent requests and uncertain retries", { skip: !process.env.SHIPPING_TEST_DATABASE_URL }, async () => {
  const schema = `shipping_test_${randomUUID().replaceAll("-", "")}`;
  assert.match(schema, /^shipping_test_[a-f0-9]{32}$/);
  // Neon transaction pooling does not support a per-connection startup search_path.
  const testURL = new URL(process.env.SHIPPING_TEST_DATABASE_URL!);
  if (testURL.hostname.endsWith(".neon.tech")) testURL.hostname = testURL.hostname.replace("-pooler.", ".");
  const admin = new Pool({ connectionString: testURL.toString(), max: 1 });
  const pool = new Pool({ connectionString: testURL.toString(), options: `-c search_path=${schema}`, max: 8 });
  const sessions: Record<string, { db: NodePgDatabase; client: PoolClient }> = {};
  const connection = drizzle(pool);
  const cms = {
    db: {
      drizzle: connection, sessions,
      beginTransaction: async () => {
        const client = await pool.connect(); await client.query("BEGIN");
        const id = randomUUID(); sessions[id] = { db: drizzle(client), client }; return id;
      },
      commitTransaction: async (id: string) => { await sessions[id].client.query("COMMIT"); sessions[id].client.release(); delete sessions[id]; },
      rollbackTransaction: async (id: string) => { await sessions[id].client.query("ROLLBACK"); sessions[id].client.release(); delete sessions[id]; },
    },
    findByID: async ({ id, req }: { id: number; req?: { transactionID?: string } }) => {
      const query = req?.transactionID ? sessions[req.transactionID].client : pool;
      const result = await query.query("SELECT snapshot FROM orders WHERE id = $1", [id]);
      if (!result.rows[0]) throw new Error("Unknown fixture order");
      return result.rows[0].snapshot;
    },
  } as unknown as Payload;
  try {
    await admin.query(`CREATE SCHEMA "${schema}"`);
    await pool.query("CREATE TABLE orders (id integer PRIMARY KEY, reference text NOT NULL, snapshot jsonb NOT NULL)");
    await up({ db: connection } as unknown as Parameters<typeof up>[0]);
    for (let id = 1; id <= 4; id++) await pool.query("INSERT INTO orders VALUES ($1,$2,$3)", [id, `${order.reference}-${id}`, JSON.stringify({ ...order, id, reference: `${order.reference}-${id}` })]);
    configure(); let calls = 0;
    const success = mock(async () => { calls++; await new Promise(resolve => setTimeout(resolve, 80)); return Response.json({ awbNumber: "TEST123456" }); });
    const concurrent = await Promise.allSettled([createOrderShipment(cms, 1, input, success), createOrderShipment(cms, 1, input, success)]);
    assert.ok(concurrent.some(result => result.status === "fulfilled"));
    assert.equal(calls, 1);
    await createOrderShipment(cms, 1, input, success);
    assert.equal(calls, 1);
    assert.equal((await shipmentFor(cms, 1))?.number, "TEST123456");
    let unknownCalls = 0;
    const timeout = mock(async () => { unknownCalls++; throw new Error("timeout"); });
    await assert.rejects(createOrderShipment(cms, 2, input, timeout));
    assert.equal((await shipmentFor(cms, 2))?.state, "uncertain");
    await assert.rejects(createOrderShipment(cms, 2, input, timeout));
    assert.equal(unknownCalls, 1);
    await assert.rejects(createOrderShipment(cms, 3, input, mock(async () => new Response("bad", { status: 400 }))));
    assert.equal((await shipmentFor(cms, 3))?.state, "rejected");
    await createOrderShipment(cms, 3, input, mock(async () => Response.json({ awbNumber: "TEST654321" })));
    assert.equal((await shipmentFor(cms, 3))?.state, "created");
    const codOrder={...order,id:4,reference:`${order.reference}-4`,paymentMethod:'cod',status:'cod_pending',totalBani:12500};
    await pool.query('UPDATE orders SET snapshot=$1 WHERE id=4',[JSON.stringify(codOrder)]);
    let codPayload: URLSearchParams | undefined;
    const codFetcher=(async(url: string | URL | Request,init?: RequestInit)=>{
      if(String(url).endsWith('/api/awb')) codPayload=new URLSearchParams(String(init?.body));
      return mock(async()=>Response.json({awbNumber:'TESTCOD123456'}))(url,init);
    }) as typeof fetch;
    await createOrderShipment(cms,4,input,codFetcher);
    assert.equal(codPayload?.get('cashOnDelivery'),'125');
    assert.equal(codPayload?.get('awbPayment'),'1');
    assert.equal((await pool.query("SELECT snapshot->>'status' AS status FROM orders WHERE id=4")).rows[0].status,'cod_pending');
    process.env.SAMEDAY_USERNAME = "another-account";
    await assert.rejects(shipmentFor(cms, 1), /configurații/);
    assert.equal((await pool.query("SELECT snapshot->>'status' AS status FROM orders WHERE id < 4")).rows.every(row => row.status === "paid"), true);
    // The same durable claims apply to easybox; the saved locker wins over edited recipient fields.
    process.env.SAMEDAY_ENV='production';process.env.SAMEDAY_USERNAME='locker-'+randomUUID();
    const locker={id:1413,name:'easybox Test',address:'Strada Locker 10',city:'Cluj-Napoca',county:'Cluj',postalCode:'400001',supportedPayment:true};
    const lockerOrder={...order,id:5,reference:`${order.reference}-5`,paymentMethod:'cod',status:'cod_pending',totalBani:11800,checkoutDetails:{shipping:{method:'easybox',locker}}};
    await pool.query('INSERT INTO orders VALUES($1,$2,$3)',[5,lockerOrder.reference,JSON.stringify(lockerOrder)]);
    let lockerCalls=0,lockerPayload:URLSearchParams|undefined;
    const lockerFetcher=(async(url:string|URL|Request,init?:RequestInit)=>{
      if(String(url).includes('/api/client/lockers'))return Response.json({data:[{...locker,lockerId:locker.id,clientVisible:1,supportedPayment:1}]});
      return mock(async()=>{lockerCalls++;lockerPayload=new URLSearchParams(String(init?.body));return Response.json({awbNumber:'TESTLOCKER123'});})(url,init);
    }) as typeof fetch;
    await assert.rejects(createOrderShipment(cms,5,input,lockerFetcher),/Serviciul Sameday/);
    assert.equal(lockerCalls,0);
    await Promise.allSettled([createOrderShipment(cms,5,{...input,service:15},lockerFetcher),createOrderShipment(cms,5,{...input,service:15},lockerFetcher)]);
    assert.equal(lockerCalls,1);assert.equal(lockerPayload?.get('lockerLastMile'),'1413');
    assert.equal(lockerPayload?.get('service'),'15');assert.equal(lockerPayload?.get('cashOnDelivery'),'118');
    assert.equal(lockerPayload?.get('awbRecipient[address]'),locker.address);
  } finally {
    for (const session of Object.values(sessions)) { await session.client.query("ROLLBACK"); session.client.release(); }
    await pool.end();
    await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await admin.end();
  }
});

test('COD AWBs collect products plus shipping in RON and do not mark the order paid', () => {
  const cod = {...order,paymentMethod:'cod' as const,status:'cod_pending' as const,totalBani:12345};
  const body = shipmentBody(cod, shippingInput(input));
  assert.equal(body.cashOnDelivery,123.45);
  assert.equal(samedayForm(body).get('cashOnDelivery'),'123.45');
  assert.equal(cod.status,'cod_pending');
  assert.equal(shipmentBody({...cod,status:'paid'},shippingInput(input)).cashOnDelivery,0);
  assert.throws(()=>shipmentBody({...cod,status:'cancelled'},shippingInput(input)));
});


test('AWB eligibility follows confirmed COD or paid status and reports unconfirmed quotes explicitly',()=>{
  const cod={...order,status:'cod_pending' as const,paymentMethod:'cod' as const,totalBani:12500};
  assert.deepEqual(shipmentPayment(cod),{allowed:true,cashOnDeliveryBani:12500,reason:null});
  assert.equal(shipmentBody({...cod,paymentMethod:null},shippingInput(input)).cashOnDelivery,125);
  for(const paymentMethod of ['card','cod',null] as const){
    const paid={...order,status:'paid' as const,paymentMethod};
    assert.equal(shipmentPayment(paid).allowed,true);
    assert.equal(shipmentBody(paid,shippingInput(input)).cashOnDelivery,0);
  }
  const requested=shipmentPayment({...cod,status:'requested',orderType:'production'});
  assert.equal(requested.allowed,false);assert.match(requested.reason!,/Confirmă comanda ramburs/);
  for(const status of ['pending','failed','expired','cancelled'] as const)
    assert.equal(shipmentPayment({...cod,status}).allowed,false);
  for(const totalBani of [0,-1,NaN,Infinity,125.5])
    assert.equal(shipmentPayment({...cod,totalBani}).allowed,false);
});

test('personal easybox dropoff sends PDO while preserving the recipient and COD amount',async()=>{
  const {samedayOptions}=await import('../../src/lib/sameday-client');
  const parsed=shippingInput({...input,personalDropoff:true});
  const cod={...order,status:'cod_pending' as const,paymentMethod:'cod' as const,totalBani:12500};
  const body=shipmentBody(cod,parsed),form=samedayForm(body);
  assert.equal(form.get('serviceTaxes[0]'),'PDO');
  assert.equal(form.get('cashOnDelivery'),'125');
  assert.equal(form.get('awbRecipient[address]'),input.address);
  assert.equal(form.has('lockerLastMile'),false);
  assert.equal(samedayForm(shipmentBody(order,shippingInput(input))).has('serviceTaxes[0]'),false);
  assert.equal(samedayForm(shipmentBody(order,parsed)).get('cashOnDelivery'),'0');
  assert.throws(()=>shippingInput({...input,personalDropoff:'true'}));
  configure();
  const services=[
    {id:7,name:'24H',serviceCode:'24',serviceOptionalTaxes:[{taxCode:'PDO',packageType:0}]},
    {id:8,name:'24H fără PDO',serviceCode:'24',serviceOptionalTaxes:[]},
    {id:9,name:'24H plic',serviceCode:'24',serviceOptionalTaxes:[{taxCode:'PDO',packageType:1}]},
    {id:15,name:'Easybox',serviceCode:'LN',serviceOptionalTaxes:[{taxCode:'PDO',packageType:0}]},
  ];
  const fetcher=(async(url:string|URL|Request)=>{
    if(String(url).includes('/api/client/services'))return Response.json({pages:1,data:services});
    return mock(async()=>{throw new Error('AWB must not be dispatched');})(url);
  }) as typeof fetch;
  const options=await samedayOptions(fetcher);
  assert.deepEqual(options.services.map(s=>[s.id,s.personalDropoff]),[[7,true],[8,false],[9,false],[15,true]]);
  await assert.rejects(createOrderShipment({} as Payload,1,{...input,service:8,personalDropoff:true},fetcher),/PDO/);
});
