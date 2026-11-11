import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { Payload } from 'payload';
import { sql, type PostgresAdapter } from '@payloadcms/db-postgres';
import type Stripe from 'stripe';
import { parseLines, validGrind, priceBani } from '../../src/lib/commerce-validation';
import { legal } from '../../src/lib/legal';

let cms: Payload;
let commerce: typeof import('../../src/lib/commerce');
const sessions = new Map<string, Stripe.Checkout.Session>();
const keys = new Map<string, Stripe.Checkout.Session>();
let creates = 0;
const fakeStripe = { checkout: { sessions: {
  create: async (params: Stripe.Checkout.SessionCreateParams, options: { idempotencyKey: string }) => {
    if (keys.has(options.idempotencyKey)) return keys.get(options.idempotencyKey)!;
    creates++;
    const total = params.line_items!.reduce((sum, line) => sum + line.quantity! * line.price_data!.unit_amount!, 0)
      + params.shipping_options![0].shipping_rate_data!.fixed_amount!.amount;
    const session = { id: `cs_test_${randomUUID().replaceAll('-', '')}`, url: 'https://checkout.stripe.com/test', status: 'open', payment_status: 'unpaid',
      client_reference_id: params.client_reference_id, amount_total: total, currency: 'ron', expires_at: params.expires_at,
    } as Stripe.Checkout.Session;
    sessions.set(session.id, session); keys.set(options.idempotencyKey, session);
    return session;
  },
  retrieve: async (id: string) => sessions.get(id)!,
  expire: async (id: string) => {
    const session = sessions.get(id)!; session.status = 'expired'; return session;
  },
} } } as unknown as Stripe;

test('complementary products require a unit, not grams; payment preserves inventory idempotency', async () => {
  const slug = `accessory-${randomUUID()}`;
  const data = {slug, name:'Cești test', category:'complementare' as const, description:'Set de cești', price:30, stock:2, reserved:0};
  await assert.rejects(cms.create({collection:'products',data}), /unitatea/);
  const accessory = await cms.create({collection:'products',data:{...data,unitLabel:'Set de 6'}});
  assert.equal(accessory.grams,null);
  assert.equal(accessory.collection,'Complementare');
  await assert.rejects(cms.update({collection:'products',id:accessory.id,data:{unitLabel:null}}), /unitatea/);
  const key = randomUUID();
  await commerce.createCheckout([{slug,grind:'Standard',quantity:1}],key,fakeStripe,cms);
  const order = await reservation(`MK-${key}`);
  assert.equal(order.items[0].name,'Cești test · Set de 6');
  assert.equal((await cms.findByID({collection:'products',id:accessory.id})).reserved,1);
  const session = keys.get(`MK-${key}`)!;
  const paid = {...session,status:'complete',payment_status:'paid'} as Stripe.Checkout.Session;
  await commerce.applySession(paid,cms);await commerce.applySession(paid,cms);
  const saved = await cms.findByID({collection:'products',id:accessory.id});
  assert.equal(saved.stock,1);assert.equal(saved.reserved,0);
  await assert.rejects(commerce.createCheckout([{slug,grind:'Espresso',quantity:1}],randomUUID(),fakeStripe,cms));
});

test('decaff formats and complementary selections reject incompatible grinds', () => {
  assert.equal(validGrind('decaff','Boabe','boabe'),true);
  assert.equal(validGrind('decaff','Espresso','boabe'),false);
  assert.equal(validGrind('decaff','Moka','macinata'),true);
  assert.equal(validGrind('decaff','Boabe','macinata'),false);
  assert.equal(validGrind('complementare','Standard'),true);
  assert.equal(validGrind('complementare','Instant'),false);
  assert.equal(validGrind('boabe','Standard'),false);
  assert.deepEqual(parseLines({items:[{slug:'cesti',grind:'Standard',quantity:2}]}),[{slug:'cesti',grind:'Standard',quantity:2}]);
});

before(async () => {
  // This suite is deliberately restricted to an isolated local database.
  process.env.DATABASE_URL = 'postgresql://postgres:makeon-local-test-only@127.0.0.1:55432/makeon_test';
  process.env.PAYLOAD_DB_PUSH = 'true';
  process.env.PAYLOAD_SECRET = 'local-integration-test-secret-not-for-production';
  process.env.STRIPE_SECRET_KEY = 'sk_test_local_mock'; process.env.STRIPE_WEBHOOK_SECRET = 'whsec_local_mock';
  process.env.APP_URL = 'http://localhost:3000'; process.env.SHIPPING_PRICE_BANI = '2000';
  Object.assign(process.env, { NODE_ENV: 'development' });
  // Remove SQL-only fixtures before Payload schema push on this disposable DB.
  // The URL above is fixed to localhost/makeon_test; no shared DB is touched.
  const { Pool } = await import('pg');
  const cleanup = new Pool({connectionString:process.env.DATABASE_URL});
  await cleanup.query('DROP TABLE IF EXISTS public.order_shipments; DROP TABLE IF EXISTS public.order_status_emails; DROP TABLE IF EXISTS public.checkout_reservations');
  const existing = await cleanup.query("SELECT to_regclass('public.orders') AS orders, to_regclass('public.products') AS products");
  if (existing.rows[0].orders && existing.rows[0].products)
    await cleanup.query('TRUNCATE orders, products RESTART IDENTITY CASCADE');
  await cleanup.end();
  const { getPayload } = await import('payload');
  const { default: config } = await import('../../src/payload.config');
  cms = await getPayload({ config });
  await (cms.db as unknown as PostgresAdapter).drizzle.execute(sql`TRUNCATE orders, products RESTART IDENTITY CASCADE`);
  const constraints = await import('../../src/migrations/20261002_121000_inventory_constraints');
  const adapter = cms.db as unknown as PostgresAdapter;
  await adapter.drizzle.execute(sql`ALTER TABLE products DROP CONSTRAINT IF EXISTS products_inventory_valid;
    ALTER TABLE products DROP CONSTRAINT IF EXISTS products_price_valid;`);
  await constraints.up({ db: adapter.drizzle } as Parameters<typeof constraints.up>[0]);
  // This SQL-only table is not created by Payload's schema push.
  const notifications = await import('../../src/migrations/20261011_120000_order_status_emails');
  await adapter.drizzle.execute(sql`DROP TABLE IF EXISTS order_status_emails`);
  await notifications.up({ db: adapter.drizzle } as Parameters<typeof notifications.up>[0]);
  const merchantEmails = await import('../../src/migrations/20261105_120000_merchant_order_emails');
  await merchantEmails.up({ db: adapter.drizzle } as Parameters<typeof merchantEmails.up>[0]);
  const shipments = await import('../../src/migrations/20261022_120000_sameday_shipments');
  await shipments.up({ db: adapter.drizzle } as Parameters<typeof shipments.up>[0]);
  const reservations = await import('../../src/migrations/20261029_140000_checkout_reservations');
  await reservations.up({ db: adapter.drizzle } as Parameters<typeof reservations.up>[0]);
  commerce = await import('../../src/lib/commerce');
});
after(async () => { if (cms) {
  const adapter = cms.db as unknown as PostgresAdapter;
  assert.deepEqual(Object.keys(adapter.sessions), []);
  await cms.destroy();
} });

async function product(stock = 5) {
  return cms.create({ collection: 'products', data: { slug: `test-${randomUUID()}`, name: 'Cafea test', category: 'boabe',
    collection: 'Teste', grams: 500, description: 'Produs pentru verificarea comenzilor.', price: 49.99, stock, reserved: 0, active: true } });
}

async function reservation(reference: string) {
  const result = await (cms.db as unknown as PostgresAdapter).drizzle.execute(sql`SELECT snapshot FROM checkout_reservations WHERE reference = ${reference}`);
  return result.rows[0]?.snapshot as import('../../src/payload-types').Order;
}

test('only admins can delete unused products; order history and reservations prevent deletion', async () => {
  const user = { id: 999, collection: 'users' as const, email: 'admin@example.test' };
  const unused = await product();
  await assert.rejects(cms.delete({ collection: 'products', id: unused.id, overrideAccess: false }));
  await cms.delete({ collection: 'products', id: unused.id, overrideAccess: false, user });
  assert.equal((await cms.find({ collection: 'products', where: { id: { equals: unused.id } } })).totalDocs, 0);

  const reserved = await product();
  const adapter = cms.db as unknown as PostgresAdapter;
  await adapter.drizzle.execute(sql`UPDATE products SET reserved = 1 WHERE id = ${reserved.id}`);
  await assert.rejects(cms.delete({ collection: 'products', id: reserved.id, overrideAccess: false, user }), /plăți în curs/);
  await adapter.drizzle.execute(sql`UPDATE products SET reserved = 0 WHERE id = ${reserved.id}`);

  const key = randomUUID();
  await commerce.createCheckout([{ slug: reserved.slug, grind: 'Boabe', quantity: 1 }], key, fakeStripe, cms);
  const session = keys.get(`MK-${key}`)!;
  await commerce.applySession({ ...session, status: 'complete', payment_status: 'paid' }, cms);
  await assert.rejects(cms.delete({ collection: 'products', id: reserved.id, overrideAccess: false, user }), /apare în comenzi/);
  assert.equal((await cms.findByID({ collection: 'products', id: reserved.id })).stock, 4);
  const order = (await cms.find({ collection: 'orders', where: { reference: { equals: `MK-${key}` } }, depth: 0 })).docs[0];
  assert.equal(order.items[0].product, reserved.id);
  await cms.update({ collection: 'products', id: reserved.id, overrideAccess: false, user, data: { active: false } });
});

