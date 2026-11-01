import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCheckoutDetails } from "../../src/lib/checkout-details";
import { validateEasyboxDetails, deliveryPriceBani } from "../../src/lib/easybox";
import { samedayOptions } from "../../src/lib/sameday-client";
import { shipmentBody, shippingInput } from "../../src/lib/order-shipping";
import type { Order } from "../../src/payload-types";

const locker={id:1413,name:"easybox Test",address:"Strada Locker 10",city:"Cluj-Napoca",county:"Cluj",postalCode:"400001",supportedPayment:true};
const details={paymentMethod:"card",contact:{name:"Client Test",email:"client@example.test",phone:"0712345678"},shipping:{method:"easybox",country:"RO",locker},billing:{type:"personal",address:"Strada Client 5, Cluj-Napoca, Cluj, România"}};
const configure=()=>{Object.assign(process.env,{SAMEDAY_ENV:"production",SAMEDAY_USERNAME:"api-test",SAMEDAY_PASSWORD:"api-secret-test",SAMEDAY_LOCKER_CLIENT_ID:"map-client-test",SAMEDAY_LOCKER_API_USERNAME:"map-user-test",SHIPPING_PRICE_BANI:"2500",EASYBOX_SHIPPING_PRICE_BANI:"1800"});};
const fetcher=(payment=1)=> (async(url:string|URL|Request)=>{
 const path=String(url);
 if(path.endsWith('/api/authenticate'))return Response.json({token:'mock-token'});
 if(path.includes('/api/client/lockers'))return Response.json({data:[{lockerId:locker.id,...locker,clientVisible:1,supportedPayment:payment}]});
 if(path.includes('/api/client/services'))return Response.json({pages:1,data:[{id:7,serviceCode:'24',name:'24H'},{id:15,serviceCode:'LN',name:'Locker'},{id:16,serviceCode:'XL',name:'Crossborder'}]});
 if(path.includes('/api/client/pickup-points'))return Response.json({pages:1,data:[{id:9,name:'Depozit'}]});
 throw new Error('Unexpected Sameday call');
}) as typeof fetch;

test('easybox parsing preserves personal invoicing separately from the locker on repeated reads',()=>{
 const parsed=parseCheckoutDetails(details);
 assert.equal(parsed.shipping.line1,locker.address);
 assert.equal(parsed.billing.address,details.billing.address);
 assert.deepEqual(parseCheckoutDetails(parsed),parsed);
 for(const change of [{locker:null},{method:'pudo'},{locker:{...locker,id:-1}},{locker:{...locker,name:'invalid\nname'}}]){
  assert.throws(()=>parseCheckoutDetails({...details,shipping:{...details.shipping,...change}}));
 }
 assert.throws(()=>parseCheckoutDetails({...details,billing:{type:'personal',address:''}}));
});

test('the server replaces forged locker metadata and rejects unsupported COD',async()=>{
 configure();
 const forged=parseCheckoutDetails({...details,shipping:{...details.shipping,locker:{...locker,name:'Forged name',address:'Wrong street 100'}}});
 const verified=await validateEasyboxDetails(forged,fetcher());
 assert.deepEqual(verified.shipping.locker,locker);
 assert.equal(verified.billing.address,details.billing.address);
 await assert.rejects(validateEasyboxDetails({...forged,paymentMethod:'cod'},fetcher(0)),/nu acceptă/);
 const paid=await validateEasyboxDetails(forged,fetcher(0));
 assert.equal(paid.shipping.locker?.supportedPayment,false);
 delete process.env.SAMEDAY_LOCKER_CLIENT_ID;
 await assert.rejects(validateEasyboxDetails(forged,fetcher()),/nu este disponibilă/);
});

test('delivery fees are server configured and domestic services include address and locker only',async()=>{
 configure();
 assert.equal(deliveryPriceBani(),2500);assert.equal(deliveryPriceBani('easybox'),1800);
 delete process.env.EASYBOX_SHIPPING_PRICE_BANI;
 assert.equal(deliveryPriceBani('easybox'),2500);
 const options=await samedayOptions(fetcher());
 assert.deepEqual(options.services.map(s=>[s.id,s.deliveryMethod]),[[7,'address'],[15,'easybox']]);
});

test('locker AWBs use lockerLastMile and the saved destination, with the verified COD total',()=>{
 const parsed=parseCheckoutDetails(details);
 const order={id:1,reference:'MK-locker-test',status:'cod_pending',paymentMethod:'cod',fulfillmentStatus:'new',totalBani:11800,shippingBani:1800,currency:'ron',checkoutDetails:parsed,shippingAddress:{address:parsed.shipping},customerEmail:parsed.contact.email,items:[]} as unknown as Order;
 const input=shippingInput({name:'Client Test',phone:'0712345678',county:'Wrong County',city:'Wrong City',address:'Wrong street 20',postalCode:'',weight:1,pickupPoint:9,service:15});
 const body=shipmentBody(order,input);
 assert.equal(body.lockerLastMile,locker.id);assert.equal(body.service,15);
 assert.equal(body.awbRecipient.address,locker.address);assert.equal(body.awbRecipient.cityString,locker.city);
 assert.equal(body.cashOnDelivery,118);
 assert.equal(shipmentBody({...order,status:'paid'},input).cashOnDelivery,0);
});

test('map configuration exposes only dedicated public identifiers and rejects foreign verification requests',async()=>{
 configure();
 const {GET,POST}=await import('../../src/app/api/shipping/easybox/route');
 const config=await (await GET()).json();
 assert.deepEqual(config,{clientId:'map-client-test',apiUsername:'map-user-test'});
 assert.ok(!JSON.stringify(config).includes('api-secret-test'));
 const denied=await POST(new Request('http://localhost:3000/api/shipping/easybox',{method:'POST',headers:{origin:'https://foreign.example','content-type':'application/json'},body:'{"lockerId":1413}'}));
 assert.equal(denied.status,403);
});
