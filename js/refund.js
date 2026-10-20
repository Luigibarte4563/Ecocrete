import "./layout.js";
import { sendEmail } from "./mailer.js";
import { CONTACT, formatPHP } from "./data.js";
import { arrow, fillIcons } from "./icons.js";
import { decodeOrder } from "./refund-data.js";

const app = document.getElementById("app");
const startedAt = Date.now();
const params = new URLSearchParams(location.search);
const ref = (params.get("ref") || "").trim();
const decoded = decodeOrder(params.get("order"));
const order =
  decoded &&
  typeof decoded.id === "string" &&
  Array.isArray(decoded.items) &&
  Number.isFinite(decoded.subtotal) &&
  Number.isFinite(decoded.vat) &&
  Number.isFinite(decoded.total)
    ? decoded
    : null;

const esc = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

const money = (value) => formatPHP(Number(value) || 0);

const REASONS = ["Schedule changed", "Project cancelled", "Ordered by mistake", "Found another provider", "Other"];

function receiptHTML(order) {
  const items = order.items
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const qty = Number(item.qty) || 1;
      return `<li><span>${esc(item.name)} <span class="x">× ${qty}</span></span><span class="tabular">${money(item.price * qty)}</span></li>`;
    })
    .join("");

  return `<div class="receipt">
    <p class="order-id" style="margin:0">Order number: ${esc(order.id)}</p>
    <div class="receipt-head">
      <span class="receipt-mark">✳</span>
      <span class="chip">Refund request</span>
    </div>
    <ul class="order-lines">${items}</ul>
    <dl class="totals">
      <div><dt>Subtotal</dt><dd>${money(order.subtotal)}</dd></div>
      <div><dt>VAT (12%)</dt><dd>${money(order.vat)}</dd></div>
      <div><dt>Order total</dt><dd>${money(order.total)}</dd></div>
      <div><dt>Cancellation fee (20%)</dt><dd>-${money(order.total * 0.2)}</dd></div>
      <div class="grand"><dt>Refund amount</dt><dd>${money(order.total * 0.8)}</dd></div>
      <div><dt>Refund to</dt><dd>${esc(order.method || "Not selected")}</dd></div>
    </dl>
  </div>`;
}

function requestMessage({ reference, email, reason }) {
  const lines = [`Refund request for order ${reference}.`];

  if (order) {
    lines.push(
      "",
      "Items:",
      ...order.items
        .filter((item) => item && typeof item === "object")
        .map((item) => `- ${item.name} × ${Number(item.qty) || 1} — ${money(item.price * (Number(item.qty) || 1))}`),
      "",
      `Subtotal: ${money(order.subtotal)}`,
      `VAT (12%): ${money(order.vat)}`,
      `Order total: ${money(order.total)}`,
      `Cancellation fee (20%): ${money(order.total * 0.2)}`,
      `Refund amount: ${money(order.total * 0.8)}`,
      `Refund to: ${order.method || "Not selected"}`,
    );
  }

  lines.push("", `Contact email: ${email}`, `Reason: ${reason || "Not provided"}`, "", "We'll review the request and reply within 1 business day.");
  return lines.join("\n");
}

app.innerHTML = `<section class="page"><div class="container">
    <div class="page-head">
      <div>
        <a href="index.html" class="text-link back">← Back to home</a>
        <h1 class="page-title">Request a refund</h1>
      </div>
    </div>
    <form class="split" id="refund">
      <div>
        ${order ? receiptHTML(order) : `<p class="note" style="margin-bottom:16px">We couldn't load this order here. Enter the order reference from your confirmation email and our team will verify it.</p>`}
        <fieldset style="margin-top:20px">
          <legend><span>01</span>Refund details</legend>
          <div class="fields">
            ${order ? "" : `<label class="field"><span>Order reference</span><input class="form-input" name="ref" required maxlength="60" placeholder="ECO-ABC123"></label>`}
            <label class="field"><span>Email used for the order</span><input class="form-input" name="email" type="email" required autocomplete="email" placeholder="juan@company.ph"></label>
            <label class="field"><span>Reason for refund</span><select class="form-select" name="reason" required>
              <option value="" disabled selected>Select a reason…</option>
              ${REASONS.map((r) => `<option>${r}</option>`).join("")}
            </select></label>
          </div>
        </fieldset>
        <div>
          <button type="submit" class="btn btn-primary" id="confirm">Confirm refund</button>
          <p class="note" id="status" role="status" style="margin-top:8px">We'll email a copy to you and our team.</p>
        </div>
        <input class="sr-only" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" />
      </div>
      <aside>
        <div class="summary">
          <h2>Refund policy</h2>
          <p class="note">Cancel within 7 days of ordering. A 20% cancellation fee applies; you get 80% back. The refund is reviewed by our team.</p>
          <p class="note">Questions? ${CONTACT.email} · ${CONTACT.phone}</p>
        </div>
      </aside>
    </form>
  </div></section>`;
fillIcons();

const form = document.getElementById("refund");
if (!order && form.elements.ref) form.elements.ref.value = ref;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const email = String(data.get("email") || "").trim();
  const reference = String(order ? order.id : data.get("ref") || "").replace(/[\r\n]+/g, " ").trim().slice(0, 60);
  const reason = String(data.get("reason") || "").trim();
  const confirm = document.getElementById("confirm");
  const status = document.getElementById("status");

  if (!reference) {
    status.textContent = "Enter your order reference.";
    status.classList.add("error");
    return;
  }

  confirm.disabled = true;
  status.textContent = "Sending…";
  status.classList.remove("error");

  try {
    const result = await sendEmail(
      {
        to: email,
        subject: `Refund request (${reference})`,
        message: requestMessage({ reference, email, reason }),
        website: data.get("website") || "",
        refund: true,
      },
      startedAt,
    );

    app.innerHTML = `<section class="page"><div class="container">
      <div class="empty-state">
        <div class="empty-icon">✳</div>
        <h2>Refund request sent</h2>
        <p>${
          result.buyerEmailFailed
            ? "Our team has your request, but we couldn't email you a copy. We'll still process it."
            : "We've emailed a copy to you and our team. We'll reply within 1 business day."
        }</p>
        <a href="index.html" class="btn btn-primary">Back to home${arrow()}</a>
      </div>
    </div></section>`;
    fillIcons();
  } catch (err) {
    status.textContent = err.message;
    status.classList.add("error");
    confirm.disabled = false;
  }
});
