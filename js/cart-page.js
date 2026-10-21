import { badgesHTML } from "./layout.js";
import * as cart from "./cart.js";
import { formatPHP } from "./data.js";
import { icon, arrow, fillIcons } from "./icons.js";

const app = document.getElementById("app");

function render() {
  const items = cart.lines();
  const rows = items
    .map(
      (l) => `<li><div class="line">
        <div class="line-top">
          <div>
            <p class="line-name">${l.name}</p>
            <p class="line-unit">${formatPHP(l.price)} ${l.unit}</p>
          </div>
          <button type="button" class="icon-btn" data-remove="${l.id}" aria-label="Remove ${l.name}">${icon("trash")}</button>
        </div>
        ${l.meta ? `<p class="line-meta">${l.meta}</p>` : ""}
        <div class="line-bottom">${cart.qtyHTML(l.id, l.qty)}<span class="line-total">${formatPHP(l.lineTotal)}</span></div>
      </div></li>`,
    )
    .join("");

  const body = items.length
    ? `<div class="split">
        <ul class="drawer-list">${rows}</ul>
        <aside>
          <div class="summary">
            <h2>Order summary</h2>
            ${cart.totalsHTML(cart.subtotal())}
            <a href="checkout.html" class="btn btn-primary btn-full">Schedule delivery</a>
            <p class="note">Cancel within 7 days and 80% comes back; the 20% balance covers batching and dispatch.</p>
            <div><p class="summary-label">We accept</p>${badgesHTML()}</div>
          </div>
        </aside>
      </div>`
    : `<div class="empty-state">
        <div class="empty-icon">${icon("bag")}</div>
        <h2>Nothing in your order yet</h2>
        <p>Add a mix, a service or a plan to schedule a pour.</p>
        <a href="services.html" class="btn btn-primary">Browse services${arrow()}</a>
      </div>`;

  app.innerHTML = `<section class="page"><div class="container">
      <div class="page-head">
        <h1 class="page-title">Your order</h1>
        ${items.length ? `<button type="button" class="text-link" id="clear">Clear order</button>` : ""}
      </div>
      ${body}
    </div></section>`;
  fillIcons();
}

render();
document.addEventListener("cart:change", render);
app.addEventListener("click", (e) => e.target.id === "clear" && cart.clear());
