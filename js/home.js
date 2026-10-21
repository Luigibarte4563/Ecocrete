import "./layout.js";
import { openCart, toast } from "./layout.js";
import * as cart from "./cart.js";
import { CARBON_PER_KG_CEMENT, SCM, formatPHP, getService, mixBatch } from "./data.js";
import { icon, fillIcons } from "./icons.js";
import { initMotion } from "./motion.js";
import "./verification.js";
import "./subscription.js";
import "./plans.js"; // fills the plans preview on this page too

const $ = (id) => document.getElementById(id);

function readInputs() {
  return {
    grade: $("strengthGrade").value,
    length: parseFloat($("dimLength").value) || 0,
    width: parseFloat($("dimWidth").value) || 0,
    depth: parseFloat($("dimDepth").value) || 0,
    waste: parseFloat($("wastage").value) || 0,
    maxAgg: Number($("maxAgg").value),
    scmType: $("scmType").value,
    scmPct: (parseInt($("scmSlider").value, 10) || 0) / 100,
  };
}

function render() {
  const i = readInputs();
  const r = mixBatch(i);
  const tons = (kg) => `${(kg / 1000).toFixed(1)} t`;
  const kg = (n) => `${Math.round(n).toLocaleString()} kg`;

  $("netVolumeBadge").innerText = `${r.volume.toFixed(2)} m³ Batch`;
  $("resCementBags").innerText = r.bags;
  $("resSandTonnes").innerText = tons(r.sandKg);
  $("resGravelTonnes").innerText = tons(r.gravelKg);
  $("resWaterLiters").innerText = `${r.waterL.toLocaleString()} L`;
  $("resMaterialCost").innerText = formatPHP(r.total);

  const scm = SCM[i.scmType] || SCM.none;
  $("batchTableBody").innerHTML = `
    <tr><td><strong>Portland Cement</strong></td><td>${kg(r.cementKg)}</td><td>${r.bags} × 50 kg bags</td><td class="num">${formatPHP(r.cost.cement)}</td></tr>
    ${r.scmKg > 0 ? `<tr><td><strong>${scm.short}</strong></td><td>${kg(r.scmKg)}</td><td>Eco replacement</td><td class="num">${formatPHP(r.cost.scm)}</td></tr>` : ""}
    <tr><td><strong>Sand</strong></td><td>${kg(r.sandKg)}</td><td>${(r.sandKg / 1000).toFixed(2)} t</td><td class="num">${formatPHP(r.cost.sand)}</td></tr>
    <tr><td><strong>Gravel (${i.maxAgg} mm)</strong></td><td>${kg(r.gravelKg)}</td><td>${(r.gravelKg / 1000).toFixed(2)} t</td><td class="num">${formatPHP(r.cost.gravel)}</td></tr>
    <tr><td><strong>Water</strong></td><td>${r.waterL.toLocaleString()} L</td><td>${r.waterL} kg</td><td class="num">—</td></tr>
    <tr><td><strong>Estimated material cost</strong></td><td colspan="2" class="muted">excludes labor and VAT</td><td class="num"><strong>${formatPHP(r.total)}</strong></td></tr>
  `;
  $("carbonDetails").innerText = r.scmKg > 0
    ? `Replaced ${Math.round(r.scmKg)} kg cement with ${scm.short}, saving ~${Math.round(r.savedKg)} kg CO₂e.`
    : "No replacement yet: pick a fly ash, slag or silica fume replacement to cut the cement in this mix.";

  // the slider only means something once a replacement is selected
  const noScm = i.scmType === "none";
  $("scmSlider").disabled = noScm;
  $("scmPctLabel").innerText = noScm ? "No replacement" : `${Math.round(i.scmPct * 100)}% SCM`;

  return { i, r, scm };
}

function applyPreset(p) {
  const presets = {
    slab: [10, 10, 0.15, "C25"],
    driveway: [18, 3.5, 0.12, "C30"],
    footing: [24, 0.6, 0.45, "C20"],
    column: [0.5, 0.5, 3.2, "C40"],
  };
  const [length, width, depth, grade] = presets[p] || presets.slab;
  $("dimLength").value = length;
  $("dimWidth").value = width;
  $("dimDepth").value = depth;
  $("strengthGrade").value = grade;
  render();
}

function resetDefaults() {
  $("dimLength").value = 10;
  $("dimWidth").value = 5;
  $("dimDepth").value = 0.15;
  $("strengthGrade").value = "C25";
  $("wastage").value = "10";
  $("maxAgg").value = "20";
  $("scmType").value = "flyash";
  $("scmSlider").value = 20;
  $("scmPctLabel").innerText = "20% SCM";
  render();
}

// the calculator's line in the cart: the report you buy, carrying the mix snapshot
function addEstimate() {
  const service = getService("pro-estimate");
  const { i, r } = render();
  const scm = SCM[i.scmType] || SCM.none;
  // with no replacement the slider value means nothing, so it never reaches the line
  const pct = i.scmType === "none" ? 0 : Math.round(i.scmPct * 100);
  const name = `${service.name} — ${i.grade} mix`;
  cart.add(`custom:${i.grade}:${r.volume.toFixed(2)}:${i.scmType}:${pct}`, {
    name,
    unit: service.unit,
    price: service.price,
    meta: `${r.volume.toFixed(2)} m³ · ${r.bags} bags${pct ? ` · ${pct}% ${scm.short}` : ""} · ${formatPHP(r.total)} materials`,
  });
  toast(`${name} added — ${cart.count()} line${cart.count() === 1 ? "" : "s"} in your order`);
  setTimeout(() => openCart(true), 350);
}

const SCM_NOTES = {
  flyash: { range: "15–35% replacement", note: "Slows early strength, improves workability and long-term strength. The cheapest way to cut cement." },
  ggbfs: { range: "30–50% replacement", note: "Near-Portland early strength, much lower heat of hydration, good for mass pours." },
  silica: { range: "5–10% replacement", note: "Very high strength and low permeability. Expensive, used for high-performance mixes." },
};

function renderScmGuide() {
  const el = document.getElementById("scm-grid");
  if (!el) return;
  el.innerHTML = ["flyash", "ggbfs", "silica"].map((key, i) => {
    const s = SCM[key];
    const extra = SCM_NOTES[key];
    return `<article class="service-card" data-fade data-delay="${i * 80}">
      <div class="service-top"><span class="index-pill">${s.short}</span><span class="badge-pill">${extra.range}</span></div>
      <h3>${s.label}</h3>
      <p class="service-desc">${extra.note}</p>
      <p class="price">${formatPHP(s.pricePerKg)} <small style="font-size:12px;font-weight:600">per kg</small></p>
      <ul class="features"><li>${icon("leaf")}<span>Saves ${CARBON_PER_KG_CEMENT} kg CO₂e per kg of cement replaced</span></li></ul>
    </article>`;
  }).join("");
}

renderScmGuide();
render();

// every input recalculates, the way the page used to with onchange handlers
document.querySelectorAll("#calcForm input, #calcForm select").forEach((el) => {
  el.addEventListener("input", () => {
    if (el.id === "scmSlider") $("scmPctLabel").innerText = `${el.value}% SCM`;
    render();
  });
  el.addEventListener("change", render);
});
$("addEstimate").addEventListener("click", addEstimate);
document.querySelectorAll("[data-preset]").forEach((btn) => btn.addEventListener("click", () => applyPreset(btn.dataset.preset)));
$("resetDefaults").addEventListener("click", resetDefaults);
$("printSheet").addEventListener("click", () => window.print());
initMotion();
fillIcons();
