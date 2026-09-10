import fs from 'node:fs';
import {
  initializeTestEnvironment, assertFails, assertSucceeds,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';

const OWNER = 'techubwenge@gmail.com';
const S1 = 'seller.one@gmail.com';
const S2 = 'seller.two@gmail.com';
const SUSPENDED = 'suspended.seller@gmail.com';

const env = await initializeTestEnvironment({
  projectId: 'my-shop-rules-test',
  firestore: { rules: fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 },
});

// Seed the roster and two listings, bypassing rules.
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'admins', OWNER), { email: OWNER, role: 'owner', disabled: false });
  await setDoc(doc(db, 'admins', S1), { email: S1, role: 'seller', disabled: false });
  await setDoc(doc(db, 'admins', S2), { email: S2, role: 'seller', disabled: false });
  await setDoc(doc(db, 'admins', SUSPENDED), { email: SUSPENDED, role: 'seller', disabled: true });
  await setDoc(doc(db, 'products', 'p1'), { name: 'S1 item', sellerId: S1, status: 'active' });
  await setDoc(doc(db, 'products', 'p2'), { name: 'S2 item', sellerId: S2, status: 'active' });
  await setDoc(doc(db, 'coupons', 'C1'), { code: 'C1', sellerId: S1, active: true });
  await setDoc(doc(db, 'settings', 'store'), { storeName: 'My Shop' });
  await setDoc(doc(db, 'orders', 'o1'), { customerEmail: 'buyer@x.com', sellerIds: [S1], total: 1000, createdAt: 2 });
  await setDoc(doc(db, 'orders', 'o2'), { customerEmail: 'buyer@x.com', sellerIds: [S2], total: 2000, createdAt: 1 });
  await setDoc(doc(db, 'customers', 'buyer@x.com'), { email: 'buyer@x.com' });
});

const as = (email) => env.authenticatedContext(email.replace(/[^a-z0-9]/gi, ''), { email }).firestore();
const owner = as(OWNER), s1 = as(S1), s2 = as(S2);

let pass = 0, fail = 0;
const check = async (label, p) => {
  try { await p; console.log('  PASS  ' + label); pass++; }
  catch (e) { console.log('  FAIL  ' + label + '  -> ' + (e.message || e).slice(0, 90)); fail++; }
};

console.log('\n--- A seller cannot touch another seller\'s data ---');
await check('S1 cannot edit S2 product',   assertFails(setDoc(doc(s1, 'products/p2'), { name: 'hijacked', sellerId: S2 }, { merge: true })));
await check('S1 cannot delete S2 product', assertFails(deleteDoc(doc(s1, 'products/p2'))));
await check('S1 cannot steal S2 product by restamping it', assertFails(setDoc(doc(s1, 'products/p2'), { sellerId: S1 }, { merge: true })));
await check('S1 cannot create a product stamped as S2', assertFails(setDoc(doc(s1, 'products/new1'), { name: 'x', sellerId: S2 })));
await check('S1 cannot read S2 order',     assertFails(getDoc(doc(s1, 'orders/o2'))));
await check('S1 cannot edit S2 coupon',    assertFails(setDoc(doc(s1, 'coupons/C1x'), { code: 'C1x', sellerId: S2 })));
await check('S1 cannot read the seller roster', assertFails(getDocs(collection(s1, 'admins'))));
await check('S1 cannot read customer list', assertFails(getDoc(doc(s1, 'customers/buyer@x.com'))));

console.log('\n--- A seller cannot change the platform ---');
await check('S1 cannot edit store settings (payment code)', assertFails(setDoc(doc(s1, 'settings/store'), { storeName: 'Hacked' }, { merge: true })));
await check('S1 cannot add categories',    assertFails(setDoc(doc(s1, 'categories/c9'), { name: 'x' })));
await check('S1 cannot change an order',   assertFails(setDoc(doc(s1, 'orders/o1'), { status: 'delivered' }, { merge: true })));
await check('S1 cannot promote themselves', assertFails(setDoc(doc(s1, 'admins/' + S1), { role: 'owner' }, { merge: true })));
const susp = as(SUSPENDED);
await check('A suspended seller cannot reinstate themselves', assertFails(setDoc(doc(susp, 'admins/' + SUSPENDED), { disabled: false, role: 'seller' }, { merge: true })));
await check('A suspended seller cannot add products', assertFails(setDoc(doc(susp, 'products/sneak'), { name: 'x', sellerId: SUSPENDED })));
await check('S1 cannot suspend another seller', assertFails(setDoc(doc(s1, 'admins/' + S2), { disabled: true }, { merge: true })));
await check('S1 cannot add a new seller',  assertFails(setDoc(doc(s1, 'admins/x@y.com'), { email: 'x@y.com', role: 'seller' })));

console.log('\n--- A seller CAN do their own job ---');
await check('S1 creates their own product', assertSucceeds(setDoc(doc(s1, 'products/new2'), { name: 'mine', sellerId: S1, status: 'active' })));
await check('S1 edits their own product',   assertSucceeds(setDoc(doc(s1, 'products/p1'), { name: 'renamed', sellerId: S1 }, { merge: true })));
await check('S1 deletes their own product', assertSucceeds(deleteDoc(doc(s1, 'products/new2'))));
await check('S1 creates their own promotion', assertSucceeds(setDoc(doc(s1, 'coupons/S1PROMO'), { code: 'S1PROMO', sellerId: S1, active: true })));
await check('S1 reads their own order',     assertSucceeds(getDoc(doc(s1, 'orders/o1'))));
await check('S1 queries only their orders', assertSucceeds(getDocs(query(collection(s1, 'orders'), where('sellerIds', 'array-contains', S1), orderBy('createdAt', 'desc')))));
await check('S1 fills in their own profile', assertSucceeds(setDoc(doc(s1, 'admins/' + S1), { shopName: 'Shop One', phone: '078', role: 'seller', disabled: false }, { merge: true })));

console.log('\n--- The owner sees and controls everything ---');
await check('Owner reads any order',        assertSucceeds(getDoc(doc(owner, 'orders/o2'))));
await check('Owner edits any product',      assertSucceeds(setDoc(doc(owner, 'products/p2'), { name: 'owner edit' }, { merge: true })));
await check('Owner edits store settings',   assertSucceeds(setDoc(doc(owner, 'settings/store'), { storeName: 'My Shop' }, { merge: true })));
await check('Owner reads the roster',       assertSucceeds(getDocs(collection(owner, 'admins'))));
await check('Owner reads customers',        assertSucceeds(getDoc(doc(owner, 'customers/buyer@x.com'))));
await check('Owner adds a seller',          assertSucceeds(setDoc(doc(owner, 'admins/new@seller.com'), { email: 'new@seller.com', role: 'seller', disabled: false })));

console.log('\n--- Shoppers ---');
const anon = env.unauthenticatedContext().firestore();
await check('Anyone can browse products',   assertSucceeds(getDoc(doc(anon, 'products/p1'))));
await check('Anyone can place an order',    assertSucceeds(setDoc(doc(anon, 'orders/o' + Math.random().toString(36).slice(2)), { customerEmail: 'a@b.c', sellerIds: [S1], total: 5 })));
await check('A stranger cannot read orders', assertFails(getDoc(doc(anon, 'orders/o1'))));
await check('A stranger cannot edit products', assertFails(setDoc(doc(anon, 'products/p1'), { price: 1 }, { merge: true })));

console.log(`\n==== ${pass} passed, ${fail} failed ====`);
await env.cleanup();
process.exit(fail ? 1 : 0);
