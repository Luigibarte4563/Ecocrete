import test from "node:test";
import assert from "node:assert/strict";
import { MIX, PLANS, SERVICES, VAT_RATE, formatPHP, getPlan, getService, lineOf, mixBatch, refundAmount, scmLabel, totals } from "../js/data.js";

test("catalogue and plans have unique ids with usable prices", () => {
  const ids = [...SERVICES, ...PLANS].map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length);
  [...SERVICES, ...PLANS].forEach((x) => {
    assert.ok(Number.isFinite(x.price) && x.price > 0, `${x.id} needs a positive price`);
    assert.ok(x.unit && x.name && x.features.length, `${x.id} is missing copy`);
  });
});

test("every mix grade has the four design values", () => {
  Object.entries(MIX).forEach(([grade, cfg]) => {
    assert.ok(cfg.cement > 0 && cfg.wc > 0 && cfg.sand > 0 && cfg.gravel > 0, `${grade} is incomplete`);
    assert.ok(cfg.wc < 1, `${grade} water/cement ratio looks wrong`);
  });
});

test("lineOf prices a catalogue service and a plan", () => {
  assert.equal(lineOf({ id: "pro-estimate", qty: 2 }).lineTotal, getService("pro-estimate").price * 2);
  assert.equal(lineOf({ id: "professional", qty: 1 }).lineTotal, getPlan("professional").price);
});

test("lineOf keeps a custom calculator line and drops unknown ids", () => {
  const custom = lineOf({ id: "custom:C25:8.25:flyash:20", qty: 1, custom: { name: "Pro Estimate Report — C25 mix", unit: "per project", price: 3500, meta: "8.25 m³" } });
  assert.equal(custom.custom, true);
  assert.equal(custom.lineTotal, 3500);
  assert.equal(custom.meta, "8.25 m³");
  assert.equal(lineOf({ id: "gone-from-the-catalogue", qty: 1 }), null);
  assert.equal(lineOf({ id: "pro-estimate", qty: 0 }), null);
  // a custom line with a broken price must not become free money
  assert.equal(lineOf({ id: "custom:x", qty: 1, custom: { name: "x", price: "abc" } }), null);
});

test("lineOf caps the quantity", () => {
  assert.equal(lineOf({ id: "consultation", qty: 500 }).qty, 99);
});

test("totals add 12% VAT and refundAmount returns the 80%", () => {
  const t = totals(1000);
  assert.equal(t.vat, 1000 * VAT_RATE);
  assert.equal(t.total, 1120);
  assert.equal(refundAmount(1120), 896);
  assert.equal(totals("nonsense").total, 0);
});

test("formatPHP rounds to whole pesos", () => {
  assert.equal(formatPHP(3500.4).includes("3,500"), true);
  assert.equal(formatPHP(undefined).includes("0"), true);
});

test("mixBatch matches the worked example the page ships with", () => {
  // 10 × 5 × 0.15 m slab, 10% wastage, C25, 20% fly ash, 20 mm aggregate
  const b = mixBatch({ grade: "C25", length: 10, width: 5, depth: 0.15, waste: 10, maxAgg: 20, scmType: "flyash", scmPct: 0.2 });
  assert.equal(b.volume, 8.25);
  assert.equal(Math.round(b.cementKg), 2376); // 360 kg/m³ × 8.25 × 0.8
  assert.equal(Math.round(b.scmKg), 594);
  assert.equal(b.bags, 48);
  assert.equal(b.waterL, 1485); // 0.50 w/c on the full binder
  assert.equal(Math.round(b.sandKg), 5346);
  assert.equal(Math.round(b.gravelKg), 8316);
  assert.equal(Math.round(b.total), 36665); // bags + fly ash + sand + gravel
  assert.equal(Math.round(b.savedKg), 493);
});

test("mixBatch without a replacement has no SCM cost and no carbon saving", () => {
  const b = mixBatch({ grade: "C25", length: 10, width: 5, depth: 0.15, waste: 10, maxAgg: 20, scmType: "none", scmPct: 0.2 });
  assert.equal(b.scmKg, 0);
  assert.equal(b.savedKg, 0);
  assert.equal(b.cost.scm, 0);
  assert.equal(b.bags, 60); // 2970 kg of straight cement
  assert.ok(b.total < mixBatch({ grade: "C25", length: 10, width: 5, depth: 0.15, waste: 10, maxAgg: 20, scmType: "silica", scmPct: 0.2 }).total);
});

test("mixBatch: bigger aggregate uses less water, and empty input is safe", () => {
  const base = { grade: "C30", length: 4, width: 3, depth: 0.2, waste: 0 };
  const ten = mixBatch({ ...base, maxAgg: 10 });
  const forty = mixBatch({ ...base, maxAgg: 40 });
  assert.ok(ten.waterL > forty.waterL);
  assert.equal(forty.waterL, Math.round(mixBatch({ ...base, maxAgg: 20 }).waterL * 0.97));
  const empty = mixBatch({});
  assert.equal(empty.volume, 0);
  assert.equal(empty.bags, 0);
  assert.equal(empty.total, 0);
});

test("scmLabel falls back to no replacement", () => {
  assert.match(scmLabel("ggbfs"), /Slag/);
  assert.match(scmLabel("not-a-thing"), /Portland/);
});