test('admin order edits preserve payment snapshots and concurrent stock settlement', async () => {
  const p = await product(3); const key = randomUUID();
  await commerce.createCheckout([{ slug: p.slug, grind: 'Boabe', quantity: 1 }], key, fakeStripe, cms);
  const session = keys.get(`MK-${key}`)!;
  const order = await commerce.applySession({ ...session, status: 'complete', payment_status: 'paid' }, cms);
  assert.ok(order);
  const user = { id: 999, collection: 'users' as const, email: 'admin@example.test' };
  await assert.rejects(cms.update({ collection: 'orders', id: order.id, overrideAccess: false, data: { fulfillmentStatus: 'processing' } }));
  await Promise.all([
    commerce.applySession({ ...session, status: 'complete', payment_status: 'paid' }, cms),
    cms.update({ collection: 'orders', id: order.id, overrideAccess: false, user,
      data: { fulfillmentStatus: 'processing', status: 'failed', totalBani: 1, shippingAddress: { fake: true } } }),
  ]);
  const saved = await cms.findByID({ collection: 'orders', id: order.id });
  assert.equal(saved.fulfillmentStatus, 'processing'); assert.equal(saved.status, 'paid');
  assert.equal(saved.totalBani, order.totalBani); assert.equal(saved.shippingAddress, null);
  const inventory = await cms.findByID({ collection: 'products', id: p.id });
  assert.equal(inventory.stock, 2); assert.equal(inventory.reserved, 0);
});

test('constraint repair preserves data, is repeatable, and rejects invalid inventory', async () => {
  const adapter = cms.db as unknown as PostgresAdapter;
  const repair = await import('../../src/migrations/20261005_120000_restore_inventory_constraints');
  const p = await product(3);
  await adapter.drizzle.execute(sql`ALTER TABLE products DROP CONSTRAINT products_inventory_valid;
    ALTER TABLE products DROP CONSTRAINT products_price_valid;`);
  await adapter.drizzle.execute(sql`UPDATE products SET stock = -1 WHERE id = ${p.id}`);
  await assert.rejects(adapter.drizzle.transaction(async (db) => {
    await repair.up({ db } as unknown as Parameters<typeof repair.up>[0]);
  }));
  const invalid = await cms.findByID({ collection: 'products', id: p.id });
  assert.equal(invalid.stock, -1);
  await adapter.drizzle.execute(sql`UPDATE products SET stock = 3 WHERE id = ${p.id}`);
  await adapter.drizzle.transaction(async (db) => {
    await repair.up({ db } as unknown as Parameters<typeof repair.up>[0]);
    await repair.up({ db } as unknown as Parameters<typeof repair.up>[0]);
  });
  const saved = await cms.findByID({ collection: 'products', id: p.id });
  assert.equal(saved.stock, 3);
  assert.equal(saved.name, p.name);
  assert.equal(saved.price, p.price);
  await assert.rejects(adapter.drizzle.execute(sql`UPDATE products SET reserved = 4 WHERE id = ${p.id}`));
  await assert.rejects(adapter.drizzle.execute(sql`UPDATE products SET price = -1 WHERE id = ${p.id}`));
});

test('validates cart input and ignores client-supplied prices', () => {
  assert.deepEqual(parseLines({ items: [{ slug: 'intense', grind: 'Boabe', quantity: 1, price: 0.01 }, { slug: 'intense', grind: 'Boabe', quantity: 2 }] }),
    [{ slug: 'intense', grind: 'Boabe', quantity: 3 }]);
  for (const quantity of [0, -1, 0.5, 100, '2']) assert.throws(() => parseLines({ items: [{ slug: 'intense', grind: 'Boabe', quantity }] }));
  assert.throws(() => parseLines({ items: [] })); assert.throws(() => priceBani(null));
  assert.equal(priceBani(49.99), 4999); assert.equal(validGrind('boabe', 'Espresso'), false);
});

test('reserves stock, snapshots server price, and retries checkout idempotently', async () => {
  const p = await product(); const key = randomUUID(); const beforeCreates = creates;
  const lines = [{ slug: p.slug, grind: 'Boabe', quantity: 2 }];
  await commerce.createCheckout(lines, key, fakeStripe, cms);
  await commerce.createCheckout(lines, key, fakeStripe, cms);
  const updated = await cms.findByID({ collection: 'products', id: p.id });
  assert.equal(updated.stock, 5); assert.equal(updated.reserved, 2); assert.equal(creates, beforeCreates + 1);
  const orders = await cms.find({ collection: 'orders', where: { reference: { equals: `MK-${key}` } }, depth: 0 });
  assert.equal(orders.docs.length, 0);
  assert.equal((await reservation(`MK-${key}`)).totalBani, 11998);
  await assert.rejects(commerce.createCheckout([{ ...lines[0], quantity: 1 }], key, fakeStripe, cms));
});

test('concurrent buyers cannot reserve the last item twice', async () => {
  const p = await product(1);
  const results = await Promise.allSettled([0, 1].map(() => commerce.createCheckout([{ slug: p.slug, grind: 'Boabe', quantity: 1 }], randomUUID(), fakeStripe, cms)));
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  const updated = await cms.findByID({ collection: 'products', id: p.id });
  assert.equal(updated.stock, 1); assert.equal(updated.reserved, 1);
});

test('signed-session processing is idempotent under concurrent delivery and rejects mismatched totals', async () => {
  const p = await product(3); const key = randomUUID();
  await commerce.createCheckout([{ slug: p.slug, grind: 'Boabe', quantity: 2 }], key, fakeStripe, cms);
  const session = keys.get(`MK-${key}`)!;
  session.status = 'complete'; session.payment_status = 'paid';
  await assert.rejects(commerce.applySession({ ...session, amount_total: 1 }, cms));
  assert.equal((await cms.findByID({ collection: 'products', id: p.id })).reserved, 2);
  await Promise.all([commerce.applySession(session, cms), commerce.applySession(session, cms)]);
  const updated = await cms.findByID({ collection: 'products', id: p.id });
  assert.equal(updated.stock, 1); assert.equal(updated.reserved, 0);
});

test('expiration releases reservations without reducing physical stock', async () => {
  const p = await product(2); const key = randomUUID();
  await commerce.createCheckout([{ slug: p.slug, grind: 'Boabe', quantity: 2 }], key, fakeStripe, cms);
  const session = keys.get(`MK-${key}`)!; session.status = 'expired';
  await commerce.applySession(session, cms); await commerce.applySession(session, cms);
  assert.equal((await cms.count({collection:'orders',where:{reference:{equals:`MK-${key}`}}})).totalDocs,0);
  const updated = await cms.findByID({ collection: 'products', id: p.id });
  assert.equal(updated.stock, 2); assert.equal(updated.reserved, 0);
});

test('an invalid multi-product checkout rolls back every reservation', async () => {
  const a = await product(5), b = await product(0);
  await assert.rejects(commerce.createCheckout([{ slug: a.slug, grind: 'Boabe', quantity: 2 }, { slug: b.slug, grind: 'Boabe', quantity: 1 }], randomUUID(), fakeStripe, cms));
  assert.equal((await cms.findByID({ collection: 'products', id: a.id })).reserved, 0);
});

test('orders and admin accounts are inaccessible without authentication', async () => {
  await assert.rejects(cms.find({ collection: 'orders', overrideAccess: false }));
  await assert.rejects(cms.create({ collection: 'users', overrideAccess: false, data: { email: 'public@example.test', password: 'cannot-register-this-account' } }));
});

test('returning from cancelled checkout releases stock and keeps the physical quantity', async () => {
  const p = await product(2); const key = randomUUID();
  await commerce.createCheckout([{ slug: p.slug, grind: 'Boabe', quantity: 2 }], key, fakeStripe, cms);
  await commerce.cancelCheckout(key, fakeStripe, cms);
  await commerce.cancelCheckout(key, fakeStripe, cms);
  assert.equal((await cms.count({collection:'orders',where:{reference:{equals:`MK-${key}`}}})).totalDocs,0);
  const updated = await cms.findByID({ collection: 'products', id: p.id });
  assert.equal(updated.stock, 2); assert.equal(updated.reserved, 0);
});

