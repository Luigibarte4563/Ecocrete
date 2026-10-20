import { BRAND, CONTACT, PAYMENTS, PLANS, SERVICES, formatPHP } from "./data.js";
import { icon, fillIcons } from "./icons.js";
import * as cart from "./cart.js";

const LINKS = [
  { href: "index.html", label: "Calculator" },
  { href: "services.html", label: "Services" },
  { href: "plans.html", label: "Plans & Pricing" },
  { href: "dashboard.html", label: "Dashboard" },
];

const page = location.pathname.split("/").pop() || "index.html";

export const badgesHTML = () => `<ul class="badges">${PAYMENTS.map((m) => `<li>${m}</li>`).join("")}</ul>`;

/* header */
function header() {
  const links = LINKS.map((l) => `<a href="${l.href}" class="nav-link ${l.href === page ? "active" : ""}">${l.label}</a>`);
  return `<div class="container nav-inner">
      <a href="index.html" class="brand">
        <span class="brand-icon">${icon("leaf")}</span>
        <span>
          <span class="brand-text">${BRAND.name}</span>
          <div class="brand-sub">${BRAND.sub}</div>
        </span>
      </a>
      <nav class="nav-links">${links.join("")}</nav>
      <div class="nav-actions">
        <button type="button" class="cart-btn" data-open-cart aria-label="Open cart">
          ${icon("bag")}<span class="cart-count">0</span>
        </button>
        <button type="button" class="nav-btn" data-upgrade>Upgrade to Pro</button>
        <button type="button" class="mobile-menu-btn" aria-label="Open menu" aria-expanded="false">${icon("menu")}</button>
      </div>
    </div>
    <div class="mobile-menu">${LINKS.map((l) => `<a href="${l.href}">${l.label}</a>`).join("")}</div>`;
}

/* footer */
function footer() {
  return `<div class="container footer-top">
      <div>
        <span class="brand">
          <span class="brand-icon">${icon("leaf")}</span>
          <span><span class="brand-text">${BRAND.name}</span><div class="brand-sub">${BRAND.sub}</div></span>
        </span>
        <p class="footer-blurb">Concrete mix estimation, batching sheets and carbon reporting for Philippine projects.</p>
      </div>
      <div>
        <h4>Services</h4>
        <ul class="footer-list">${SERVICES.map((s) => `<li><a href="services.html">${s.name}</a></li>`).join("")}</ul>
      </div>
      <div>
        <h4>Plans</h4>
        <ul class="footer-list">${PLANS.map((p) => `<li><a href="plans.html">${p.name}</a></li>`).join("")}</ul>
      </div>
      <div>
        <h4>Contact</h4>
        <ul class="footer-list">
          <li>${CONTACT.email}</li>
          <li>${CONTACT.phone}</li>
          <li>${CONTACT.address}</li>
          <li>${CONTACT.hours}</li>
        </ul>
        <h4 style="margin-top:16px">We accept</h4>
        ${badgesHTML()}
      </div>
    </div>
    <div class="container footer-bottom">
      <p>© ${new Date().getFullYear()} ${BRAND.name}. Payment is a demo; no card is charged.</p>
      <p>Prices exclude 12% VAT.</p>
    </div>`;
}

/* cart drawer */
function drawerBody() {
  const items = cart.lines();
  if (!items.length) {
    return `<div class="empty-state" style="border:none;box-shadow:none;padding:24px 0">
      <div class="empty-icon">${icon("bag")}</div>
      <h2>Your cart is empty</h2>
      <p>Add a service or a plan to get started.</p>
      <a href="services.html" class="btn btn-primary">Browse services</a>
    </div>`;
  }
  const rows = items
    .map(
      (l) => `<li class="line">
        <div class="line-top">
          <div>
            <p class="line-name">${l.name}</p>
            <p class="line-unit">${formatPHP(l.price)} ${l.unit}</p>
          </div>
          <button type="button" class="icon-btn" data-remove="${l.id}" aria-label="Remove ${l.name}">${icon("trash")}</button>
        </div>
        ${l.meta ? `<p class="line-meta">${l.meta}</p>` : ""}
        <div class="line-bottom">${cart.qtyHTML(l.id, l.qty)}<span class="line-total">${formatPHP(l.lineTotal)}</span></div>
      </li>`,
    )
    .join("");
  return `<ul class="drawer-list">${rows}</ul>
    <div class="drawer-foot">
      ${cart.totalsHTML(cart.subtotal())}
      <div class="two">
        <a href="cart.html" class="btn btn-outline">View cart</a>
        <a href="checkout.html" class="btn btn-primary">Checkout</a>
      </div>
    </div>`;
}

