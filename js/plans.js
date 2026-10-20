import "./layout.js";
import { PLANS, formatPHP } from "./data.js";
import { icon, fillIcons } from "./icons.js";
import { initMotion } from "./motion.js";
import "./subscription.js";

const ROWS = [
  ["projects", "Active projects"],
  ["seats", "Team seats"],
  ["batching", "Automated batching sheets"],
  ["suppliers", "Supplier price comparisons"],
  ["carbon", "Carbon and SCM reporting"],
  ["exports", "Report exports"],
  ["support", "Support"],
];

const FAQS = [
  ["Is there a lock-in contract?", "No. Plans run month to month and you can cancel any time. Cancel within 7 days of a payment and 80% comes back (a 20% cancellation fee applies)."],
  ["What counts as an active project?", "A project with a pour or an estimate saved in the last 90 days. Archived projects stay readable but do not count against the limit."],
  ["Can I change plan later?", "Yes. Upgrades apply immediately and are pro-rated; downgrades apply at the next billing cycle."],
];

function cardHTML(p, i) {
  return `<div data-fade data-delay="${i * 80}">
    <article class="pricing-card ${p.featured ? "featured" : ""}">
      <div class="service-top">
        <span class="index-pill">${p.index}</span>
        ${p.badge ? `<span class="badge-pill">${p.badge}</span>` : ""}
      </div>
      <h3 class="tier-name" style="margin-top:10px">${p.name}</h3>
      <p class="service-desc">${p.description}</p>
      <p class="tier-price">${formatPHP(p.price)}<small> / month</small></p>
      <p class="tier-note">Excluding 12% VAT. ${p.unit}.</p>
      <ul class="features">${p.features.map((f) => `<li>${icon("check")}<span>${f}</span></li>`).join("")}</ul>
      <button type="button" class="btn ${p.featured ? "btn-primary" : "btn-outline"} btn-full" data-add="${p.id}">${icon("plus")} Add to cart</button>
    </article>
  </div>`;
}

const grid = document.getElementById("plans-grid");
if (grid) grid.innerHTML = PLANS.map(cardHTML).join("");

const compare = document.getElementById("compare");
if (compare) {
  const head = PLANS.map((p) => `<th class="${p.featured ? "hl" : ""}">${p.name}<br><small class="muted">${formatPHP(p.price)}</small></th>`).join("");
  const rows = ROWS.map(([key, label]) => {
    return `<tr><td>${label}</td>${PLANS.map((p) => {
      const value = p.compare[key];
      const cell = typeof value === "boolean" ? icon(value ? "check" : "minus", value ? "yes" : "no") : `<span class="tabular">${value}</span>`;
      return `<td class="${p.featured ? "hl" : ""}">${cell}</td>`;
    }).join("")}</tr>`;
  }).join("");
  compare.innerHTML = `<thead><tr><th>Plan</th>${head}</tr></thead><tbody>${rows}</tbody>`;
}

const faq = document.getElementById("faq");
if (faq) faq.innerHTML = FAQS.map(([q, a]) => `<details><summary>${q}<span>+</span></summary><p>${a}</p></details>`).join("");

initMotion();
fillIcons();
