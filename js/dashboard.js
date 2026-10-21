// Demo workspace: saved estimates, strength tests and plan status. No login behind it —
// everything lives in this browser's localStorage.
// shortcut: the dashboard is public demo data, not a real workspace — add accounts and a server store when it holds anything private.
import "./layout.js";
import { openCart, toast } from "./layout.js";
import * as cart from "./cart.js";
import { MIX, PLANS, formatPHP, getPlan, getService } from "./data.js";
import { icon, fillIcons } from "./icons.js";
import { initMotion } from "./motion.js";
import { verifiedEmail } from "./verification.js";

const getLastOrder = cart.getLastOrder;

const ESTIMATES_KEY = "ecocrete-estimates";
const TESTS_KEY = "ecocrete-tests";
const app = document.getElementById("app");
const lastOrder = getLastOrder();

const service = getService("project-tracker");
const plan = PLANS.find((p) => (lastOrder?.items || []).some((i) => getPlan(i.id))) || null;

function read(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

let estimates = read(ESTIMATES_KEY);
let tests = read(TESTS_KEY);
let activeTab = "estimates";

const bagsFor = (grade, volume) => Math.ceil(((MIX[grade] || MIX.C25).cement * volume) / 50);
const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });

function metrics() {
  const volume = estimates.reduce((n, e) => n + Number(e.volume || 0), 0);
  const bags = estimates.reduce((n, e) => n + Number(e.bags || 0), 0);
  return { count: estimates.length, volume, bags, tests: tests.length };
}

function td(text, cls = "") {
  const cell = document.createElement("td");
  cell.className = cls;
  cell.textContent = text;
  return cell;
}

function removeButton(collection, id) {
  const cell = document.createElement("td");
  const btn = document.createElement("button");
  btn.className = "icon-btn";
  btn.type = "button";
  btn.dataset.del = `${collection}:${id}`;
  btn.setAttribute("aria-label", "Delete row");
  btn.innerHTML = icon("trash");
  cell.append(btn);
  return cell;
}

function emptyRow(table, columns, label) {
  const tr = document.createElement("tr");
  const cell = td(label, "muted");
  cell.colSpan = columns;
  tr.append(cell);
  table.append(tr);
}

function renderEstimates(table) {
  if (!estimates.length) return emptyRow(table, 5, "Nothing saved yet. Save an estimate to build your project record.");
  estimates.forEach((e) => {
    const tr = document.createElement("tr");
    tr.append(td(e.project), td(e.grade), td(`${Number(e.volume).toFixed(2)} m³`, "num"), td(`${e.bags} bags`, "num"), td(fmtDate(e.savedAt)), removeButton("estimates", e.id));
    table.append(tr);
  });
}

function renderTests(table) {
  if (!tests.length) return emptyRow(table, 6, "No tests logged yet. Log a cube or cylinder result to track strength.");
  tests.forEach((t) => {
    const tr = document.createElement("tr");
    const result = document.createElement("td");
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = t.pass ? "Pass" : "Below target";
    chip.style.background = t.pass ? "var(--primary-pale)" : "var(--danger-pale)";
    chip.style.color = t.pass ? "var(--primary-dark)" : "var(--danger)";
    result.append(chip);
    tr.append(td(t.sample), td(`${t.age} days`, "num"), td(`${Number(t.mpa).toFixed(1)} MPa`, "num"), td(`${Number(t.target).toFixed(1)} MPa`, "num"), result, removeButton("tests", t.id));
    table.append(tr);
  });
}