function drawer() {
  return `<button type="button" class="drawer-backdrop" data-close-cart aria-label="Close cart"></button>
    <aside class="drawer-panel" role="dialog" aria-modal="true" aria-label="Your cart">
      <div class="drawer-head">
        <h2>Your cart</h2>
        <button type="button" class="icon-btn" data-close-cart aria-label="Close cart">${icon("x")}</button>
      </div>
      <div class="drawer-body"></div>
    </aside>`;
}

export function openCart(open = true) {
  document.querySelector(".drawer")?.classList.toggle("open", open);
  document.body.classList.toggle("locked", open);
}

export function toast(message, name = "check") {
  const wrap = document.querySelector(".toast-wrap");
  const el = document.createElement("div");
  el.className = "toast";
  el.setAttribute("role", "status");
  el.innerHTML = `${icon(name)}<span></span>`;
  el.querySelector("span").textContent = message;
  wrap.append(el);
  setTimeout(() => el.remove(), 3600);
}

function refresh() {
  const n = cart.count();
  const countEl = document.querySelector(".cart-count");
  if (countEl) countEl.textContent = n;
  document.querySelector(".cart-btn")?.setAttribute("aria-label", n ? `Open cart, ${n} items` : "Open cart");
  const body = document.querySelector(".drawer-body");
  if (body) body.innerHTML = drawerBody();
}

/* mount */
const headerEl = document.getElementById("header");
const footerEl = document.getElementById("footer");
if (headerEl) headerEl.outerHTML = `<header class="navbar">${header()}</header>`;
if (footerEl) footerEl.outerHTML = `<footer class="footer">${footer()}</footer>`;
document.body.insertAdjacentHTML("beforeend", `<div class="drawer">${drawer()}</div><div class="toast-wrap"></div>`);
refresh();
fillIcons();
document.addEventListener("cart:change", refresh);

// mobile menu
const menuBtn = document.querySelector(".mobile-menu-btn");
const menu = document.querySelector(".mobile-menu");
menuBtn?.addEventListener("click", () => {
  const open = !menu.classList.contains("open");
  menu.classList.toggle("open", open);
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.innerHTML = icon(open ? "x" : "menu");
});
menu?.addEventListener("click", (e) => {
  if (e.target.closest("a")) menuBtn.click();
});

// open / close drawer, upgrade button, add to cart buttons
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-open-cart]")) openCart(true);
  if (e.target.closest("[data-close-cart]") || e.target.closest(".drawer a")) openCart(false);

  const upgrade = e.target.closest("[data-upgrade]");
  if (upgrade) {
    if (typeof window.openSubscriptionModal === "function") window.openSubscriptionModal();
    else location.href = "plans.html";
  }

  const addBtn = e.target.closest("[data-add]");
  if (addBtn) {
    cart.add(addBtn.dataset.add);
    const original = addBtn.innerHTML;
    addBtn.innerHTML = `${icon("check")} Added to cart`;
    toast(`${cart.count()} item${cart.count() === 1 ? "" : "s"} in your cart`);
    setTimeout(() => openCart(true), 350);
    setTimeout(() => (addBtn.innerHTML = original), 1600);
  }
});
document.addEventListener("keydown", (e) => e.key === "Escape" && openCart(false));