test('an interrupted Stripe response can be recovered without a second order or reservation', async () => {
  const p = await product(2); const key = randomUUID();
  let interrupted = true;
  const networkStripe = { checkout: { sessions: { ...fakeStripe.checkout.sessions,
    create: async (params: Stripe.Checkout.SessionCreateParams, options: { idempotencyKey: string }) => {
      const session = await fakeStripe.checkout.sessions.create(params, options);
      if (interrupted) { interrupted = false; throw new Error('Simulated lost response'); }
      return session;
    },
  } } } as unknown as Stripe;
  const lines = [{ slug: p.slug, grind: 'Boabe', quantity: 1 }];
  await assert.rejects(commerce.createCheckout(lines, key, networkStripe, cms));
  await commerce.createCheckout(lines, key, networkStripe, cms);
  assert.equal((await cms.findByID({ collection: 'products', id: p.id })).reserved, 1);
  const orders = await cms.find({ collection: 'orders', where: { reference: { equals: `MK-${key}` } } });
  assert.equal(orders.docs.length, 0);
  assert.ok(await reservation(`MK-${key}`));
});

test('webhook rejects an unsigned or forged request', async () => {
  const { POST } = await import('../../src/app/api/stripe/webhook/route');
  assert.equal((await POST(new Request('http://localhost/api/stripe/webhook', { method: 'POST', body: '{}' }))).status, 400);
  assert.equal((await POST(new Request('http://localhost/api/stripe/webhook', { method: 'POST', headers: { 'stripe-signature': 'invalid' }, body: '{}' }))).status, 400);
});

test('many simultaneous retries create only one Stripe session and one reservation', async () => {
  const p = await product(5), key = randomUUID(), beforeCreates = creates;
  let activeCreates = 0;
  const slowStripe = { checkout: { sessions: { ...fakeStripe.checkout.sessions,
    create: async (params: Stripe.Checkout.SessionCreateParams, options: { idempotencyKey: string }) => {
      assert.equal(activeCreates++, 0, 'Stripe creation must be serialized by PostgreSQL');
      try {
        await new Promise(resolve => setTimeout(resolve, 30));
        return await fakeStripe.checkout.sessions.create(params, options);
      } finally { activeCreates--; }
    },
  } } } as unknown as Stripe;
  const results = await Promise.all(Array.from({ length: 12 }, () => commerce.createCheckout([
    { slug: p.slug, grind: 'Boabe', quantity: 2 },
  ], key, slowStripe, cms)));
  assert.equal(new Set(results.map(r => r.url)).size, 1);
  assert.equal(creates, beforeCreates + 1);
  assert.equal((await cms.findByID({ collection: 'products', id: p.id })).reserved, 2);
});

test('out-of-stock, inactive, and negative-quantity orders never open Stripe checkout', async () => {
  const empty = await product(0), inactive = await product(5), available = await product(5);
  await cms.update({ collection: 'products', id: inactive.id, data: { active: false } });
  const beforeCreates = creates;
  for (const [p, quantity] of [[empty, 1], [inactive, 1], [available, -1]] as const) {
    await assert.rejects(commerce.createCheckout([{ slug: p.slug, grind: 'Boabe', quantity }], randomUUID(), fakeStripe, cms));
    assert.equal((await cms.findByID({ collection: 'products', id: p.id })).reserved, 0);
  }
  assert.equal(creates, beforeCreates);
});

test('many competing buyers cannot oversell and paid retries cannot create a second payment', async () => {
  const p = await product(3), beforeCreates = creates;
  const buyerKeys = Array.from({ length: 15 }, () => randomUUID());
  const results = await Promise.allSettled(buyerKeys.map(key => commerce.createCheckout([
    { slug: p.slug, grind: 'Boabe', quantity: 1 },
  ], key, fakeStripe, cms)));
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 3);
  const winners = buyerKeys.filter((_, i) => results[i].status === 'fulfilled');
  await Promise.all(winners.flatMap(key => {
    const session = keys.get(`MK-${key}`)!;
    session.status = 'complete'; session.payment_status = 'paid';
    return Array.from({ length: 5 }, () => commerce.applySession(session, cms));
  }));
  const updated = await cms.findByID({ collection: 'products', id: p.id });
  assert.equal(updated.stock, 0); assert.equal(updated.reserved, 0);
  await assert.rejects(commerce.createCheckout([{ slug: p.slug, grind: 'Boabe', quantity: 1 }], winners[0], fakeStripe, cms));
  assert.equal(creates, beforeCreates + 3);
});

test('a webhook arriving during Stripe creation waits for the session ID to be persisted', async () => {
  const p = await product(1), key = randomUUID();
  let webhook: Promise<unknown> | undefined;
  const earlyWebhookStripe = { checkout: { sessions: { ...fakeStripe.checkout.sessions,
    create: async (params: Stripe.Checkout.SessionCreateParams, options: { idempotencyKey: string }) => {
      const session = await fakeStripe.checkout.sessions.create(params, options);
      webhook = commerce.applySession({ ...session, status: 'complete', payment_status: 'paid' }, cms);
      await new Promise(resolve => setTimeout(resolve, 30));
      return session;
    },
  } } } as unknown as Stripe;
  await commerce.createCheckout([{ slug: p.slug, grind: 'Boabe', quantity: 1 }], key, earlyWebhookStripe, cms);
  await webhook;
  const updated = await cms.findByID({ collection: 'products', id: p.id });
  assert.equal(updated.stock, 0); assert.equal(updated.reserved, 0);
});

test('an order-save failure rolls back stock deductions and a retry settles exactly once', async () => {
  const p = await product(2), key = randomUUID();
  await commerce.createCheckout([{ slug: p.slug, grind: 'Boabe', quantity: 1 }], key, fakeStripe, cms);
  const session = { ...keys.get(`MK-${key}`)!, status: 'complete', payment_status: 'paid' } as Stripe.Checkout.Session;
  const failingCMS = new Proxy(cms, { get(target, name) {
    if (name === 'create') return async (args: { collection: string; data: { status?: string } }) => {
      if (args.collection === 'orders' && args.data.status === 'paid') throw new Error('Simulated database write failure');
      return target.create(args as Parameters<Payload['create']>[0]);
    };
    const value = Reflect.get(target, name);
    return typeof value === 'function' ? value.bind(target) : value;
  } });
  await assert.rejects(commerce.applySession(session, failingCMS));
  const unchanged = await cms.findByID({ collection: 'products', id: p.id });
  assert.equal(unchanged.stock, 2); assert.equal(unchanged.reserved, 1);
  await commerce.applySession(session, cms);
  await commerce.applySession(session, cms);
  const settled = await cms.findByID({ collection: 'products', id: p.id });
  assert.equal(settled.stock, 1); assert.equal(settled.reserved, 0);
});

test('database constraints reject negative stock and stock below an active reservation', async () => {
  const p = await product(2), key = randomUUID();
  await commerce.createCheckout([{ slug: p.slug, grind: 'Boabe', quantity: 1 }], key, fakeStripe, cms);
  const db = (cms.db as unknown as PostgresAdapter).drizzle;
  await assert.rejects(db.execute(sql`UPDATE products SET stock = -1 WHERE id = ${p.id}`));
  await assert.rejects(db.execute(sql`UPDATE products SET stock = 0 WHERE id = ${p.id}`));
  assert.equal((await cms.findByID({ collection: 'products', id: p.id })).reserved, 1);
});

test('an admin edit waits for the inventory row lock and preserves server reservations', async () => {
  const p = await product(5);
  const adapter = cms.db as unknown as PostgresAdapter;
  const transactionID = await cms.db.beginTransaction();
  assert.ok(transactionID != null);
  await adapter.sessions[String(transactionID)].db.execute(sql`UPDATE products SET reserved = 1 WHERE id = ${p.id}`);
  let completed = false;
  const edit = cms.update({ collection: 'products', id: p.id, data: { price: 59.99, reserved: 0 } }).then(result => {
    completed = true; return result;
  });
  await new Promise(resolve => setTimeout(resolve, 50));
  assert.equal(completed, false);
  await cms.db.commitTransaction(transactionID!);
  await edit;
  const updated = await cms.findByID({ collection: 'products', id: p.id });
  assert.equal(updated.reserved, 1); assert.equal(updated.price, 59.99);
});

