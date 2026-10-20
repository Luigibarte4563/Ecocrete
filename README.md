# EcoCrete

Concrete mix estimation site: a batching calculator, a services catalogue, monthly plans, a cart
and checkout with a real booking email, a refund flow, email verification and a demo workspace.
Plain HTML, CSS and JavaScript, plus one small Node server for the Gmail mailer. No build step.

## Run

```
npm install
npm start
```

Then open http://localhost:4173. Copy `.env.example` to `.env` and fill it in if you want email to
actually send. `npm start` serves the pages and all three API endpoints from one origin, so there is
no CORS setup. A plain static server (Live Server, `python -m http.server`) still shows the pages but
checkout will report that the email service is not running — always use `npm start` when testing email.

## Pages

| Page | What it does |
| --- | --- |
| `index.html` | Mix calculator: dimensions, grade, wastage, aggregate size, SCM replacement, batch table with material cost, carbon saving, printable batch sheet, plans preview |
| `services.html` | Five one-off services, what's-included comparison table, FAQ |
| `plans.html` | Starter / Professional / Enterprise, comparison table, FAQ |
| `cart.html` | Cart lines with quantity steppers, totals, checkout link |
| `checkout.html` | Contact, project and payment method, order summary |
| `success.html` | Order reference, confirmation note, receipt, refund link |
| `refund.html` | Receipt plus refund form; works from the email link on any device |
| `dashboard.html` | Demo workspace: saved estimates, strength test log, plan and email status |

## Files

- `css/styles.css`: all styles
- `js/data.js`: brand string, catalogue, plans, mix table, material prices, batch maths, totals
- `js/cart.js`: cart in localStorage; holds catalogue lines and custom calculator lines
- `js/layout.js`: header, footer, cart drawer, toasts
- `js/home.js`: the calculator and its cost column
- `js/verification.js`: the 6-digit email code card
- `js/subscription.js`: the bank transfer modal
- `js/mailer.js`: `sendEmail()` client; `js/refund-data.js`: order packed into the refund link
- `lib/mailer.js`: validation, rate limit, Gmail SMTP, email templates
- `lib/verification.js`: 6-digit code store
- `server.js`: static server plus `/api/send-email`, `/api/verification/send-code`, `/api/verification/verify-code`

## Flows

1. **Estimate** — set the mix, read the batch table, print the sheet. "Add Pro Estimate Report for
   this mix" puts a cart line with the mix snapshot on it.
2. **Order** — cart → checkout → the booking email goes to the customer and an owner copy to
   `GMAIL_USER` (+ `MAIL_BCC`) → success page.
3. **Refund** — the confirmation email carries a *Request a refund* button. The order is base64
   packed in that link, so the page shows the receipt even on another device. Cancel within 7 days:
   20% fee, 80% back, then the request is emailed to the customer and the owner.
4. **Verify** — the calculator's card sends a 6-digit code to an address and checks it back.

## Email (Gmail)

Both copies go out in parallel. If Gmail rejects the buyer's address the order still completes, the
API answers `buyerEmailFailed: true`, and the success page asks them to check the address. If the
owner copy fails it is retried once, only for the addresses that were not accepted; if it still fails
checkout stays on the page and shows an error, and nothing is stored.

| Variable | Required | Meaning |
| --- | --- | --- |
| `GMAIL_USER` | yes | full Gmail address; also the only allowed sender |
| `GMAIL_APP_PASSWORD` | yes | 16-character App Password (2-Step Verification must be on) |
| `MAIL_FROM_NAME` | no | display name, defaults to `EcoCrete` |
| `MAIL_REPLY_TO` | no | where replies go |
| `MAIL_BCC` | no | extra address that gets an owner copy of every email |
| `PORT` | no | defaults to `4173` |

Missing credentials do not break the site: the endpoints answer `503 Email service is not configured.`

## Abuse protection

Honeypot field (bots get a fake success and nothing is sent), a 3-second minimum fill time, 5 emails
per 10 minutes per IP, 5 codes per 10 minutes per address, 20 code checks per 10 minutes per IP,
single-recipient validation (no comma lists), a subject length and CR/LF check, a 20 000-character
message cap, `http(s)`-only email buttons, a 64 KB body cap, `Content-Type: application/json` required,
and a sender pinned to `GMAIL_USER`. Rate limits and codes live in memory, so a cold start clears them.

These raise the cost for bots but are **not authentication**: anyone calling the API directly can
forge `startedAt` and change IP. For a genuinely public site the fix is user accounts plus a captcha.

## Tests

```
npm test
```

41 assertions over the mailer rules and delivery outcomes, the refund link codec, the verification
code lifecycle (expiry, attempt limit, replacement) and the batch maths, cart lines and totals.

## Demo limits

- **Payment is a mock.** No card is charged and no order reaches a payment provider.
- **The dashboard has no login** and stores its rows in this browser's localStorage only.
- **Email verification proves the address, it does not protect anything** — there are no accounts.
- **The bank transfer details in the subscription modal are placeholders.** Replace them first.
- **The refund link's order payload is unsigned base64** — it is readable and forgeable, so refunds
  are still reviewed by a human.

## Deploy

Import the repo on Vercel: it detects `server.js` as the Node entrypoint and routes everything to it.
Set the environment variables above, then redeploy. `vercel.json` raises the function limit to 30
seconds for SMTP and keeps the static assets in the bundle. GitHub Pages is static-only, so it cannot
send email.
