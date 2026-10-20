import "./layout.js";
import * as cart from "./cart.js";
import { CONTACT, formatPHP, totals } from "./data.js";
import { icon, arrow, fillIcons } from "./icons.js";
import { sendEmail } from "./mailer.js";
import { encodeOrder } from "./refund-data.js";

const PAYMENT_GROUPS = [
  { title: "E-Wallet", methods: [{ id: "gcash", badge: "G", label: "GCash", hint: "Pay with your GCash wallet" }, { id: "maya", badge: "M", label: "Maya", hint: "Pay with your Maya wallet" }] },
  {
    title: "Online Banking",
    methods: [
      { id: "bdo", badge: "BDO", label: "BDO", hint: "BDO Unibank" },
      { id: "bpi", badge: "BPI", label: "BPI", hint: "Bank of the Philippine Islands" },
      { id: "metrobank", badge: "MB", label: "Metrobank", hint: "Metropolitan Bank & Trust" },
      { id: "landbank", badge: "LBP", label: "Landbank", hint: "Land Bank of the Philippines" },
    ],
  },
  {
    title: "Debit or Credit Card",
    methods: [
      { id: "debit", badge: "DR", label: "Debit card", hint: "Pay from your bank account" },
      { id: "credit", badge: "CR", label: "Credit card", hint: "Pay with your credit line" },
    ],
  },
  { title: "Cash", methods: [{ id: "cash", badge: "₱", label: "Cash on site", hint: "Pay when the engineer or supplier arrives" }] },
];

const METHODS = PAYMENT_GROUPS.flatMap((g) => g.methods.map((m) => ({ ...m, group: g.title })));

const REGIONS = ["Metro Manila (NCR)", "Luzon (outside NCR)", "Visayas", "Mindanao"];
const PH_MOBILE = "^(\\+?63|0)9\\d{2}\\s?\\d{3}\\s?\\d{4}$";
const app = document.getElementById("app");
const items = cart.lines();

const field = (label, input, cls = "") => `<label class="field ${cls}"><span>${label}</span>${input}</label>`;

// plain-text body of the order email; the server escapes it and wraps it in the HTML template
function orderMessage(data, method, lines, t, orderId) {
  const g = (key) => String(data.get(key) || "").trim();
  const firstName = g("name").split(/\s+/)[0] || "there";
  const rawDate = g("date");
  const startDate = rawDate
    ? new Date(`${rawDate}T00:00:00`).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })
    : "Not set";
  const body = [
    `Thank you for your order, ${firstName}. We've received it and will confirm by email within 24 hours.`,
    "",
    `Order reference: ${orderId}`,
    `Preferred start date: ${startDate}`,
    `Project address: ${g("address")}`,
    `Region: ${g("region")}`,
    `Contact: ${g("name")}`,
    g("company") ? `Company: ${g("company")}` : null,
    `Email: ${g("email")}`,
    `Phone: ${g("phone")}`,
    `Payment method: ${method ? `${method.group} - ${method.label}` : "Not selected"}`,
    "",
    "Order",
    ...lines.map((l) => `- ${l.name} × ${l.qty} — ${formatPHP(l.lineTotal)}${l.meta ? ` (${l.meta})` : ""}`),
    "",
    `Subtotal: ${formatPHP(t.subtotal)}`,
    `VAT (12%): ${formatPHP(t.vat)}`,
    `Total: ${formatPHP(t.total)}`,
    "",
    `Refundable: cancel within 7 days and get ${formatPHP(t.total * 0.8)} back (a 20% cancellation fee of ${formatPHP(t.total * 0.2)} applies).`,
    "",
    `If anything is wrong, reply to this email or call ${CONTACT.phone}.`,
  ];
  return body.filter((line) => line !== null).join("\n");
}

function emptyView() {
  app.innerHTML = `<section class="page"><div class="container">
    <div class="empty-state">
      <div class="empty-icon">${icon("bag")}</div>
      <h2>Your cart is empty</h2>
      <p>Add a service or a plan before checking out.</p>
      <a href="services.html" class="btn btn-primary">Browse services${arrow()}</a>
    </div>
  </div></section>`;
  fillIcons();
}

