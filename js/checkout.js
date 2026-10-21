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
      { id: "bpi", badge: "BPI", label: "BPI", hint: "Transfer from your BPI account", disabled: true },
      { id: "metrobank", badge: "MB", label: "Metrobank", hint: "Transfer from your Metrobank account" },
      { id: "landbank", badge: "LBP", label: "Landbank", hint: "Transfer from your Landbank account", disabled: true },
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
  // first method that is not disabled
  const first = METHODS.find((m) => !m.disabled).id;

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
            ${field("Delivery contact name", `<input class="form-input" name="delivery_name" required autocomplete="name" placeholder="Mario Bautista">`)}
            ${field("Company / firm (optional)", `<input class="form-input" name="firm_name" autocomplete="organization" placeholder="Bautista & Sons Construction">`)}
            ${field("Email address", `<input class="form-input" name="delivery_email" type="email" required autocomplete="email" placeholder="mario@bautistasons.ph">`)}
            ${field("Mobile (for the dispatcher)", `<input class="form-input" name="delivery_phone" type="tel" required autocomplete="tel" placeholder="0920 776 3410" pattern="${PH_MOBILE}" title="PH mobile number, e.g. 0920 776 3410">`)}
          </div>
        </fieldset>

        <fieldset>
          <legend><span>02</span>Delivery</legend>
          <div class="fields">
            ${field("Delivery address", `<input class="form-input" name="delivery_address" required placeholder="Km 42, McArthur Hwy, Meycauayan, Bulacan">`)}
            ${field("Site access notes (optional)", `<input class="form-input" name="access" placeholder="Narrow gate · pump truck needed">`)}
            <div class="fields two">
              ${field("Pour volume (m³)", `<input class="form-input" name="pour_volume" type="number" min="0.5" step="0.25" placeholder="12.5" required>`)}
              ${field("Pump truck required", `<select class="form-select" name="pump" required><option value="" disabled selected>Select</option><option>Yes</option><option>No</option><option>Not sure</option></select>`)}
            </div>
            <div class="fields two">
              ${field("Supply area", `<select class="form-select" name="supply_region" required><option value="" disabled selected>Select area</option>${REGIONS.map((r) => `<option>${r}</option>`).join("")}</select>`)}
              ${field("Preferred pour date", `<input class="form-input" name="pour_date" type="date" required min="${minDate}">`)}
            </div>
            ${field("Delivery window", `<select class="form-select" name="window" required><option value="" disabled selected>Select window</option><option>Morning (6am–10am)</option><option>Midday (10am–2pm)</option><option>Afternoon (2pm–6pm)</option></select>`)}
          </div>
        </fieldset>

        <fieldset>
          <legend><span>03</span>Payment method</legend>
          <div class="methods" role="radiogroup">
            ${PAYMENT_GROUPS.map(
              (g) => `<h3 class="method-group">${g.title}</h3>
              ${g.methods
                .map(
                  (m) => `<label class="method ${m.id === first ? "active" : ""} ${m.disabled ? "disabled" : ""}" ${m.disabled ? `data-disabled="${m.label}"` : ""}>
                <input type="radio" name="method" value="${m.id}" class="sr-only" ${m.id === first ? "checked" : ""} ${m.disabled ? "disabled" : ""}>
                <span class="method-icon">${m.badge}</span>
                <span class="method-text"><strong>${m.label}</strong><small>${m.disabled ? "Disabled" : m.hint}</small></span>
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
          <p class="note">Cancel within 7 days and 80% comes back; the 20% balance covers batching and dispatch.</p>
          <button type="submit" class="btn btn-primary btn-full" id="pay">${icon("lock")} Place order — ${formatPHP(t.total)}</button>
          <p class="note" id="mail-status" role="status">Demo checkout — no card is charged. The confirmation email is real.</p>
        </div>
      </aside>
    </form>
  </div></section>`;
  fillIcons();

  const form = document.getElementById("checkout");
  const status = document.getElementById("mail-status");
  const defaultNote = status.textContent;

  form.addEventListener("change", (e) => {
    if (e.target.name !== "method") return;
    form.querySelectorAll(".method").forEach((el) => el.classList.toggle("active", el.querySelector("input").checked));
    status.textContent = defaultNote;
    status.classList.remove("error");
  });

  // disabled methods can't be chosen; tell the person why
  form.addEventListener("click", (e) => {
    const el = e.target.closest(".method.disabled");
    if (!el) return;
    e.preventDefault();
    status.textContent = `${el.dataset.disabled} is currently disabled. Please choose another payment method.`;
    status.classList.add("error");
  });

  // mail the order first; only redirect once the server accepted it
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const method = METHODS.find((m) => m.id === data.get("method"));
    const pay = document.getElementById("pay");
    // clear any earlier "disabled" message before sending
    status.textContent = defaultNote;
    status.classList.remove("error");
    const note = defaultNote;
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
    pay.innerHTML = `${icon("loader", "spin")} Reserving your truck…`;
    paying = true;

    let mail;
    try {
      mail = await sendEmail(
        {
          to: data.get("delivery_email"),
          subject: `EcoCrete order ${orderId} — pouring details inside`,
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
      pay.innerHTML = `${icon("lock")} Place order — ${formatPHP(t.total)}`;
      pay.disabled = false;
      paying = false;
      return;
    }

    // payment stays mock
    setTimeout(() => {
      cart.placeOrder({
        id: orderId,
        name: data.get("delivery_name"),
        email: data.get("delivery_email"),
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
