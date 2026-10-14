import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { openDatabase } from '../src/db/client.js';
import { artworksRepo } from '../src/repos/artworks.js';
import { customersRepo } from '../src/repos/customers.js';
import { artistsRepo } from '../src/repos/artists.js';

const CUSTOMER_ID = '11111111-1111-4111-8111-111111111111';
const ARTIST_ID = '33333333-3333-4333-8333-333333333333';
const ART_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

async function withApp(fn) {
  const db = openDatabase({ url: ':memory:' });
  await db.applySchema();

  await db.batch([
    {
      sql: 'INSERT INTO artists (id, name, avatar, bio) VALUES (?, ?, ?, ?)',
      args: [ARTIST_ID, 'Mara Lindqvist', 'https://i.pravatar.cc/300?u=1', 'Abstract painter'],
    },
    {
      sql: 'INSERT INTO customers (id, name, age, email, phone, address, credit) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [CUSTOMER_ID, 'Eleanor Whitfield', 54, 'eleanor@example.com', '555-0100', '1 Main St', 5000],
    },
    {
      sql: `INSERT INTO artworks (id, artist_id, artist_name, title, media, size, style, date_created, price)
            VALUES (?, ?, ?, ?, ?, '24 x 36 in', 'Abstract', '2023-03-14', 2400)`,
      args: [ART_A, ARTIST_ID, 'Mara Lindqvist', 'Northern Reverie', 'Oils'],
    },
  ]);

  const server = createApp({
    artworks: artworksRepo(db),
    customers: customersRepo(db),
    artists: artistsRepo(db),
  }).listen(0);

  const base = `http://localhost:${server.address().port}/api`;
  const call = async (method, path, body) => {
    const res = await fetch(base + path, {
      method,
      headers: { 'content-type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null };
  };

  try {
    await fn(call, db);
  } finally {
    server.close();
    db.close();
  }
}

test('customers: list and patch update', async () => {
  await withApp(async (call) => {
    // 1. List
    const listRes = await call('GET', '/customers');
    assert.equal(listRes.status, 200);
    assert.equal(listRes.body.length, 1);
    assert.equal(listRes.body[0].name, 'Eleanor Whitfield');

    // 2. Patch valid
    const updateRes = await call('PATCH', `/customers/${CUSTOMER_ID}`, {
      name: 'Eleanor W. Whitfield',
      credit: 6000,
    });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.name, 'Eleanor W. Whitfield');
    assert.equal(updateRes.body.credit, 6000);

    // 3. Validation errors (400)
    assert.equal((await call('PATCH', `/customers/${CUSTOMER_ID}`, { email: 'invalid-email' })).status, 400);
    assert.equal((await call('PATCH', `/customers/${CUSTOMER_ID}`, { credit: -50 })).status, 400);
    assert.equal((await call('PATCH', `/customers/${CUSTOMER_ID}`, {})).status, 400);
    assert.equal((await call('PATCH', `/customers/${CUSTOMER_ID}`, { unknown_field: 123 })).status, 400);

    // 4. Not found (404)
    assert.equal((await call('PATCH', '/customers/00000000-0000-0000-0000-000000000000', { name: 'Test' })).status, 404);
  });
});

test('artworks: list artworks with artist details', async () => {
  await withApp(async (call) => {
    const listRes = await call('GET', '/artworks');
    assert.equal(listRes.status, 200);
    assert.equal(listRes.body.length, 1);
    assert.equal(listRes.body[0].title, 'Northern Reverie');
    assert.equal(listRes.body[0].artist_name, 'Mara Lindqvist');
    assert.equal(listRes.body[0].artist_avatar, 'https://i.pravatar.cc/300?u=1');
  });
});

test('artists: patch update and validation', async () => {
  await withApp(async (call) => {
    // 1. Patch valid
    const updateRes = await call('PATCH', `/artists/${ARTIST_ID}`, {
      name: 'Mara Lindqvist-Renoir',
      bio: 'Master impressionist and abstract painter',
    });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.name, 'Mara Lindqvist-Renoir');
    assert.equal(updateRes.body.bio, 'Master impressionist and abstract painter');

    // Artwork artist_name is also updated
    const artRes = await call('GET', '/artworks');
    assert.equal(artRes.body[0].artist_name, 'Mara Lindqvist-Renoir');

    // 2. Validation errors (400)
    assert.equal((await call('PATCH', `/artists/${ARTIST_ID}`, { avatar: 'not-a-url' })).status, 400);
    assert.equal((await call('PATCH', `/artists/${ARTIST_ID}`, { name: '   ' })).status, 400);
    assert.equal((await call('PATCH', `/artists/${ARTIST_ID}`, {})).status, 400);

    // 3. Not found (404)
    assert.equal((await call('PATCH', '/artists/00000000-0000-0000-0000-000000000000', { name: 'Test' })).status, 404);
  });
});