test('production requests and payment retries are idempotent without consuming physical inventory',async()=>{
  const {parseProductionRequest,createProductionRequest,generateProductionPayment}=await import('../../src/lib/production-orders');
  const empty=await product(0),available=await product(5), key=randomUUID(), beforeCreates=creates;
  const input=parseProductionRequest({key,name:'Client test',email:'client@example.test',phone:'+40744123456',items:[
    {slug:empty.slug,grind:'Boabe',quantity:2},{slug:available.slug,grind:'Boabe',quantity:1}],note:'Confirmare telefonică'});
  await Promise.all(Array.from({length:5},()=>createProductionRequest(input,cms)));
  const found=await cms.find({collection:'orders',where:{reference:{equals:`MK-${key}`}},depth:0});
  assert.equal(found.docs.length,1);const order=found.docs[0];assert.equal(order.status,'requested');
  assert.equal(creates,beforeCreates);
  await assert.rejects(createProductionRequest({...input,phone:'+40744999999'},cms));
  await assert.rejects(cms.update({collection:'orders',id:order.id,data:{fulfillmentStatus:'processing'}}));
  await assert.rejects(generateProductionPayment(order.id,{unitPrices:[0,40],shipping:20},fakeStripe,cms));
  await Promise.all(Array.from({length:8},()=>generateProductionPayment(order.id,{unitPrices:[50,40],shipping:20},fakeStripe,cms)));
  assert.equal(creates,beforeCreates+1);
  const pending=await cms.findByID({collection:'orders',id:order.id});assert.equal(pending.totalBani,16000);
  await generateProductionPayment(order.id,{unitPrices:[1,1],shipping:0},fakeStripe,cms);
  assert.equal((await cms.findByID({collection:'orders',id:order.id})).totalBani,16000);
  const session=sessions.get(pending.stripeSessionId!)!;session.status='complete';session.payment_status='paid';
  await assert.rejects(commerce.applySession({...session,amount_total:1},cms));
  await Promise.all(Array.from({length:5},()=>commerce.applySession(session,cms)));
  const paid=await cms.findByID({collection:'orders',id:order.id});assert.equal(paid.status,'paid');assert.equal(paid.customerPhone,input.phone);
  await assert.rejects(generateProductionPayment(order.id,{unitPrices:[50,40],shipping:20},fakeStripe,cms));
  await cms.update({collection:'orders',id:order.id,data:{fulfillmentStatus:'processing'}});
  for(const p of [empty,available]) {
    const unchanged=await cms.findByID({collection:'products',id:p.id});assert.equal(unchanged.stock,p.stock);assert.equal(unchanged.reserved,0);
  }
});

test('production link regeneration ignores old expiration webhooks and recovers lost Stripe responses',async()=>{
  const {parseProductionRequest,createProductionRequest,generateProductionPayment}=await import('../../src/lib/production-orders');
  const p=await product(0),key=randomUUID();
  await createProductionRequest(parseProductionRequest({key,name:'Client test',email:'client@example.test',phone:'+40744123456',items:[{slug:p.slug,grind:'Boabe',quantity:1}]}),cms);
  const order=(await cms.find({collection:'orders',where:{reference:{equals:`MK-${key}`}},depth:0})).docs[0];
  let interrupted=true;
  const networkStripe={checkout:{sessions:{...fakeStripe.checkout.sessions,create:async(params:Stripe.Checkout.SessionCreateParams,options:{idempotencyKey:string})=>{
    const result=await fakeStripe.checkout.sessions.create(params,options);if(interrupted){interrupted=false;throw new Error('lost response');}return result;
  }}}} as unknown as Stripe;
  const beforeCreates=creates;
  await assert.rejects(generateProductionPayment(order.id,{unitPrices:[50],shipping:20},networkStripe,cms));
  await generateProductionPayment(order.id,{unitPrices:[1],shipping:0},networkStripe,cms);
  let saved=await cms.findByID({collection:'orders',id:order.id});assert.equal(saved.totalBani,7000);assert.equal(creates,beforeCreates+1);
  const old=sessions.get(saved.stripeSessionId!)!;old.status='expired';await commerce.applySession(old,cms);
  await Promise.all(Array.from({length:5},()=>generateProductionPayment(order.id,{unitPrices:[60],shipping:20},fakeStripe,cms)));
  saved=await cms.findByID({collection:'orders',id:order.id});assert.equal(saved.paymentAttempt,2);assert.equal(creates,beforeCreates+2);
  await commerce.applySession(old,cms);assert.equal((await cms.findByID({collection:'orders',id:order.id})).status,'pending');
});