function planPanel() {
  const email = verifiedEmail();
  const items = lastOrder?.items || [];
  return `<div class="plan-chip">
      ${icon("user")}
      <span>Current plan: <strong>${plan ? `${plan.name} · ${formatPHP(plan.price)}/mo` : "none"}</strong></span>
      ${plan ? "" : `<a href="plans.html" class="text-link">Choose a plan</a>`}
    </div>
    <div class="plan-chip">
      ${icon("mail")}
      <span>Email: <strong>${email ? email : "not verified"}</strong></span>
      ${email ? "" : `<a href="index.html#calculator" class="text-link">Verify on the calculator page</a>`}
    </div>
    ${
      lastOrder
        ? `<div class="card" style="box-shadow:none">
            <div class="card-title"><span>Last order ${lastOrder.id}</span><span class="chip">${lastOrder.method}</span></div>
            <ul class="order-lines">${items.map((i) => `<li><span>${i.name} <span class="x">× ${i.qty}</span></span><span class="tabular">${formatPHP(i.price * i.qty)}</span></li>`).join("")}</ul>
            <p class="note" style="margin-top:12px">Placed ${fmtDate(lastOrder.placedAt || Date.now())} · total ${formatPHP(lastOrder.total)} including VAT.</p>
          </div>`
        : `<p class="note">No order yet. <a href="plans.html">See the plans</a> or <a href="services.html">browse services</a>.</p>`
    }
    <div class="toolbar" style="margin-top:20px">
      <button class="btn btn-outline" id="clearDemo">Clear demo data</button>
    </div>`;
}

function render() {
  const m = metrics();
  const tabs = [
    ["estimates", "Estimates", estimates.length],
    ["tests", "Strength tests", tests.length],
    ["plan", "Plan & email", 0],
  ];

  app.innerHTML = `<section class="page"><div class="container">
    <div class="dash-head">
      <div>
        <h1>Workspace</h1>
        <p class="muted">Demo data for ${service ? service.name : "your projects"} — stored in this browser only.</p>
      </div>
      <div class="toolbar" style="margin:0">
        <button class="btn btn-outline" id="printDash">${icon("printer")} Print</button>
        <button class="btn btn-outline" id="openProjectTracker">${icon("plus")} ${service ? formatPHP(service.price) + " " + service.name : "Add service"}</button>
      </div>
    </div>

    <div class="metric-grid">
      <div class="metric-box highlight"><div class="metric-val">${m.count}</div><div class="metric-lbl">Estimates saved</div></div>
      <div class="metric-box"><div class="metric-val">${m.volume.toFixed(2)}</div><div class="metric-lbl">m³ batched</div></div>
      <div class="metric-box"><div class="metric-val">${m.bags.toLocaleString()}</div><div class="metric-lbl">Cement bags</div></div>
      <div class="metric-box"><div class="metric-val">${m.tests}</div><div class="metric-lbl">Tests logged</div></div>
    </div>

    <div class="tabs" role="tablist">
      ${tabs
        .map(
          ([key, label, count]) =>
            `<button class="tab ${key === activeTab ? "active" : ""}" role="tab" aria-selected="${key === activeTab}" data-tab="${key}">${label}${count ? ` (${count})` : ""}</button>`,
        )
        .join("")}
    </div>

    <div class="card" style="box-shadow:none">
      <div id="tabPanel"></div>
    </div>
  </div></section>`;

  const panel = document.getElementById("tabPanel");

  if (activeTab === "plan") {
    panel.innerHTML = planPanel();
    panel.querySelector("#clearDemo").addEventListener("click", () => {
      estimates = [];
      tests = [];
      write(ESTIMATES_KEY, estimates);
      write(TESTS_KEY, tests);
      toast("Demo data cleared", "alert");
      render();
    });
  } else {
    const isEstimates = activeTab === "estimates";
    panel.innerHTML = `<div class="card-title">
        <span>${isEstimates ? "Saved estimates" : "Strength test log"}</span>
        <button class="btn btn-primary sm" id="addRow">${icon("plus")} ${isEstimates ? "Save estimate" : "Log test"}</button>
      </div>
      <div class="table-wrap">
        <table class="data-table" id="rows">
          <thead><tr>${
            isEstimates
              ? "<th>Project</th><th>Mix</th><th class='num'>Volume</th><th class='num'>Cement</th><th>Saved</th>"
              : "<th>Sample</th><th class='num'>Age</th><th class='num'>Strength</th><th class='num'>Target</th><th>Result</th>"
          }<th></th></tr></thead>
          <tbody></tbody>
        </table>
      </div>`;

    const table = panel.querySelector("tbody");
    isEstimates ? renderEstimates(table) : renderTests(table);

    panel.querySelector("#addRow").addEventListener("click", () => (isEstimates ? estimateModal() : testModal()));
  }

  app.querySelectorAll("[data-tab]").forEach((btn) =>
    btn.addEventListener("click", () => {
      activeTab = btn.dataset.tab;
      render();
    }),
  );

  document.getElementById("printDash").addEventListener("click", () => window.print());
  document.getElementById("openProjectTracker").addEventListener("click", () => {
    const s = getService("project-tracker");
    if (!s) return;
    cart.add(s.id);
    toast(`${s.name} added to your order`);
    setTimeout(() => openCart(true), 350);
  });
}

