import test from "node:test";
import assert from "node:assert/strict";

// the cart module is a browser module: give it just enough of a window to load under node --test
const store = new Map();
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
};
globalThis.document = { addEventListener() {}, dispatchEvent() {} };

const KEY = "ecocrete-cart";
const cart = await import("../js/cart.js");

const seed = (items) => store.set(KEY, JSON.stringify({ items, lastOrder: null }));
const raw = () => JSON.parse(store.get(KEY) || "null")?.items;

test.beforeEach(() => store.clear());

test("a cart left behind by an older build counts as empty", () => {
  // same storage key, ids from a different catalogue, plus calculator lines with no usable price
  seed([
    { id: "custom-1750000000", qty: 4, custom: { name: "", price: undefined } },
    { id: "gone-from-catalogue", qty: 3 },
  ]);
  assert.equal(cart.count(), 0);
  assert.deepEqual(cart.lines(), []);
  assert.deepEqual(cart.getItems(), []);
});

test("only pricable lines count", () => {
  seed([
    { id: "pro-estimate", qty: 2 },
    { id: "gone-from-catalogue", qty: 5 },
    { id: "custom:1", qty: 1, custom: { name: "Pro Estimate Report — C25 mix", unit: "per project", price: 3500, meta: "8.25 m³" } },
  ]);
  assert.equal(cart.count(), 3);
  assert.equal(cart.lines().length, 2);
  assert.equal(cart.subtotal(), 3500 * 2 + 3500);
});

test("a malformed stored value is not fatal", () => {
  store.set(KEY, "{not json");
  assert.equal(cart.count(), 0);
  store.set(KEY, JSON.stringify({ items: "nope" }));
  assert.equal(cart.count(), 0);
});

test("adding to a cart with junk in it writes the cleaned list back", () => {
  seed([{ id: "gone-from-catalogue", qty: 7 }]);
  cart.add("consultation");
  assert.deepEqual(raw(), [{ id: "consultation", qty: 1 }]);
  assert.equal(cart.count(), 1);
});

test("quantity changes stay capped and 0 removes the line", () => {
  seed([{ id: "consultation", qty: 1 }]);
  cart.setQty("consultation", 500);
  assert.equal(cart.count(), 99);
  cart.setQty("consultation", 0);
  assert.equal(cart.count(), 0);
  assert.deepEqual(raw(), []);
});

test("the same custom mix added twice becomes quantity 2", () => {
  const custom = { name: "Pro Estimate Report — C25 mix", unit: "per project", price: 3500, meta: "8.25 m³" };
  cart.add("custom:C25:8.25:flyash:20", custom);
  cart.add("custom:C25:8.25:flyash:20", custom);
  assert.equal(cart.count(), 2);
  assert.equal(cart.lines()[0].lineTotal, 7000);
});

test("placeOrder empties the cart and keeps the order", () => {
  seed([{ id: "starter", qty: 1 }]);
  cart.placeOrder({ id: "ECO-1", total: 2239 });
  assert.equal(cart.count(), 0);
  assert.equal(cart.getLastOrder().id, "ECO-1");
});
