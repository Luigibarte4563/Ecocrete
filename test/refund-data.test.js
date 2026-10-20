import test from "node:test";
import assert from "node:assert/strict";
import { encodeOrder, decodeOrder } from "../js/refund-data.js";

const order = {
  id: "ECO-ABC123",
  items: [
    { name: "Pro Estimate Report — C25 mix", unit: "per project", qty: 1, price: 3500, meta: "8.25 m³ · 56 bags" },
    { name: "Custom Mix Design", unit: "per mix", qty: 2, price: 8500, meta: "" },
  ],
  subtotal: 20500,
  vat: 2460,
  total: 22960,
  method: "Online Banking - BDO",
};

test("an order payload round-trips through the refund link", () => {
  assert.deepEqual(decodeOrder(encodeOrder(order)), order);
});

test("malformed order payloads return null", () => {
  assert.equal(decodeOrder("not-base64"), null);
  assert.equal(decodeOrder(""), null);
  assert.equal(decodeOrder(undefined), null);
});