test('production HTTP requests validate contact data, reject foreign origins, and deduplicate retries',async()=>{
  const {POST}=await import('../../src/app/api/orders/request/route');
  const p=await product(0),input={key:randomUUID(),name:'Client test',email:'client@example.test',phone:'+40744123456',termsAccepted:true,legalVersion:legal.version,items:[{slug:p.slug,grind:'Boabe',quantity:1}]};
  const request=(body:unknown,origin='http://localhost:3000')=>new Request('http://localhost:3000/api/orders/request',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
  assert.equal((await POST(request(input,'https://foreign.example'))).status,403);
  for(const change of [{termsAccepted:false},{termsAccepted:'true'},{legalVersion:'outdated'},{phone:''},{email:'bad'},{name:'x'},{website:'spam'},{items:[{slug:p.slug,grind:'Boabe',quantity:0}]}])assert.equal((await POST(request({...input,...change}))).status,400);
  for(let i=0;i<2;i++){const response=await POST(request(input));assert.equal(response.status,200);assert.deepEqual(await response.json(),{reference:`MK-${input.key}`});}
  assert.equal((await cms.find({collection:'orders',where:{reference:{equals:`MK-${input.key}`}}})).docs.length,1);
  const saved=(await cms.find({collection:'orders',where:{reference:{equals:`MK-${input.key}`}}})).docs[0];
  assert.equal(saved.legalVersion,legal.version);assert.ok(saved.legalAcceptedAt);
});

test('stock checkout rejects missing legal acknowledgement before reserving stock or contacting Stripe',async()=>{
  const {POST}=await import('../../src/app/api/checkout/route');
  const p=await product(3);const input={key:randomUUID(),items:[{slug:p.slug,grind:'Boabe',quantity:1}]};
  for(const extra of [{},{termsAccepted:false,legalVersion:legal.version},{termsAccepted:true,legalVersion:'outdated'}]){
    const response=await POST(new Request('http://localhost:3000/api/checkout',{method:'POST',headers:{origin:'http://localhost:3000','Content-Type':'application/json'},body:JSON.stringify({...input,...extra})}));
    assert.equal(response.status,400);
  }
  assert.equal((await cms.findByID({collection:'products',id:p.id})).reserved,0);
  const key=randomUUID();await commerce.createCheckout(input.items,key,fakeStripe,cms,legal.version);
  const first=await reservation(`MK-${key}`);
  await commerce.createCheckout(input.items,key,fakeStripe,cms,legal.version);
  const second=await reservation(`MK-${key}`);
  assert.equal(first.legalVersion,legal.version);assert.ok(first.legalAcceptedAt);
  assert.equal(second.legalAcceptedAt,first.legalAcceptedAt);
  await assert.rejects(commerce.createCheckout(input.items,key,fakeStripe,cms,'new-version'));
});

test('production payment-link endpoint requires an authenticated administrator',async()=>{
  const {POST}=await import('../../src/app/api/orders/payment-link/route');
  const response=await POST(new Request('http://localhost:3000/api/orders/payment-link',{method:'POST',headers:{origin:'http://localhost:3000','Content-Type':'application/json'},body:JSON.stringify({orderID:1,unitPrices:[0.01],shipping:0})}));
  assert.equal(response.status,401);
});

const checkoutDetails = (paymentMethod: 'card' | 'cod' = 'cod') => ({
  paymentMethod,
  contact: { name: 'Client Test', email: 'client@example.test', phone: '0712345678' },
  shipping: { line1: 'Strada Test 10', city: 'Cluj-Napoca', state: 'Cluj', postal_code: '400001', country: 'RO' as const },
  billing: { type: 'company' as const, companyName: 'Firma Test SRL', taxId: 'RO12345678', registrationNumber: 'J12/123/2020', address: 'Strada Sediului 5, Cluj-Napoca, Cluj' },
});

test('COD is atomic and retryable without Stripe; company billing is immutable and distinct from shipping', async () => {
  const p = await product(2), key = randomUUID(), details = checkoutDetails();
  const lines = [{ slug: p.slug, grind: 'Boabe', quantity: 1 }];
  const beforeCreates = creates;
  const outcomes = await Promise.all([
    commerce.createCheckout(lines, key, fakeStripe, cms, legal.version, details),
    commerce.createCheckout(lines, key, fakeStripe, cms, legal.version, details),
  ]);
  assert.deepEqual(outcomes[0], outcomes[1]);
  assert.equal(creates, beforeCreates);
  const order = (await cms.find({collection:'orders',where:{reference:{equals:`MK-${key}`}}})).docs[0];
  assert.equal(order.status,'cod_pending'); assert.equal(order.paymentMethod,'cod');
  assert.equal(order.totalBani,6999); assert.equal(order.stripeSessionId,null);
  const { parseCheckoutDetails } = await import('../../src/lib/checkout-details');
  assert.deepEqual(parseCheckoutDetails(order.checkoutDetails),details);
  const stock = await cms.findByID({collection:'products',id:p.id});
  assert.equal(stock.stock,1); assert.equal(stock.reserved,0);
  await assert.rejects(commerce.createCheckout(lines,key,fakeStripe,cms,legal.version,{...details,paymentMethod:'card'}));
  await assert.rejects(commerce.createCheckout(lines,key,fakeStripe,cms,legal.version,{...details,contact:{...details.contact,name:'Alt client'}}));
  await assert.rejects(commerce.createCheckout([{...lines[0],quantity:2}],randomUUID(),fakeStripe,cms,legal.version,details));
});

test('card checkout preserves the company snapshot after Stripe payment and settles stock once', async () => {
  const p = await product(3), key = randomUUID(), details = checkoutDetails('card');
  const lines = [{slug:p.slug,grind:'Boabe',quantity:1}];
  await commerce.createCheckout(lines,key,fakeStripe,cms,legal.version,details);
  await commerce.createCheckout(lines,key,fakeStripe,cms,legal.version,details);
  const session = keys.get(`MK-${key}`)!;
  const paid = {...session,status:'complete',payment_status:'paid',customer_details:{name:'Cardholder',email:'other@example.test',phone:null}} as Stripe.Checkout.Session;
  await commerce.applySession(paid,cms); await commerce.applySession(paid,cms);
  const saved = (await cms.find({collection:'orders',where:{reference:{equals:`MK-${key}`}}})).docs[0];
  assert.equal(saved.customerName,details.contact.name); assert.equal(saved.customerEmail,details.contact.email);
  assert.equal(saved.status,'paid');
  const {parseCheckoutDetails} = await import('../../src/lib/checkout-details');
  assert.deepEqual(parseCheckoutDetails(saved.checkoutDetails),details);
  const stock = await cms.findByID({collection:'products',id:p.id});
  assert.equal(stock.stock,2); assert.equal(stock.reserved,0);
});

test('COD cancellation restores stock once; verified collection is independent of fulfillment', async () => {
  const adapter = cms.db as unknown as PostgresAdapter;
  const {updateCashOnDelivery} = await import('../../src/lib/cod-orders');
  const p = await product(3), key=randomUUID();
  await commerce.createCheckout([{slug:p.slug,grind:'Boabe',quantity:2}],key,fakeStripe,cms,legal.version,checkoutDetails());
  const order=(await cms.find({collection:'orders',where:{reference:{equals:`MK-${key}`}}})).docs[0];
  await Promise.all([updateCashOnDelivery(cms,order.id,'cancel'),updateCashOnDelivery(cms,order.id,'cancel')]);
  assert.equal((await cms.findByID({collection:'products',id:p.id})).stock,3);
  const key2=randomUUID();
  await commerce.createCheckout([{slug:p.slug,grind:'Boabe',quantity:1}],key2,fakeStripe,cms,legal.version,checkoutDetails());
  const delivered=(await cms.find({collection:'orders',where:{reference:{equals:`MK-${key2}`}}})).docs[0];
  await adapter.drizzle.execute(sql`INSERT INTO order_shipments(order_id,environment,account_hash,attempt_id,state,request)
    VALUES (${delivered.id},'sandbox','test-account',${randomUUID()},'sending','{}'::jsonb)`);
  await assert.rejects(updateCashOnDelivery(cms,delivered.id,'cancel'));
  await updateCashOnDelivery(cms,delivered.id,'collect'); await updateCashOnDelivery(cms,delivered.id,'collect');
  const saved=await cms.findByID({collection:'orders',id:delivered.id});
  assert.equal(saved.status,'paid'); assert.ok(saved.codCollectedAt);
  assert.equal(saved.fulfillmentStatus,'new');
  assert.equal((await cms.findByID({collection:'products',id:p.id})).stock,2);
});

test('production COD confirms the quote without Stripe or deductions from physical stock', async () => {
  const {createProductionRequest,generateProductionPayment} = await import('../../src/lib/production-orders');
  const p=await product(0), key=randomUUID(), details=checkoutDetails();
  const input={key,name:details.contact.name,email:details.contact.email,phone:details.contact.phone,note:'',lines:[{slug:p.slug,grind:'Boabe',quantity:2}],details,legalVersion:legal.version};
  await createProductionRequest(input,cms);
  const order=(await cms.find({collection:'orders',where:{reference:{equals:`MK-${key}`}}})).docs[0];
  const beforeCreates=creates;
  const result=await generateProductionPayment(order.id,{unitPrices:[50],shipping:20},fakeStripe,cms);
  assert.equal(result.reference,order.reference);
  await generateProductionPayment(order.id,{unitPrices:[1],shipping:0},fakeStripe,cms);
  const saved=await cms.findByID({collection:'orders',id:order.id});
  assert.equal(saved.status,'cod_pending');assert.equal(saved.totalBani,12000);assert.equal(saved.stripeSessionId,null);
  assert.equal(creates,beforeCreates); assert.equal((await cms.findByID({collection:'products',id:p.id})).stock,0);
  await cms.update({collection:'orders',id:order.id,data:{fulfillmentStatus:'processing'}});
});

test('stock COD is available without Stripe credentials and does not depend on online payment configuration', async () => {
  const secret=process.env.STRIPE_SECRET_KEY, webhook=process.env.STRIPE_WEBHOOK_SECRET;
  const p=await product(1),key=randomUUID();
  try {
    delete process.env.STRIPE_SECRET_KEY; delete process.env.STRIPE_WEBHOOK_SECRET;
    const result=await commerce.createCheckout([{slug:p.slug,grind:'Boabe',quantity:1}],key,undefined,cms,legal.version,checkoutDetails());
    assert.equal(result.paymentMethod,'cod');
    assert.equal((await cms.findByID({collection:'products',id:p.id})).stock,0);
  } finally { process.env.STRIPE_SECRET_KEY=secret;process.env.STRIPE_WEBHOOK_SECRET=webhook; }
});


test('abandoned card attempts are hidden while active and removed entirely on return; real orders remain visible',async()=>{
  const p=await product(4), key=randomUUID(), user={id:999,collection:'users' as const,email:'admin@example.test'};
  await commerce.createCheckout([{slug:p.slug,grind:'Boabe',quantity:1}],key,fakeStripe,cms);
  const query={collection:'orders' as const,where:{reference:{equals:`MK-${key}`}},overrideAccess:false,user};
  assert.equal((await cms.find(query)).totalDocs,0);
  assert.equal((await cms.count(query)).totalDocs,0);
  await commerce.cancelCheckout(key,fakeStripe,cms);
  assert.equal((await cms.count({...query,overrideAccess:true})).totalDocs,0);
  const paidKey=randomUUID();
  await commerce.createCheckout([{slug:p.slug,grind:'Boabe',quantity:1}],paidKey,fakeStripe,cms);
  const session=keys.get(`MK-${paidKey}`)!;
  await commerce.applySession({...session,status:'complete',payment_status:'paid'},cms);
  assert.equal((await cms.find({...query,where:{reference:{equals:`MK-${paidKey}`}}})).totalDocs,1);
  const codKey=randomUUID();
  await commerce.createCheckout([{slug:p.slug,grind:'Boabe',quantity:1}],codKey,fakeStripe,cms,legal.version,checkoutDetails());
  assert.equal((await cms.find({...query,where:{reference:{equals:`MK-${codKey}`}}})).totalDocs,1);
});

test('a payment completing during Back wins over cancellation and remains recorded once',async()=>{
  const p=await product(2),key=randomUUID();
  await commerce.createCheckout([{slug:p.slug,grind:'Boabe',quantity:1}],key,fakeStripe,cms);
  const raceStripe={checkout:{sessions:{...fakeStripe.checkout.sessions,expire:async(id:string)=>{
    const session=sessions.get(id)!;session.status='complete';session.payment_status='paid';
    throw new Error('Session is already complete');
  }}}} as unknown as Stripe;
  const result=await commerce.cancelCheckout(key,raceStripe,cms);
  assert.equal(result.paid,true);assert.match(result.url!,/session_id=/);
  const saved=(await cms.find({collection:'orders',where:{reference:{equals:`MK-${key}`}}})).docs[0];
  assert.equal(saved.status,'paid');
  await commerce.cancelCheckout(key,raceStripe,cms);
  const stock=await cms.findByID({collection:'products',id:p.id});
  assert.equal(stock.stock,1);assert.equal(stock.reserved,0);
});

test('old abandoned drafts are deleted without touching made-to-order requests',async()=>{
  const p=await product(1);
  const create=async(reference:string,orderType:'stock'|'production')=>cms.create({collection:'orders',data:{reference,orderType,fulfillmentStatus:'new',paymentMethod:'card',status:'expired',currency:'ron',totalBani:1000,shippingBani:0,items:[{product:p.id,slug:p.slug,name:p.name,grind:'Boabe',quantity:1,unitPriceBani:1000}]}});
  const stock=await create(`MK-${randomUUID()}`,'stock'),production=await create(`MK-${randomUUID()}`,'production');
  await commerce.pruneAbandonedCheckouts(cms);
  assert.equal((await cms.count({collection:'orders',where:{id:{equals:stock.id}}})).totalDocs,0);
  assert.equal((await cms.findByID({collection:'orders',id:production.id})).status,'expired');
});

test('legacy drafts with notification history remain intact while unreferenced drafts are pruned',async()=>{
  const p=await product(1);
  const create=async()=>cms.create({collection:'orders',data:{reference:`MK-${randomUUID()}`,orderType:'stock',fulfillmentStatus:'new',paymentMethod:'card',status:'expired',currency:'ron',totalBani:1000,shippingBani:0,items:[{product:p.id,slug:p.slug,name:p.name,grind:'Boabe',quantity:1,unitPriceBani:1000}]}});
  const protectedOrder=await create(),unreferenced=await create();
  const db=(cms.db as unknown as PostgresAdapter).drizzle;
  await db.execute(sql`INSERT INTO order_status_emails(event_id,order_id,target_status,body)
    VALUES (${randomUUID()},${protectedOrder.id},'new',${JSON.stringify({to:[],subject:'Legacy notification'})}::jsonb)`);
  await commerce.pruneAbandonedCheckouts(cms);
  assert.equal((await cms.findByID({collection:'orders',id:protectedOrder.id})).status,'expired');
  assert.equal((await db.execute(sql`SELECT id FROM order_status_emails WHERE order_id=${protectedOrder.id}`)).rows.length,1);
  assert.equal((await cms.count({collection:'orders',where:{id:{equals:unreferenced.id}}})).totalDocs,0);
  await commerce.pruneAbandonedCheckouts(cms);
});

test('card attempts never create orders, even with admin access; only verified payment registers one', async () => {
  const p = await product(2), key = randomUUID(), reference = `MK-${key}`;
  await commerce.createCheckout([{slug:p.slug,grind:'Boabe',quantity:1}], key, fakeStripe, cms, legal.version, checkoutDetails('card'));
  const count = () => cms.count({collection:'orders',where:{reference:{equals:reference}},overrideAccess:true});
  assert.equal((await count()).totalDocs, 0);
  const session = keys.get(reference)!;
  await commerce.applySession({...session,status:'complete',payment_status:'unpaid'},cms);
  assert.equal((await count()).totalDocs, 0);
  await Promise.all(Array.from({length:4},()=>commerce.applySession({...session,status:'complete',payment_status:'paid'},cms)));
  assert.equal((await count()).totalDocs, 1);
  assert.equal(await reservation(reference), undefined);
  const saved=(await cms.find({collection:'orders',where:{reference:{equals:reference}}})).docs[0];
  assert.equal(saved.status,'paid');assert.equal(saved.legalVersion,legal.version);
  assert.deepEqual(saved.checkoutDetails,checkoutDetails('card'));
});

test('closing the browser without returning creates no order; Stripe expiry releases the reservation', async () => {
  const p=await product(2),key=randomUUID(),reference=`MK-${key}`;
  await commerce.createCheckout([{slug:p.slug,grind:'Boabe',quantity:1}],key,fakeStripe,cms);
  const session=keys.get(reference)!;session.status='expired';
  await (cms.db as unknown as PostgresAdapter).drizzle.execute(sql`UPDATE checkout_reservations SET expires_at = now() - interval '1 minute' WHERE reference = ${reference}`);
  await commerce.reconcileExpired(cms,fakeStripe);
  assert.equal((await cms.count({collection:'orders',where:{reference:{equals:reference}}})).totalDocs,0);
  assert.equal(await reservation(reference),undefined);
  const inventory=await cms.findByID({collection:'products',id:p.id});
  assert.equal(inventory.stock,2);assert.equal(inventory.reserved,0);
});

test('legacy card checkouts already open before deployment can still settle', async () => {
  const p=await product(1),key=randomUUID(),reference=`MK-${key}`;
  await commerce.createCheckout([{slug:p.slug,grind:'Boabe',quantity:1}],key,fakeStripe,cms);
  const {id:_,createdAt:__,updatedAt:___,...snapshot}=await reservation(reference);
  await cms.create({collection:'orders',data:snapshot});
  await (cms.db as unknown as PostgresAdapter).drizzle.execute(sql`DELETE FROM checkout_reservations WHERE reference=${reference}`);
  await commerce.applySession({...keys.get(reference)!,status:'complete',payment_status:'paid'},cms);
  const saved=(await cms.find({collection:'orders',where:{reference:{equals:reference}}})).docs[0];
  assert.equal(saved.status,'paid');
  assert.equal((await cms.findByID({collection:'products',id:p.id})).stock,0);
});

test('expiring a legacy checkout with email history releases stock and retains its order', async () => {
  const p=await product(1),key=randomUUID(),reference=`MK-${key}`;
  await commerce.createCheckout([{slug:p.slug,grind:'Boabe',quantity:1}],key,fakeStripe,cms);
  const {id:_,createdAt:__,updatedAt:___,...snapshot}=await reservation(reference);
  const legacy=await cms.create({collection:'orders',data:snapshot});
  const db=(cms.db as unknown as PostgresAdapter).drizzle;
  await db.execute(sql`DELETE FROM checkout_reservations WHERE reference=${reference}`);
  await db.execute(sql`INSERT INTO order_status_emails(event_id,order_id,target_status,body)
    VALUES (${randomUUID()},${legacy.id},'new',${JSON.stringify({to:[],subject:'Legacy notification'})}::jsonb)`);
  await commerce.applySession({...keys.get(reference)!,status:'expired'},cms);
  assert.equal((await cms.findByID({collection:'orders',id:legacy.id})).status,'expired');
  assert.equal((await cms.findByID({collection:'products',id:p.id})).stock,1);
  assert.equal((await cms.findByID({collection:'products',id:p.id})).reserved,0);
  assert.equal((await db.execute(sql`SELECT id FROM order_status_emails WHERE order_id=${legacy.id}`)).rows.length,1);
  await commerce.pruneAbandonedCheckouts(cms);
});

test('made-to-order checkout saves canonical customer details before quoting, reuses its payment link and keeps the request on cancellation', async () => {
  const {parseProductionRequest,createProductionRequest,generateProductionPayment}=await import('../../src/lib/production-orders');
  const p=await product(0),key=randomUUID(),details=checkoutDetails('card');
  const input=parseProductionRequest({key,details,items:[{slug:p.slug,grind:'Boabe',quantity:2}],note:'Contact telefonic pentru termen.'});
  const {reference}=await createProductionRequest({...input,legalVersion:legal.version},cms);
  const order=(await cms.find({collection:'orders',where:{reference:{equals:reference}}})).docs[0];
  assert.equal(order.status,'requested');assert.equal(order.customerPhone,details.contact.phone);
  assert.equal(order.customerEmail,details.contact.email);assert.equal(order.customerName,details.contact.name);
  assert.deepEqual(order.checkoutDetails,details);
  const quote={unitPrices:[64.5],shipping:20};
  const link=await generateProductionPayment(order.id,quote,fakeStripe,cms);
  assert.ok(link.url);assert.deepEqual(await generateProductionPayment(order.id,quote,fakeStripe,cms),link);
  const pending=await cms.findByID({collection:'orders',id:order.id});
  const session=sessions.get(pending.stripeSessionId!)!;
  await commerce.applySession({...session,status:'expired'},cms);
  assert.equal((await cms.findByID({collection:'orders',id:order.id})).status,'expired');
  const regenerated=await generateProductionPayment(order.id,quote,fakeStripe,cms);assert.ok(regenerated.url);
  const renewed=await cms.findByID({collection:'orders',id:order.id});
  await commerce.applySession({...sessions.get(renewed.stripeSessionId!)!,status:'complete',payment_status:'paid'},cms);
  const paid=await cms.findByID({collection:'orders',id:order.id});
  assert.equal(paid.status,'paid');assert.equal(paid.totalBani,14900);assert.deepEqual(paid.checkoutDetails,details);
  const inventory=await cms.findByID({collection:'products',id:p.id});assert.equal(inventory.stock,0);assert.equal(inventory.reserved,0);
});

test('old reservation columns remain compatible; settled legacy rows never block catalog recovery', async () => {
  const db=(cms.db as unknown as PostgresAdapter).drizzle;
  await db.execute(sql`ALTER TABLE checkout_reservations ADD COLUMN IF NOT EXISTS status varchar DEFAULT 'pending', ADD COLUMN IF NOT EXISTS stripe_session_id varchar, ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now()`);
  for(const status of ['expired','paid']) {
    await db.execute(sql`INSERT INTO checkout_reservations(reference,snapshot,expires_at,status) VALUES (${'legacy-'+status}, ${JSON.stringify({reference:'legacy-'+status})}::jsonb,now()-interval '1 hour',${status})`);
  }
  const p=await product(3);
  for(const target of ['expired','paid'] as const) {
    const key=randomUUID(),reference=`MK-${key}`;
    await commerce.createCheckout([{slug:p.slug,grind:'Boabe',quantity:1}],key,fakeStripe,cms);
    const session=keys.get(reference)!;
    await db.execute(sql`UPDATE checkout_reservations SET stripe_session_id=${session.id},
      snapshot=snapshot-ARRAY['id','createdAt','updatedAt','status','paymentMethod','orderType','fulfillmentStatus','stripeSessionId','expiresAt'],
      expires_at=now()-interval '1 minute' WHERE reference=${reference}`);
    session.status=target==='paid'?'complete':'expired';session.payment_status=target==='paid'?'paid':'unpaid';
    await commerce.reconcileExpired(cms,fakeStripe);
    assert.equal(await reservation(reference),undefined);
    assert.equal((await cms.count({collection:'orders',where:{reference:{equals:reference}}})).totalDocs,target==='paid'?1:0);
  }
  assert.equal((await cms.findByID({collection:'products',id:p.id})).stock,2);
  assert.equal((await cms.findByID({collection:'products',id:p.id})).reserved,0);
});

test('catalog still lists products when Stripe reservation maintenance fails', async () => {
  const key=randomUUID(),p=await product(1),reference=`MK-${key}`;
  await commerce.createCheckout([{slug:p.slug,grind:'Boabe',quantity:1}],key,fakeStripe,cms);
  await (cms.db as unknown as PostgresAdapter).drizzle.execute(sql`UPDATE checkout_reservations SET expires_at=now()-interval '1 minute' WHERE reference=${reference}`);
  const db=(cms.db as unknown as PostgresAdapter).drizzle;
  await db.execute(sql`ALTER TABLE checkout_reservations RENAME TO checkout_reservations_fixture`);
  try {
    const {GET}=await import('../../src/app/api/catalog/route');
    const response=await GET();
    assert.equal(response.status,200);
    const catalog=await response.json();
    assert.ok(catalog.products.some((product: {slug:string})=>product.slug===p.slug));
    assert.equal((await cms.findByID({collection:'products',id:p.id})).reserved,1);
    assert.equal((await cms.count({collection:'orders',where:{reference:{equals:reference}}})).totalDocs,0);
  } finally {
    await db.execute(sql`ALTER TABLE checkout_reservations_fixture RENAME TO checkout_reservations`);
  }
});

test('card, COD and made-to-order checkouts persist the verified easybox and server delivery fee',async()=>{
  const names=['SAMEDAY_ENV','SAMEDAY_USERNAME','SAMEDAY_PASSWORD','SAMEDAY_LOCKER_CLIENT_ID','SAMEDAY_LOCKER_API_USERNAME','EASYBOX_SHIPPING_PRICE_BANI'];
  const previous=Object.fromEntries(names.map(name=>[name,process.env[name]]));
  Object.assign(process.env,{SAMEDAY_ENV:'production',SAMEDAY_USERNAME:'easybox-'+randomUUID(),SAMEDAY_PASSWORD:'test-only',SAMEDAY_LOCKER_CLIENT_ID:'map-test',SAMEDAY_LOCKER_API_USERNAME:'public-map-user',EASYBOX_SHIPPING_PRICE_BANI:'1800'});
  const locker={id:1413,name:'easybox Verified',address:'Strada Locker 10',city:'Cluj-Napoca',county:'Cluj',postalCode:'400001',supportedPayment:true};
  const deliveryFetcher=(async(url:string|URL|Request)=>String(url).endsWith('/api/authenticate')?Response.json({token:'test-token'}):Response.json({data:[{...locker,lockerId:locker.id,clientVisible:1,supportedPayment:1}]})) as typeof fetch;
  const details=(method:'card'|'cod')=>({...checkoutDetails(method),shipping:{...checkoutDetails(method).shipping,method:'easybox' as const,locker:{...locker,name:'Forged name',address:'Wrong street 100'}}});
  try{
    const p=await product(4);
    for(const method of ['card','cod'] as const){
      const key=randomUUID(),reference=`MK-${key}`;
      const result=await commerce.createCheckout([{slug:p.slug,grind:'Boabe',quantity:1}],key,fakeStripe,cms,legal.version,details(method),deliveryFetcher);
      if(method==='card'){
        assert.equal((await cms.count({collection:'orders',where:{reference:{equals:reference}}})).totalDocs,0);
        const draft=await reservation(reference);assert.equal(draft.shippingBani,1800);
        await commerce.applySession({...keys.get(reference)!,status:'complete',payment_status:'paid'},cms);
      }else assert.equal(result.paymentMethod,'cod');
      const saved=(await cms.find({collection:'orders',where:{reference:{equals:reference}}})).docs[0];
      assert.equal(saved.shippingBani,1800);assert.equal(saved.totalBani,6799);
      const snapshot=saved.checkoutDetails as unknown as import('../../src/lib/checkout-details').CheckoutDetails;
      assert.deepEqual(snapshot.shipping.locker,locker);assert.equal(snapshot.shipping.line1,locker.address);
      assert.equal(snapshot.billing.address,checkoutDetails(method).billing.address);
    }
    const {parseProductionRequest,createProductionRequest}=await import('../../src/lib/production-orders');
    const input=parseProductionRequest({key:randomUUID(),details:details('card'),items:[{slug:p.slug,grind:'Boabe',quantity:6}]});
    const request=await createProductionRequest(input,cms,deliveryFetcher);
    const saved=(await cms.find({collection:'orders',where:{reference:{equals:request.reference}}})).docs[0];
    assert.equal(saved.status,'requested');
    assert.deepEqual((saved.checkoutDetails as unknown as import('../../src/lib/checkout-details').CheckoutDetails).shipping.locker,locker);
    const inventory=await cms.findByID({collection:'products',id:p.id});assert.equal(inventory.stock,2);assert.equal(inventory.reserved,0);
  }finally{for(const name of names){if(previous[name]===undefined)delete process.env[name];else process.env[name]=previous[name];}}
});

test('new order emails queue once for paid card, COD and requests; abandoned checkout never queues', async () => {
  const db=(cms.db as unknown as PostgresAdapter).drizzle;
  const events=async(id:number)=> (await db.execute(sql`SELECT * FROM order_status_emails WHERE order_id=${id} AND audience='merchant'`)).rows;
  const p=await product(5),cardKey=randomUUID();
  await commerce.createCheckout([{slug:p.slug,grind:'Boabe',quantity:1}],cardKey,fakeStripe,cms,legal.version,checkoutDetails('card'));
  assert.equal((await cms.count({collection:'orders',where:{reference:{equals:`MK-${cardKey}`}}})).totalDocs,0);
  assert.equal((await db.execute(sql`SELECT * FROM order_status_emails WHERE body->>'subject' LIKE ${`%MK-${cardKey}%`}`)).rows.length,0);
  const paid={...keys.get(`MK-${cardKey}`)!,status:'complete',payment_status:'paid'} as Stripe.Checkout.Session;
  await commerce.applySession(paid,cms); await commerce.applySession(paid,cms);
  const card=(await cms.find({collection:'orders',where:{reference:{equals:`MK-${cardKey}`}}})).docs[0];
  assert.equal((await events(card.id)).length,1);
  const codKey=randomUUID();
  for(let i=0;i<2;i++)await commerce.createCheckout([{slug:p.slug,grind:'Boabe',quantity:1}],codKey,fakeStripe,cms,legal.version,checkoutDetails('cod'));
  const cod=(await cms.find({collection:'orders',where:{reference:{equals:`MK-${codKey}`}}})).docs[0];
  assert.equal((await events(cod.id)).length,1);
  const {parseProductionRequest,createProductionRequest}=await import('../../src/lib/production-orders');
  const input=parseProductionRequest({key:randomUUID(),details:checkoutDetails('card'),items:[{slug:p.slug,grind:'Boabe',quantity:9}]});
  const request=await createProductionRequest(input,cms);await createProductionRequest(input,cms);
  const requested=(await cms.find({collection:'orders',where:{reference:{equals:request.reference}}})).docs[0];
  assert.equal((await events(requested.id)).length,1);
  await cms.update({collection:'orders',id:requested.id,data:{status:'paid'}});
  assert.equal((await events(requested.id)).length,1);
  const reference=`MK-${randomUUID()}`;
  await assert.rejects(commerce.transaction(cms,async transactionID=>{
    const {id:_,createdAt:__,updatedAt:___,...data}=cod;
    await cms.create({collection:'orders',req:{transactionID},data:{...data,reference,items:data.items.map(({id:_,...item})=>item)}});
    throw new Error('rollback fixture');
  }),/rollback fixture/);
  assert.equal((await db.execute(sql`SELECT * FROM order_status_emails WHERE body->>'subject' LIKE ${`%${reference}%`}`)).rows.length,0);
});

test('merchant delivery preserves snapshot and idempotency after timeout and concurrent retries',async()=>{
  const names=['RESEND_API_KEY','RESEND_FROM_EMAIL','ORDER_NOTIFICATION_EMAIL_TO','CONTACT_EMAIL_TO'];
  const previous=Object.fromEntries(names.map(name=>[name,process.env[name]]));
  Object.assign(process.env,{RESEND_API_KEY:'fake-key',RESEND_FROM_EMAIL:'Makeon <orders@example.test>',ORDER_NOTIFICATION_EMAIL_TO:'owner@example.test'});
  try{
    const p=await product(2),key=randomUUID();
    const details=checkoutDetails('cod');details.contact.name='<script>Test</script>';
    await commerce.createCheckout([{slug:p.slug,grind:'Boabe',quantity:1}],key,fakeStripe,cms,legal.version,details);
    const order=(await cms.find({collection:'orders',where:{reference:{equals:`MK-${key}`}}})).docs[0];
    const emails=await import('../../src/lib/order-status-email');
    const requests:RequestInit[]=[];
    await emails.deliverOrderStatusEmails(cms,order.id,(async(_url,init)=>{requests.push(init!);throw new Error('timeout');}) as typeof fetch);
    process.env.ORDER_NOTIFICATION_EMAIL_TO='different@example.test';
    const fetcher=(async(_url:unknown,init:RequestInit)=>{requests.push(init);return Response.json({id:'fake-email-id'});}) as typeof fetch;
    await Promise.all([emails.deliverOrderStatusEmails(cms,order.id,fetcher),emails.deliverOrderStatusEmails(cms,order.id,fetcher)]);
    await emails.deliverOrderStatusEmails(cms,order.id,fetcher);
    assert.equal(requests.length,2);
    assert.deepEqual(requests[0].headers,requests[1].headers);
    assert.equal(requests[0].body,requests[1].body);
    const body=JSON.parse(String(requests[0].body));
    assert.deepEqual(body.to,['owner@example.test']);
    assert.ok(body.html.includes('&lt;script&gt;Test&lt;/script&gt;'));assert.ok(!body.html.includes('<script>'));
    assert.ok(body.text.includes('Ramburs de încasat'));assert.ok(body.text.includes(`/admin/collections/orders/${order.id}`));
    const history=await emails.orderStatusEmailHistory(cms,order.id);
    assert.equal(history[0].audience,'merchant');assert.equal(history[0].state,'sent');
  }finally{for(const name of names){if(previous[name]===undefined)delete process.env[name];else process.env[name]=previous[name];}}
});

test('an unconfigured merchant recipient does not block customer status emails and can be retried later',async()=>{
  const names=['RESEND_API_KEY','RESEND_FROM_EMAIL','ORDER_NOTIFICATION_EMAIL_TO','CONTACT_EMAIL_TO'];
  const previous=Object.fromEntries(names.map(name=>[name,process.env[name]]));
  Object.assign(process.env,{RESEND_API_KEY:'fake-key',RESEND_FROM_EMAIL:'Makeon <orders@example.test>'});
  delete process.env.ORDER_NOTIFICATION_EMAIL_TO;delete process.env.CONTACT_EMAIL_TO;
  try{
    const p=await product(2),key=randomUUID();
    await commerce.createCheckout([{slug:p.slug,grind:'Boabe',quantity:1}],key,fakeStripe,cms,legal.version,checkoutDetails('cod'));
    const order=(await cms.find({collection:'orders',where:{reference:{equals:`MK-${key}`}}})).docs[0];
    await cms.update({collection:'orders',id:order.id,data:{fulfillmentStatus:'processing'},req:{user:{id:999,collection:'users',email:'admin@example.test',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},context:{skipStatusEmailDispatch:true}}});
    const emails=await import('../../src/lib/order-status-email');
    const recipients:string[][]=[];
    const fetcher=(async(_url:unknown,init:RequestInit)=>{recipients.push(JSON.parse(String(init.body)).to);return Response.json({id:'fake-id'});}) as typeof fetch;
    await emails.deliverOrderStatusEmails(cms,order.id,fetcher);
    assert.deepEqual(recipients,[['client@example.test']]);
    let history=await emails.orderStatusEmailHistory(cms,order.id);
    assert.equal(history.find(event=>event.audience==='merchant')?.state,'failed');
    assert.equal(history.find(event=>event.audience==='customer')?.state,'sent');
    process.env.CONTACT_EMAIL_TO='owner@example.test';
    await emails.deliverOrderStatusEmails(cms,order.id,fetcher);
    assert.deepEqual(recipients,[['client@example.test'],['owner@example.test']]);
    history=await emails.orderStatusEmailHistory(cms,order.id);
    assert.ok(history.every(event=>event.state==='sent'));
  }finally{for(const name of names){if(previous[name]===undefined)delete process.env[name];else process.env[name]=previous[name];}}
});

test('Google product migration preserves inventory and prices and refuses to discard populated identifiers',async()=>{
  const db=(cms.db as unknown as PostgresAdapter).drizzle;
  const before=(await db.execute(sql`SELECT id,slug,price,stock,reserved FROM products ORDER BY id`)).rows;
  await db.execute(sql`ALTER TABLE products DROP COLUMN brand, DROP COLUMN gtin, DROP COLUMN mpn, DROP COLUMN identifiers_absent, DROP COLUMN google_enabled`);
  const migration=await import('../../src/migrations/20261106_120000_google_product_identifiers');
  await migration.up({db} as Parameters<typeof migration.up>[0]);
  assert.deepEqual((await db.execute(sql`SELECT id,slug,price,stock,reserved FROM products ORDER BY id`)).rows,before);
  const p=await product(3);
  await cms.update({collection:'products',id:p.id,data:{brand:'SwitchMORN Coffee',gtin:'5901234123457'}});
  await assert.rejects(migration.down({db} as Parameters<typeof migration.down>[0]),/Cannot remove populated/);
  assert.equal((await cms.findByID({collection:'products',id:p.id})).gtin,'5901234123457');
});

test('admin validates manufacturer identifiers without changing sellable stock or hiding products from the storefront',async()=>{
  const p=await product(3);
  await assert.rejects(cms.update({collection:'products',id:p.id,data:{gtin:'5901234123458'}}));
  await cms.update({collection:'products',id:p.id,data:{identifiersAbsent:true}});
  await assert.rejects(cms.update({collection:'products',id:p.id,data:{gtin:'5901234123457'}}));
  const saved=await cms.update({collection:'products',id:p.id,data:{identifiersAbsent:false,gtin:' 5901234123457 ',brand:' Marca reală ',googleEnabled:false}});
  assert.equal(saved.gtin,'5901234123457');assert.equal(saved.brand,'Marca reală');
  assert.equal(saved.active,true);assert.equal(saved.googleEnabled,false);
  assert.equal(saved.stock,3);assert.equal(saved.reserved,0);
  const {publicProduct}=await import('../../src/lib/storefront');
  const publicData=publicProduct(saved);
  assert.equal(publicData.gtin,saved.gtin);assert.equal(publicData.stock,3);assert.equal(publicData.googleEnabled,false);
});

test('SKU backfill preserves existing business data, enforces uniqueness and generates immutable SKUs for new products',async()=>{
  const db=(cms.db as unknown as PostgresAdapter).drizzle;
  const snapshot=async()=>(await db.execute(sql`SELECT id,slug,price,stock,reserved FROM products ORDER BY id`)).rows;
  const before=await snapshot();
  await db.execute(sql`ALTER TABLE products DROP COLUMN sku CASCADE`);
  const migration=await import('../../src/migrations/20261106_140000_product_skus');
  await migration.up({db} as Parameters<typeof migration.up>[0]);
  assert.deepEqual(await snapshot(),before);
  const rows=(await db.execute(sql`SELECT id,sku FROM products ORDER BY id`)).rows;
  for(const row of rows)assert.equal(row.sku,`MKN-${String(row.id).padStart(6,'0')}`);
  await assert.rejects(db.execute(sql`UPDATE products SET sku = NULL WHERE id = ${rows[0].id}`));
  await assert.rejects(db.execute(sql`UPDATE products SET sku = ${rows[0].sku} WHERE id = ${rows[1].id}`));
  const p=await product(4),other=await product(4);
  assert.match(p.sku!,/^MKN-[A-F0-9]{32}$/);assert.notEqual(p.sku,other.sku);
  const renamed=await cms.update({collection:'products',id:p.id,data:{name:'Renamed',slug:`renamed-${randomUUID()}`}});
  assert.equal(renamed.sku,p.sku);
  await assert.rejects(cms.update({collection:'products',id:p.id,data:{sku:'MKN-CHANGED'}}));
  await assert.rejects(cms.update({collection:'products',id:p.id,data:{sku:null}}));
  await assert.rejects(migration.down({db} as Parameters<typeof migration.down>[0]),/Cannot remove assigned/);
});
