// Wire / bank transfer subscription modal.
// shortcut: these account numbers are placeholders — replace them before taking real transfers.
import { PLANS, formatPHP } from "./data.js";
import { toast } from "./layout.js";

const plan = PLANS.find((p) => p.featured) || PLANS[0];

const BANKS = [
  { name: "BDO Unibank", account: "Account 0000-0000-0000 · BRSTN 000-000-000", holder: "EcoCrete Engineering" },
  { name: "Bank of the Philippine Islands", account: "Account 0000-0000-0000 · BRSTN 000-000-000", holder: "EcoCrete Engineering" },
  { name: "Metrobank", account: "Account 0000-0000-0000 · BRSTN 000-000-000", holder: "EcoCrete Engineering" },
  { name: "Land Bank of the Philippines", account: "Account 0000-0000-0000 · BRSTN 000-000-000", holder: "EcoCrete Engineering" },
  { name: "GCash (business)", account: "0917 000 0000", holder: "EcoCrete Engineering" },
];

function markup() {
  return `<div class="modal-overlay" id="subscriptionModal">
    <div class="modal-box" role="dialog" aria-modal="true" aria-label="Upgrade to ${plan.name}">
      <button class="modal-close" data-close-subscription aria-label="Close">✕</button>
      <h3>Upgrade to ${plan.name} (${formatPHP(plan.price)}/mo)</h3>
      <p class="note" style="margin-bottom:16px">Transfer to the account below, then confirm. We activate the workspace once the transfer clears. Demo account details.</p>
      ${BANKS.map(
        (b, i) => `<button type="button" class="bank-card ${i === 0 ? "active" : ""}" data-bank="${i}">
          <strong>${b.name}</strong>
          ${b.account}<br>Beneficiary: ${b.holder}
        </button>`,
      ).join("")}
      <p class="note" style="margin:12px 0 16px">In a hurry? <a href="plans.html">Add a plan to your cart</a> and check out instead.</p>
      <button class="btn btn-primary btn-full" id="confirmWire">Confirm payment</button>
    </div>
  </div>`;
}

if (!document.getElementById("subscriptionModal")) {
  document.body.insertAdjacentHTML("beforeend", markup());
}

const modal = document.getElementById("subscriptionModal");

export function openSubscriptionModal() {
  modal.classList.add("open");
  document.body.classList.add("locked");
}

export function closeSubscriptionModal() {
  modal.classList.remove("open");
  document.body.classList.remove("locked");
}

// the nav button in layout.js calls these
window.openSubscriptionModal = openSubscriptionModal;
window.closeSubscriptionModal = closeSubscriptionModal;

modal.addEventListener("click", (e) => {
  if (e.target === modal || e.target.closest("[data-close-subscription]")) closeSubscriptionModal();

  const bank = e.target.closest("[data-bank]");
  if (bank) modal.querySelectorAll(".bank-card").forEach((el) => el.classList.toggle("active", el === bank));

  if (e.target.closest("#confirmWire")) {
    const selected = modal.querySelector(".bank-card.active strong")?.textContent || "bank transfer";
    const reference = `WIRE-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    closeSubscriptionModal();
    toast(`${reference} · send ${formatPHP(plan.price)} to ${selected}, we activate within 1 business day`, "bank");
  }
});

document.addEventListener("keydown", (e) => e.key === "Escape" && closeSubscriptionModal());
