import "./layout.js";
import * as cart from "./cart.js";
import { CONTACT, formatPHP, totals } from "./data.js";
import { icon, arrow, fillIcons } from "./icons.js";
import { sendEmail } from "./mailer.js";
import { encodeOrder } from "./refund-data.js";

const PAYMENT_GROUPS = [
  { title: "Cash", methods: [{ id: "cod", badge: "₱", label: "Cash on delivery", hint: "Pay the dispatcher when the truck arrives" }] },
  { title: "E-Wallet", methods: [{ id: "gcash", badge: "G", label: "GCash", hint: "Scan to pay from your GCash app" }, { id: "maya", badge: "M", label: "Maya", hint: "Pay from your Maya wallet" }] },
  {
    title: "Online Banking",
    methods: [
      { id: "bdo", badge: "BDO", label: "BDO", hint: "Transfer from your BDO account" },
      { id: "bpi", badge: "BPI", label: "BPI", hint: "Transfer from your BPI account" },
      { id: "metrobank", badge: "MB", label: "Metrobank", hint: "Transfer from your Metrobank account" },
      { id: "landbank", badge: "LBP", label: "Landbank", hint: "Transfer from your Landbank account" },
    ],
  },
  {
    title: "Debit or Credit Card",
    methods: [
      { id: "debit", badge: "DR", label: "Debit card", hint: "Charged straight from your bank account" },
      { id: "credit", badge: "CR", label: "Credit card", hint: "Pay with your credit line" },
    ],
  },
  { title: "Account", methods: [{ id: "account", badge: "AC", label: "Charge to account", hint: "For approved contractor accounts" }] },
];

const METHODS = PAYMENT_GROUPS.flatMap((g) => g.methods.map((m) => ({ ...m, group: g.title })));

const REGIONS = ["Metro Manila", "Cavite–Laguna", "Central Luzon", "Other area (surcharge may apply)"];
const PH_MOBILE = "^(\\+?63|0)9\\d{2}\\s?\\d{3}\\s?\\d{4}$";
const app = document.getElementById("app");
const items = cart.lines();

const field = (label, input, cls = "") => `<label class="field ${cls}"><span>${label}</span>${input}</label>`;

// plain-text body of the order email; the server escapes it and wraps it in the HTML template
function orderMessage(data, method, lines, t, orderId) {
  const g = (key) => String(data.get(key) || "").trim();
  const firstName = g("delivery_name").split(/\s+/)[0] || "there";
  const rawDate = g("pour_date");
  const startDate = rawDate
    ? new Date(`${rawDate}T00:00:00`).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })
    : "Not set";
  const body = [
    `Thanks for your order, ${firstName}. Here is how a pour works with EcoCrete:`,
    "",
    "1. We confirm stock and truck availability for your pour date.",
    "2. The dispatcher calls 24 hours before delivery with the exact arrival window.",
    "3. The driver brings the batch ticket; you check the slump before pouring.",
    "",
    `Order reference: ${orderId}`,
    `Preferred pour date: ${startDate}`,
    `Delivery window: ${g("window") || "Not set"}`,
    `Pour volume: ${g("pour_volume")} m³`,
    `Pump truck: ${g("pump")}`,
    `Delivery address: ${g("delivery_address")}`,
    `Supply area: ${g("supply_region")}`,
    g("access") ? `Site access notes: ${g("access")}` : null,
    `Contact: ${g("delivery_name")}`,
    g("firm_name") ? `Company: ${g("firm_name")}` : null,
    `Email: ${g("delivery_email")}`,
    `Phone: ${g("delivery_phone")}`,
    `Payment method: ${method ? `${method.group} - ${method.label}` : "Not selected"}`,
    "",
    "Order",
    ...lines.map((l) => `- ${l.name} × ${l.qty} — ${formatPHP(l.lineTotal)}${l.meta ? ` (${l.meta})` : ""}`),
    "",
    `Subtotal: ${formatPHP(t.subtotal)}`,
    `VAT (12%): ${formatPHP(t.vat)}`,
    `Total: ${formatPHP(t.total)}`,
    "",
    `Plans change: cancel within 7 days and ${formatPHP(t.total * 0.8)} comes back; the ${formatPHP(t.total * 0.2)} balance covers batching and dispatch.`,
    "",
    `Questions? Reply to this email or call ${CONTACT.phone}.`,
  ];
  return body.filter((line) => line !== null).join("\n");
}

function emptyView() {
  app.innerHTML = `<section class="page"><div class="container">
    <div class="empty-state">
      <div class="empty-icon">${icon("bag")}</div>
      <h2>Nothing in your order yet</h2>
      <p>Add a mix, a service or a plan to schedule a pour.</p>
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
        <a href="cart.html" class="text-link back">← Back to your order</a>
        <h1 class="page-title">Schedule your pour</h1>
      </div>
    </div>

    <form class="split" id="checkout">
      <div>
        <fieldset>
          <legend><span>01</span>Delivery contact</legend>
          <div class="fields two">
            ${field("Del
