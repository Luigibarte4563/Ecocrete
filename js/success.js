import "./layout.js";
import { getLastOrder } from "./cart.js";
import { formatPHP } from "./data.js";
import { icon, arrow, fillIcons } from "./icons.js";
import { encodeOrder } from "./refund-data.js";

const app = document.getElementById("app");
const order = getLastOrder();

const spamNote = "Check spam, or contact us if it doesn't arrive in 10 minutes.";
const buyerEmailFailed = order?.buyerEmailFailed === true;
const lead = !order
  ? ""
  : buyerEmailFailed
    ? `Your order is saved, but we couldn't deliver the confirmation to <strong>${order.email}</strong>. Check the address or contact us at +63 917 000 0000. ${spamNote}`
    : `We've sent a confirmation email to <strong>${order.email}</strong>. It includes a link to request a refund within 7 days. ${spamNote}`;

if (!order) {
  app.innerHTML = `<section class="page"><div class="container">
    <div class="empty-state">
      <div class="empty-icon">${icon("bag")}</div>
      <h2>No recent order</h2>
      <p>Orders you place show up here.</p>
      <a href="services.html" class="btn btn-primary">Browse services${arrow()}</a>
    </div>
  </div></section>`;
} else {
  const refundUrl = new URL("refund.html", location.href);
  refundUrl.searchParams.set("ref", order.id);
  refundUrl.searchParams.set(
    "order",
    encodeOrder({
      id: order.id,
      items: order.items.map((i) => ({ name: i.name, unit: i.unit, qty: i.qty, price: i.price, meta: i.meta })),
      subtotal: order.subtotal,
      vat: order.vat,
      total: order.total,
      method: order.method,
    }),
  );

  app.innerHTML = `<section class="success"><div class="container success-inner">
      <div class="check-circle">${icon("check")}</div>
      <p class="order-id">Order reference: ${order.id}</p>
      <h1 class="page-title">Order received</h1>
      <p class="lead">${lead}</p>
      <div class="receipt">
        <div class="receipt-head">
          <span class="receipt-mark">${icon("leaf")}</span>
          <span class="chip">Demo payment · ${order.method}</span>
        </div>
        <ul class="order-lines">${order.items
          .map(
            (i) => `<li><span>${i.name} <span class="x">× ${i.qty}</span>${i.meta ? `<br><span class="x" style="font-size:12px">${i.meta}</span>` : ""}</span><span class="tabular">${formatPHP(i.price * i.qty)}</span></li>`,
          )
          .join("")}</ul>
        <dl class="totals">
          <div><dt>Subtotal</dt><dd>${formatPHP(order.subtotal)}</dd></div>
          <div><dt>VAT (12%)</dt><dd>${formatPHP(order.vat)}</dd></div>
          <div class="grand"><dt>Total</dt><dd>${formatPHP(order.total)}</dd></div>
        </dl>
      </div>
      <div class="btn-row">
        <a href="index.html" class="btn btn-primary">Back to calculator${arrow()}</a>
        <a href="services.html" class="btn btn-outline">View services</a>
        <a href="${refundUrl.href}" class="btn btn-tint">Request a refund</a>
      </div>
    </div></section>`;
}

fillIcons();
