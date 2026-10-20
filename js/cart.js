import { lineOf, totals, formatPHP } from "./data.js";
import { icon } from "./icons.js";

const KEY = "ecocrete-cart";

function read() {
  let state;
  try {
    state = JSON.parse(localStorage.getItem(KEY)) || { items: [], lastOrder: null };
  } catch {
    state = { items: [], lastOrder: null };
  }
  // An item the catalogue cannot price (a changed id, or a cart left behind by another build
  // that used the same key) must never count towards the badge or the totals. Read-only:
  // the next real write stores the cleaned list, so there is no event loop here.
  return { ...state, items: (Array.isArray(state.items) ? state.items : []).filter((item) => lineOf(item)) };
}

function write(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
  document.dispatchEvent(new CustomEvent("cart:change"));
}

export const getItems = () => read().items;
export const getLastOrder = () => read().lastOrder;
export const count = () => getItems().reduce((n, i) => n + Number(i.qty || 0), 0);

// custom is the calculator's line: { name, unit, price, meta }
export function add(id, custom) {
  const state = read();
  const item = state.items.find((i) => i.id === id);
  if (item) {
    item.qty = Math.min(item.qty + 1, 99);
    if (custom) item.custom = custom;
  } else {
    state.items.push(custom ? { id, qty: 1, custom } : { id, qty: 1 });
  }
  write(state);
}

export function setQty(id, qty) {
  const state = read();
  state.items = qty <= 0 ? state.items.filter((i) => i.id !== id) : state.items.map((i) => (i.id === id ? { ...i, qty: Math.min(qty, 99) } : i));
  write(state);
}

export function remove(id) {
  const state = read();
  state.items = state.items.filter((i) => i.id !== id);
  write(state);
}

export function clear() {
  write({ ...read(), items: [] });
}

export function placeOrder(order) {
  write({ items: [], lastOrder: order });
}

export const lines = () => getItems().map(lineOf).filter(Boolean);
export const subtotal = () => lines().reduce((n, l) => n + l.lineTotal, 0);

// shared html pieces
export function qtyHTML(id, qty) {
  return `<div class="qty">
    <button type="button" data-qty="${id}" data-step="-1" aria-label="Decrease quantity">${icon("minus")}</button>
    <span aria-live="polite">${qty}</span>
    <button type="button" data-qty="${id}" data-step="1" aria-label="Increase quantity">${icon("plus")}</button>
  </div>`;
}

export function totalsHTML(sub) {
  const t = totals(sub);
  return `<dl class="totals">
    <div><dt>Subtotal</dt><dd>${formatPHP(t.subtotal)}</dd></div>
    <div><dt>VAT (12%)</dt><dd>${formatPHP(t.vat)}</dd></div>
    <div class="grand"><dt>Total</dt><dd>${formatPHP(t.total)}</dd></div>
  </dl>`;
}

// quantity and remove buttons anywhere on the page
document.addEventListener("click", (e) => {
  const step = e.target.closest("[data-qty]");
  if (step) {
    const item = getItems().find((i) => i.id === step.dataset.qty);
    if (item) setQty(item.id, Number(item.qty) + Number(step.dataset.step));
  }
  const del = e.target.closest("[data-remove]");
  if (del) remove(del.dataset.remove);
});
