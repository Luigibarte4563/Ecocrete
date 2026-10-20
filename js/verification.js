// Email verification card: 6-digit code, server-side check, remembered in localStorage.
import { EMAIL_RE } from "./data.js";
import { toast } from "./layout.js";
import { icon } from "./icons.js";

const KEY = "ecocrete-verified";
const card = document.getElementById("verificationCard");

if (card) init();

function stored() {
  try {
    return localStorage.getItem(KEY) || "";
  } catch {
    return "";
  }
}

function remember(email) {
  try {
    localStorage.setItem(KEY, email);
  } catch {}
}

export function verifiedEmail() {
  return stored();
}

async function post(path, payload) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  let data = {};
  try {
    data = await res.json();
  } catch {}
  if (!res.ok || !data.success) throw new Error(data.message || "Something went wrong. Please try again.");
  return data;
}

function init() {
  const startedAt = Date.now(); // the server rejects submissions faster than a human can type

  card.innerHTML = `<h4 style="font-size:13px;font-weight:800;color:#111827;margin-bottom:6px">Email verification</h4>
    <div id="verifyBody"></div>`;

  const body = card.querySelector("#verifyBody");

  const formView = () => {
    body.innerHTML = `<p class="note" style="margin-bottom:10px">Verify your address to get the batch sheet and report by email.</p>
      <div style="display:flex;gap:8px">
        <input type="email" class="form-input" id="verifyEmail" placeholder="you@company.ph" autocomplete="email" />
        <button class="btn btn-primary" id="btnSendCode">Send code</button>
      </div>
      <input class="sr-only" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" id="verifyWebsite" />
      <div id="otpGroup" class="hidden" style="margin-top:14px">
        <div class="digits-input-group">
          ${Array.from({ length: 6 }, (_, i) => `<input type="text" inputmode="numeric" maxlength="1" class="digit-box" aria-label="Digit ${i + 1}" />`).join("")}
        </div>
        <button class="btn btn-primary btn-full" id="btnVerify">Verify email</button>
        <p class="note" id="verifyStatus" role="status" style="margin-top:8px">Check your inbox and spam folder. The code expires in 10 minutes.</p>
      </div>`;

    const boxes = [...body.querySelectorAll(".digit-box")];
    const status = body.querySelector("#verifyStatus");
    const sendBtn = body.querySelector("#btnSendCode");
    const verifyBtn = body.querySelector("#btnVerify");
    const group = body.querySelector("#otpGroup");

    boxes.forEach((box, i) => {
      box.addEventListener("input", () => {
        box.value = box.value.replace(/\D/g, "").slice(0, 1);
        if (box.value && i < 5) boxes[i + 1].focus();
      });
      box.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !box.value && i > 0) boxes[i - 1].focus();
      });
      box.addEventListener("paste", (e) => {
        e.preventDefault();
        const digits = (e.clipboardData || window.clipboardData).getData("text").replace(/\D/g, "").slice(0, 6);
        boxes.forEach((b, n) => (b.value = digits[n] || ""));
        (boxes[digits.length >= 6 ? 5 : digits.length] || boxes[0]).focus();
      });
    });

    sendBtn.addEventListener("click", async () => {
      const email = body.querySelector("#verifyEmail").value.trim();
      if (!EMAIL_RE.test(email)) {
        status.textContent = "Enter a valid email address.";
        status.classList.add("error");
        return;
      }
      sendBtn.disabled = true;
      sendBtn.textContent = "Sending…";
      try {
        const data = await post("/api/verification/send-code", {
          email,
          website: body.querySelector("#verifyWebsite").value,
          startedAt,
        });
        group.classList.remove("hidden");
        status.textContent = data.message || "Code sent. Check your inbox.";
        status.classList.remove("error");
        boxes[0].focus();
      } catch (err) {
        status.textContent = err.message;
        status.classList.add("error");
      } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = "Send code";
      }
    });

    verifyBtn.addEventListener("click", async () => {
      const email = body.querySelector("#verifyEmail").value.trim();
      const code = boxes.map((b) => b.value).join("");
      if (code.length !== 6) {
        status.textContent = "Enter all 6 digits.";
        status.classList.add("error");
        return;
      }
      verifyBtn.disabled = true;
      verifyBtn.textContent = "Checking…";
      try {
        await post("/api/verification/verify-code", { email, code });
        remember(email);
        toast("Email verified");
        verifiedView(email);
      } catch (err) {
        status.textContent = err.message;
        status.classList.add("error");
      } finally {
        verifyBtn.disabled = false;
        verifyBtn.textContent = "Verify email";
      }
    });
  };

  const verifiedView = (email) => {
    body.innerHTML = `<p style="color:#065F46;font-weight:700;font-size:13px;display:flex;align-items:center;gap:8px">
        ${icon("check")} ${email} is verified
      </p>
      <p class="note" style="margin-top:6px">Batch sheets and reports go to this address.
        <button class="text-link" id="verifyAgain">Use another address</button>
      </p>`;
    body.querySelector("#verifyAgain").addEventListener("click", () => {
      try {
        localStorage.removeItem(KEY);
      } catch {}
      formView();
    });
  };

  const email = stored();
  email ? verifiedView(email) : formView();
}
