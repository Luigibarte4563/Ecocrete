import "./layout.js";
import { SERVICES, formatPHP } from "./data.js";
import { icon, fillIcons } from "./icons.js";
import { initMotion } from "./motion.js";
import "./subscription.js";

const SHORT = {
  "pro-estimate": "Estimate Report",
  "mix-design": "Mix Design",
  "supplier-match": "Supplier Match",
  "project-tracker": "Tracker Pro",
  consultation: "Consultation",
};

// which service includes what
const COMPARE = [
  ["Material takeoff and costs", ["pro-estimate"]],
  ["Labor cost estimates (PH rates)", ["pro-estimate"]],
  ["Supplier price comparison", ["pro-estimate", "supplier-match"]],
  ["Custom mix proportioning", ["mix-design"]],
  ["Trial batch adjustments", ["mix-design"]],
  ["Signed engineer's certificate", ["mix-design"]],
  ["Supplier shortlist and negotiation", ["supplier-match"]],
  ["Delivery scheduling and tracking", ["supplier-match"]],
  ["Pours and strength tests tracked", ["project-tracker"]],
  ["Compliance checklist (NSCP, DPWH)", ["project-tracker"]],
  ["Live session with an engineer", ["consultation"]],
];

const FAQS = [
  ["How accurate is the calculator?", "It uses volumetric mix design with a 10% wastage allowance by default, which is what most Philippine sites order against. Treat it as ±5% and still run a trial batch before the first structural pour."],
  ["Do I need a site visit?", "No. Estimates are desk-based from your plans, dimensions and photos. A site visit is only needed for unusual access or for sampling your aggregates."],
  ["What if my quarry's sand or gravel differs?", "Send the grading and the Custom Mix Design re-proportions the mix for the material you actually have, then adjusts after a trial batch."],
  ["How do I pay?", "GCash, Maya, bank transfer (BDO, BPI, Metrobank or Landbank), debit or credit card, cash on delivery, or charged to an approved contractor account. Prices exclude 12% VAT."],
  ["Can I cancel?", "Yes, within 7 days of booking. A 20% cancellation fee applies and you get 80% back. Request it from the link in your confirmation email."],
  ["Do you take projects outside the Philippines?", "No. We only work to NSCP and DPWH references, so we only serve sites in the Philippines."],
];

function cardHTML(s, i) {
  return `<div data-fade data-delay="${i * 80}">
    <article class="service-card ${s.featured ? "featured" : ""}">
      <div class="service-top">
        <span class="index-pill">${s.index}</span>
        ${s.badge ? `<span class="badge-pill">${s.badge}</span>` : ""}
      </div>
      <h3>${s.name}</h3>
      <p class="service-desc">${s.description}</p>
      <p class="price">${formatPHP(s.price)}</p>
      <p class="unit">${s.unit}</p>
      <ul class="features">${s.features.map((f) => `<li>${icon("check")}<span>${f}</span></li>`).join("")}</ul>
      <button type="button" class="btn ${s.featured ? "btn-primary" : "btn-outline"} btn-full" data-add="${s.id}">${icon("plus")} Add to order</button>
    </article>
  </div>`;
}

const grid = document.getElementById("services-grid");
if (grid) grid.innerHTML = SERVICES.map(cardHTML).join("");

const compare = document.getElementById("compare");
if (compare) {
  const head = SERVICES.map((s) => `<th class="${s.featured ? "hl" : ""}">${SHORT[s.id]}<br><small class="muted">${formatPHP(s.price)}</small></th>`).join("");
  const rows = COMPARE.map(
    ([label, ids]) => `<tr><td>${label}</td>${SERVICES.map((s) => {
      const has = ids.includes(s.id);
      return `<td class="${s.featured ? "hl" : ""}">${icon(has ? "check" : "minus", has ? "yes" : "no")}</td>`;
    }).join("")}</tr>`,
  ).join("");
  compare.innerHTML = `<thead><tr><th>Feature</th>${head}</tr></thead><tbody>${rows}</tbody>`;
}

const faq = document.getElementById("faq");
if (faq) faq.innerHTML = FAQS.map(([q, a]) => `<details><summary>${q}<span>+</span></summary><p>${a}</p></details>`).join("");

initMotion();
fillIcons();
