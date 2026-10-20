// Static files plus three JSON endpoints on one origin. `npm start` runs this locally,
// and Vercel uses server.listen() here as the Node server entrypoint.
import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EMAIL_RE, createLimiter, handle, mailerConfigured, MIN_FILL_MS, sendVerification } from "./lib/mailer.js";
import { CODE_RE, CODE_TTL_MS, checkCode, issueCode } from "./lib/verification.js";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 4173;
const MAX_BODY = 64 * 1024;

// 5 codes per 10 minutes per address, 20 checks per 10 minutes per IP (the send limiter lives in lib/mailer.js)
const codeLimiter = createLimiter(5, 10 * 60 * 1000);
const checkLimiter = createLimiter(20, 10 * 60 * 1000);

const fail = (message, status = 400) => Object.assign(new Error(message), { status });

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let tooBig = false;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        tooBig = true;
        chunks.length = 0;
        return;
      }
      if (!tooBig) chunks.push(chunk);
    });
    req.on("end", () => (tooBig ? reject(fail("Payload too large.", 413)) : resolve(Buffer.concat(chunks).toString("utf8"))));
    req.on("error", reject);
  });
}

function send(res, status, payload, headers = {}) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers });
  res.end(JSON.stringify(payload));
}

async function json(req, res) {
  if (req.method !== "POST") {
    send(res, 405, { success: false, message: "Method not allowed." }, { allow: "POST" });
    return null;
  }
  // requiring JSON also blocks cross-site form posts, which cannot set this header
  if (!String(req.headers["content-type"] || "").toLowerCase().includes("application/json")) {
    send(res, 415, { success: false, message: "Content-Type must be application/json." });
    return null;
  }
  try {
    return JSON.parse(await readBody(req));
  } catch (err) {
    send(res, err.status || 400, { success: false, message: err.status ? err.message : "Invalid JSON body." });
    return null;
  }
}

// shared by both verification endpoints
function human(payload) {
  if (typeof payload?.website === "string" && payload.website.trim()) return { bot: true };
  const elapsed = Date.now() - payload?.startedAt;
  if (!Number.isFinite(payload?.startedAt) || (elapsed >= 0 && elapsed < MIN_FILL_MS))
    return { error: "Please take a moment and try again." };
  const email = String(payload?.email || "").trim();
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };
  return { email };
}

const CODE_MINUTES = Math.round(CODE_TTL_MS / 60000);
const OK_SENT = { success: true, message: "Email accepted for sending." };

async function api(req, res, pathname) {
  if (pathname === "/api/send-email") {
    const payload = await json(req, res);
    if (!payload) return;
    const { status, body, headers } = await handle(payload, req.socket.remoteAddress || "unknown");
    return send(res, status, body, headers);
  }

  if (pathname === "/api/verification/send-code") {
    const payload = await json(req, res);
    if (!payload) return;
    const check = human(payload);
    if (check.bot) return send(res, 200, OK_SENT); // bots get the same answer, no email goes out
    if (check.error) return send(res, 400, { success: false, message: check.error });
    if (!mailerConfigured) return send(res, 503, { success: false, message: "Email service is not configured." });
    if (codeLimiter(check.email))
      return send(res, 429, { success: false, message: "Too many codes requested. Please try again later." }, { "retry-after": "600" });

    const { code, expiresIn } = issueCode(check.email);
    const result = await sendVerification({ to: check.email, code, minutes: CODE_MINUTES });
    if (!result.ok) return send(res, result.status, { success: false, message: result.message });
    return send(res, 200, { success: true, message: result.message, expiresIn });
  }

  if (pathname === "/api/verification/verify-code") {
    const payload = await json(req, res);
    if (!payload) return;
    const email = String(payload?.email || "").trim();
    const code = String(payload?.code || "").trim();
    if (!EMAIL_RE.test(email) || !CODE_RE.test(code)) return send(res, 400, { success: false, message: "Enter the 6-digit code." });
    if (checkLimiter(req.socket.remoteAddress || "unknown"))
      return send(res, 429, { success: false, message: "Too many attempts. Please try again later." }, { "retry-after": "600" });

    const result = checkCode(email, code);
    if (!result.ok) return send(res, 400, { success: false, message: result.message });
    return send(res, 200, { success: true, verified: true, message: result.message });
  }

  return send(res, 404, { success: false, message: "Not found." });
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

// never served: secrets, server code, tests and build config
const PRIVATE = new Set(["package.json", "package-lock.json", "server.js", "vercel.json", "README.md"]);

function notFound(res) {
  res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  res.end("Not found");
}

async function serveStatic(res, pathname) {
  let rel;
  try {
    rel = decodeURIComponent(pathname);
  } catch {
    rel = "/";
  }
  rel = rel.replace(/^\/+/, "") || "index.html";
  const parts = rel.split("/");

  if (
    parts.some((part) => part.startsWith(".")) ||
    parts.includes("node_modules") ||
    parts.includes("lib") ||
    parts.some((part) => part.endsWith(".test.js")) ||
    PRIVATE.has(parts[parts.length - 1])
  )
    return notFound(res);

  const file = path.resolve(ROOT, rel);
  const outside = path.relative(ROOT, file);
  if (outside.startsWith("..") || path.isAbsolute(outside)) return notFound(res);

  try {
    const body = await readFile(file);
    res.writeHead(200, {
      "content-type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream",
      "x-content-type-options": "nosniff",
    });
    res.end(body);
  } catch {
    notFound(res);
  }
}

const server = http.createServer(async (req, res) => {
  let pathname;
  try {
    pathname = new URL(req.url, "http://localhost").pathname;
  } catch {
    return notFound(res);
  }

  if (pathname.startsWith("/api/")) return api(req, res, pathname);
  if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, { success: false, message: "Method not allowed." }, { allow: "GET, HEAD" });
  await serveStatic(res, pathname);
});

// Node's test runner imports lib/*.js only, so this always starts outside tests.
server.listen(PORT, () => console.log(`EcoCrete on http://localhost:${PORT}`));