function formView() {
  const sub = cart.subtotal();
  const t = totals(sub);
  const minDate = new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10);
  const startedAt = Date.now();
  const first = METHODS[0].id;

  app.innerHTML = `<section class="page"><div class="container">
    <div class="page-head">
      <div>
        <a href="cart.html" class="text-link back">← Back to cart</a>
        <h1 class="page-title">Checkout</h1>
      </div>
    </div>

    <form class="split" id="checkout">
      <div>
        <fieldset>
          <legend><span>01</span>Contact details</legend>
          <div class="fields two">
            ${field("Full name", `<input class="form-input" name="name" required autocomplete="name" placeholder="Juan Dela Cruz">`)}
            ${field("Company (optional)", `<input class="form-input" name="company" autocomplete="organization" placeholder="ABC Builders Inc.">`)}
            ${field("Email", `<input class="form-input" name="email" type="email" required autocomplete="email" placeholder="juan@company.ph">`)}
            ${field("Mobile number", `<input class="form-input" name="phone" type="tel" required autocomplete="tel" placeholder="0917 123 4567" pattern="${PH_MOBILE}" title="PH mobile number, e.g. 0917 123 4567">`)}
          </div>
        </fieldset>

        <fieldset>
          <legend><span>02</span>Project</legend>
          <div class="fields">
            ${field("Project address", `<input class="form-input" name="address" required placeholder="Lot 4, Brgy. San Isidro, Antipolo City">`)}
            <div class="fields two">
              ${field("Region", `<select class="form-select" name="region" required><option value="" disabled selected>Select region</option>${REGIONS.map((r) => `<option>${r}</option>`).join("")}</select>`)}
              ${field("Preferred start date", `<input class="form-input" name="date" type="date" required min="${minDate}">`)}
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend><span>03</span>Payment method</legend>
          <div class="methods" role="radiogroup">
            ${PAYMENT_GROUPS.map(
              (g) => `<h3 class="method-group">${g.title}</h3>
              ${g.methods
                .map(
                  (m) => `<label class="method ${m.id === first ? "active" : ""}">
                <input type="radio" name="method" value="${m.id}" class="sr-only" ${m.id === first ? "checked" : ""}>
                <span class="method-icon">${m.badge}</span>
                <span class="method-text"><strong>${m.label}</strong><small>${m.hint}</small></span>
                <span class="radio"></span>
              </label>`,
                )
                .join("")}`,
            ).join("")}
          </div>
        </fieldset>
        <input class="sr-only" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" />
      </div>

      <aside>
        <div class="summary">
          <h2>Order summary</h2>
          <ul class="order-lines">${items
            .map(
              (l) => `<li><span>${l.name} <span class="x">× ${l.qty}</span>${l.meta ? `<br><span class="x" style="font-size:12px">${l.meta}</span>` : ""}</span><span class="tabular strong">${formatPHP(l.lineTotal)}</span></li>`,
            )
            .join("")}</ul>
          ${cart.totalsHTML(sub)}
          <p class="note">Refundable. Cancel within 7 days using the link in your confirmation email. A 20% cancellation fee applies; you get ${formatPHP(t.total * 0.8)} back.</p>
          <button type="submit" class="btn btn-primary btn-full" id="pay">${icon("lock")} Pay ${formatPHP(t.total)}</button>
          <p class="note" id="mail-status" role="status">Your confirmation email is real. Payment is a demo; no card is charged.</p>
        </div>
      </aside>
    </form>
  </div></section>`;
  fillIcons();

  const form = document.getElementById("checkout");

  form.addEventListener("change", (e) => {
    if (e.target.name !== "method") return;
    form.querySelectorAll(".method").forEach((el) => el.classList.toggle("active", el.querySelector("input").checked));
  });

  // mail the order first; only redirect once the server accepted it
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const method = METHODS.find((m) => m.id === data.get("method"));
    const pay = document.getElementById("pay");
    const status = document.getElementById("mail-status");
    const note = status.textContent;
    const orderId = `ECO-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    const refundUrl = new URL("refund.html", location.href);
    refundUrl.searchParams.set("ref", orderId);
    refundUrl.searchParams.set(
      "order",
      encodeOrder({
        id: orderId,
        items: items.map((l) => ({ name: l.name, unit: l.unit, qty: l.qty, price: l.price, meta: l.meta })),
        subtotal: t.subtotal,
        vat: t.vat,
        total: t.total,
        method: method ? `${method.group} - ${method.label}` : "Not selected",
      }),
    );
    pay.disabled = true;
    pay.innerHTML = `${icon("loader", "spin")} Processing payment…`;
    paying = true;

    let mail;
    try {
      mail = await sendEmail(
        {
          to: data.get("email"),
          subject: `Your EcoCrete order (${orderId})`,
          message: orderMessage(data, method, items, t, orderId),
          website: data.get("website") || "",
          cta: { label: "Request a refund", href: refundUrl.href },
        },
        startedAt,
      );
    } catch (err) {
      // no order placed and no redirect, so the customer never sees a false "confirmation"
      status.textContent = `${note} ${err.message}`;
      status.classList.add("error");
      pay.innerHTML = `${icon("lock")} Pay ${formatPHP(t.total)}`;
      pay.disabled = false;
      paying = false;
      return;
    }

    // payment stays mock
    setTimeout(() => {
      cart.placeOrder({
        id: orderId,
        name: data.get("name"),
        email: data.get("email"),
        method: method?.label || "Not selected",
        items: items.map((l) => ({ id: l.id, name: l.name, unit: l.unit, qty: l.qty, price: l.price, meta: l.meta })),
        ...t,
        buyerEmailFailed: mail.buyerEmailFailed === true,
        placedAt: new Date().toISOString(),
      });
      location.href = "success.html";
    }, 1600);
  });
}

let paying = false;
items.length ? formView() : emptyView();

// reload if the cart changes in the drawer
document.addEventListener("cart:change", () => !paying && location.reload());