/* ---------- modals ---------- */

function modal(title, fieldsHTML, onSubmit) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay open";
  overlay.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true">
    <button class="modal-close" data-close aria-label="Close">✕</button>
    <h3>${title}</h3>
    <form id="modalForm"><div class="fields">${fieldsHTML}</div>
      <button type="submit" class="btn btn-primary btn-full" style="margin-top:16px">Save</button>
    </form>
  </div>`;
  document.body.append(overlay);
  overlay.querySelector("input, select")?.focus();

  const close = () => overlay.remove();
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay || e.target.closest("[data-close]")) close();
  });
  document.addEventListener("keydown", function esc(e) {
    if (e.key === "Escape") {
      close();
      document.removeEventListener("keydown", esc);
    }
  });

  overlay.querySelector("#modalForm").addEventListener("submit", (e) => {
    e.preventDefault();
    onSubmit(new FormData(e.target));
    close();
  });
}

function estimateModal() {
  const fields = `<label class="field"><span>Project</span><input class="form-input" name="project" required maxlength="60" placeholder="Grand Meridian Tower"></label>
    <label class="field"><span>Mix</span><select class="form-select" name="grade">${Object.keys(MIX).map((g) => `<option value="${g}">${MIX[g].label}</option>`).join("")}</select></label>
    <label class="field"><span>Volume (m³)</span><input class="form-input" name="volume" type="number" min="0.1" step="0.05" value="10" required></label>`;

  modal("Save estimate", fields, (data) => {
    const grade = String(data.get("grade"));
    const volume = Math.max(Number(data.get("volume")) || 0, 0);
    estimates = [
      { id: `e${Date.now()}`, project: String(data.get("project")).trim().slice(0, 60), grade, volume, bags: bagsFor(grade, volume), savedAt: new Date().toISOString() },
      ...estimates,
    ];
    write(ESTIMATES_KEY, estimates);
    toast("Estimate saved");
    render();
  });
}

function testModal() {
  const fields = `<label class="field"><span>Sample</span><input class="form-input" name="sample" required maxlength="40" placeholder="Slab S1 · 7-day"></label>
    <div class="fields two">
      <label class="field"><span>Age (days)</span><input class="form-input" name="age" type="number" min="1" max="90" value="7" required></label>
      <label class="field"><span>Target (MPa)</span><input class="form-input" name="target" type="number" min="1" step="0.5" value="25" required></label>
    </div>
    <label class="field"><span>Measured (MPa)</span><input class="form-input" name="mpa" type="number" min="0" step="0.1" value="20" required></label>`;

  modal("Log strength test", fields, (data) => {
    const mpa = Math.max(Number(data.get("mpa")) || 0, 0);
    const target = Math.max(Number(data.get("target")) || 0, 0);
    tests = [
      { id: `t${Date.now()}`, sample: String(data.get("sample")).trim().slice(0, 40), age: Math.round(Number(data.get("age")) || 0), mpa, target, pass: mpa >= target, loggedAt: new Date().toISOString() },
      ...tests,
    ];
    write(TESTS_KEY, tests);
    toast("Strength test logged", "flask");
    render();
  });
}

// delete rows anywhere on the page
app.addEventListener("click", (e) => {
  const del = e.target.closest("[data-del]");
  if (!del) return;
  const [collection, id] = del.dataset.del.split(":");
  if (collection === "estimates") estimates = estimates.filter((x) => x.id !== id);
  if (collection === "tests") tests = tests.filter((x) => x.id !== id);
  write(collection === "estimates" ? ESTIMATES_KEY : TESTS_KEY, collection === "estimates" ? estimates : tests);
  toast("Row deleted");
  render();
});

render();
initMotion();
fillIcons();
