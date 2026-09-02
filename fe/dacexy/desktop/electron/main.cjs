const { app, BrowserWindow, shell, ipcMain } = require("electron");
const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");
const net = require("net");
const crypto = require("crypto");

let gateway = null;
let gatewayState = { connected: false, error: "" };
let seq = 0;
let sessionKey = null;
let connectWait = null;
const pending = new Map();
const chatWaiters = new Map();

function readGatewayCredential() {
  const token = process.env.OPENCLAW_GATEWAY_TOKEN?.trim();
  if (token) return { token };
  const password = process.env.OPENCLAW_GATEWAY_PASSWORD?.trim();
  if (password) return { password };
  try {
    const file = path.join(os.homedir(), ".openclaw", "openclaw.json");
    const raw = fs.readFileSync(file, "utf8");
    const authBlock = raw.match(/"gateway"\s*:\s*\{[\s\S]{0,12000}?"auth"\s*:\s*\{([\s\S]{0,4000}?)\}/);
    const authRaw = authBlock?.[1] || raw;
    const tm = authRaw.match(/"token"\s*:\s*"([^"\r\n]+)"/);
    if (tm?.[1] && tm[1] !== "__OPENCLAW_REDACTED__") return { token: tm[1] };
    const pm = authRaw.match(/"password"\s*:\s*"([^"\r\n]+)"/);
    if (pm?.[1] && pm[1] !== "__OPENCLAW_REDACTED__") return { password: pm[1] };
  } catch (_) {}
  return null;
}

// OpenClaw 2026.x requires a real Ed25519 device identity for authenticated
// Gateway connect handshakes. Keep DACEXY's identity stable across launches.
function loadOrCreateDeviceIdentity() {
  const dir = path.join(app.getPath("userData"), "openclaw");
  const file = path.join(dir, "device-identity.json");
  try {
    const saved = JSON.parse(fs.readFileSync(file, "utf8"));
    if (saved?.deviceId && saved?.privateKeyPem && saved?.publicKeyPem) {
      const pub = crypto.createPublicKey(saved.publicKeyPem);
      const der = pub.export({ type: "spki", format: "der" });
      const raw = der.subarray(-32);
      const deviceId = crypto.createHash("sha256").update(raw).digest("hex");
      if (deviceId === saved.deviceId && raw.length === 32) {
        return { deviceId, privateKeyPem: saved.privateKeyPem, publicKeyPem: saved.publicKeyPem };
      }
    }
  } catch (_) {}

  fs.mkdirSync(dir, { recursive: true });
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" }).toString();
  const privateKeyPem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  const raw = publicKey.export({ type: "spki", format: "der" }).subarray(-32);
  if (raw.length !== 32) throw new Error("Unexpected Ed25519 public key length");
  const deviceId = crypto.createHash("sha256").update(raw).digest("hex");
  fs.writeFileSync(file, JSON.stringify({ version: 1, deviceId, publicKeyPem, privateKeyPem }, null, 2), { mode: 0o600 });
  return { deviceId, privateKeyPem, publicKeyPem };
}

function deviceAuthStorePath() {
  return path.join(app.getPath("userData"), "openclaw", "device-auth.json");
}

function loadDeviceAuthToken(deviceId) {
  try {
    const saved = JSON.parse(fs.readFileSync(deviceAuthStorePath(), "utf8"));
    if (saved?.deviceId === deviceId && typeof saved.token === "string" && saved.token.trim()) return saved;
  } catch (_) {}
  return null;
}

function storeDeviceAuthToken(deviceId, role, token, scopes) {
  const file = deviceAuthStorePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ version: 1, deviceId, role, token, scopes: Array.isArray(scopes) ? scopes : [] }, null, 2), { mode: 0o600 });
}

function clearDeviceAuthToken(deviceId) {
  try {
    const saved = JSON.parse(fs.readFileSync(deviceAuthStorePath(), "utf8"));
    if (!deviceId || saved?.deviceId === deviceId) fs.rmSync(deviceAuthStorePath(), { force: true });
  } catch (_) {}
}

function isGatewayUnavailableError(err) {
  return err && (err.code === "ECONNREFUSED" || /ECONNREFUSED|Gateway connection refused/i.test(String(err.message || err)));
}

function startOpenClawGateway() {
  return new Promise((resolve, reject) => {
    execFile("cmd.exe", ["/d", "/s", "/c", "openclaw gateway start"], { windowsHide: true, timeout: 30000 }, (error, stdout, stderr) => {
      if (error) return reject(new Error(String(stderr || stdout || error.message).trim() || "Unable to start OpenClaw Gateway"));
      resolve(String(stdout || "").trim());
    });
  });
}

function waitForGatewayPort(host = "127.0.0.1", port = 18789, timeoutMs = 30000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = net.connect({ host, port });
      let done = false;
      const finish = (ok, err) => {
        if (done) return;
        done = true;
        try { socket.destroy(); } catch (_) {}
        if (ok) return resolve(true);
        if (Date.now() - started >= timeoutMs) return reject(err || new Error("OpenClaw Gateway did not become reachable"));
        setTimeout(attempt, 500);
      };
      socket.once("connect", () => finish(true));
      socket.once("error", (e) => finish(false, e));
      socket.setTimeout(1500, () => finish(false, new Error("Gateway probe timeout")));
    };
    attempt();
  });
}

function publicKeyRawBase64UrlFromPem(publicKeyPem) {
  const pub = crypto.createPublicKey(publicKeyPem);
  const der = pub.export({ type: "spki", format: "der" });
  const raw = der.subarray(-32);
  if (raw.length !== 32) throw new Error("Invalid Ed25519 public key");
  return raw.toString("base64url");
}

function signDevicePayload(privateKeyPem, payload) {
  return crypto.sign(null, Buffer.from(payload, "utf8"), crypto.createPrivateKey(privateKeyPem)).toString("base64url");
}

function buildDeviceAuthPayloadV3({ deviceId, clientId, clientMode, role, scopes, signedAtMs, token, nonce, platform, deviceFamily }) {
  return [
    "v3", deviceId, clientId, clientMode, role, scopes.join(","), String(signedAtMs),
    token ?? "", nonce, String(platform ?? "").trim().toLowerCase(), String(deviceFamily ?? "").trim().toLowerCase(),
  ].join("|");
}

function setState(connected, error = "") {
  gatewayState = { connected, error };
  for (const win of BrowserWindow.getAllWindows()) win.webContents.send("dacexy:openclaw-status", gatewayState);
}

function rejectAll(err) {
  for (const [id, p] of pending) { clearTimeout(p.timer); p.reject(err); pending.delete(id); }
  for (const [id, w] of chatWaiters) { clearTimeout(w.timer); w.reject(err); chatWaiters.delete(id); }
}

function closeGateway(reason = "OpenClaw Gateway disconnected") {
  const g = gateway;
  gateway = null;
  sessionKey = null;
  connectWait = null;
  rejectAll(new Error(reason));
  setState(false, reason === "OpenClaw Gateway disconnected" ? "" : reason);
  try { g?.socket?.destroy(); } catch (_) {}
}

function wsFrame(text) {
  const payload = Buffer.from(text, "utf8");
  const mask = crypto.randomBytes(4);
  let header;
  if (payload.length < 126) header = Buffer.from([0x81, 0x80 | payload.length]);
  else if (payload.length < 65536) { header = Buffer.alloc(4); header[0] = 0x81; header[1] = 0xfe; header.writeUInt16BE(payload.length, 2); }
  else { header = Buffer.alloc(10); header[0] = 0x81; header[1] = 0xff; header.writeBigUInt64BE(BigInt(payload.length), 2); }
  const out = Buffer.alloc(header.length + 4 + payload.length);
  header.copy(out, 0); mask.copy(out, header.length);
  for (let i = 0; i < payload.length; i++) out[header.length + 4 + i] = payload[i] ^ mask[i % 4];
  return out;
}

function wsPong(payload) {
  // Client -> server WebSocket control frames MUST be masked (RFC 6455).
  // The old implementation sent an unmasked pong; OpenClaw correctly treated
  // that as a WebSocket protocol violation and closed the connection with 1002.
  const p = Buffer.from(payload || "");
  if (p.length >= 126) return Buffer.from([0x8a, 0x80]);
  const mask = crypto.randomBytes(4);
  const header = Buffer.from([0x8a, 0x80 | p.length]);
  const out = Buffer.alloc(header.length + 4 + p.length);
  header.copy(out, 0);
  mask.copy(out, header.length);
  for (let i = 0; i < p.length; i++) out[header.length + 4 + i] = p[i] ^ mask[i % 4];
  return out;
}

function handleFrame(buf, onText) {
  let offset = 0;
  while (offset + 2 <= buf.length) {
    const b1 = buf[offset], b2 = buf[offset + 1];
    const opcode = b1 & 0x0f, masked = !!(b2 & 0x80);
    let len = b2 & 0x7f, pos = offset + 2;
    if (len === 126) { if (pos + 2 > buf.length) return buf.slice(offset); len = buf.readUInt16BE(pos); pos += 2; }
    else if (len === 127) { if (pos + 8 > buf.length) return buf.slice(offset); const n = buf.readBigUInt64BE(pos); if (n > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("WebSocket frame too large"); len = Number(n); pos += 8; }
    let mask;
    if (masked) { if (pos + 4 > buf.length) return buf.slice(offset); mask = buf.slice(pos, pos + 4); pos += 4; }
    if (pos + len > buf.length) return buf.slice(offset);
    let payload = buf.slice(pos, pos + len);
    if (mask) { const u = Buffer.alloc(len); for (let i = 0; i < len; i++) u[i] = payload[i] ^ mask[i % 4]; payload = u; }
    offset = pos + len;
    if (opcode === 0x1) onText(payload.toString("utf8"));
    else if (opcode === 0x8) {
      const reason = payload.length >= 2 ? `Gateway closed (${payload.readUInt16BE(0)}): ${payload.slice(2).toString()}` : "Gateway closed";
      if (gateway) gateway.closeReason = reason;
      throw new Error(reason);
    }
    else if (opcode === 0x9 && gateway?.socket) gateway.socket.write(wsPong(payload));
  }
  return buf.slice(offset);
}

function rpc(method, params, timeout = 30000) {
  if (!gateway?.socket) return Promise.reject(new Error("OpenClaw Gateway is not connected"));
  const id = `dacexy-${++seq}`;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timed out waiting for ${method}`)); }, timeout);
    pending.set(id, { resolve, reject, timer });
    try { gateway.socket.write(wsFrame(JSON.stringify({ type: "req", id, method, params }))); }
    catch (e) { clearTimeout(timer); pending.delete(id); reject(e); }
  });
}

function extractText(v) {
  if (typeof v === "string") return v;
  if (!v) return "";
  if (Array.isArray(v)) return v.map(extractText).filter(Boolean).join("");
  if (typeof v === "object") {
    if (typeof v.text === "string") return v.text;
    if (typeof v.deltaText === "string") return v.deltaText;
    if (typeof v.content === "string") return v.content;
    if (Array.isArray(v.content)) return extractText(v.content);
    if (v.message) return extractText(v.message);
  }
  return "";
}

function connectOpenClaw(url = "ws://127.0.0.1:18789", recoveryAttempt = false, gatewayStartAttempt = false) {
  if (gateway?.socket && !gateway.closed) return Promise.resolve({ connected: true });
  closeGateway();
  const parsed = new URL(url);
  if (parsed.protocol !== "ws:") throw new Error("DACEXY currently requires a ws:// OpenClaw Gateway URL");
  const host = parsed.hostname || "127.0.0.1", port = Number(parsed.port || 80), pathName = parsed.pathname || "/";
  const identity = loadOrCreateDeviceIdentity();
  const storedAuth = loadDeviceAuthToken(identity.deviceId);

  return new Promise((resolve, reject) => {
    const socket = net.connect({ host, port });
    const state = { socket, buffer: Buffer.alloc(0), upgraded: false, closed: false };
    gateway = state;
    let settled = false;
    const timer = setTimeout(() => { if (!settled) { settled = true; try { socket.destroy(); } catch (_) {} reject(new Error("OpenClaw Gateway connection timeout")); } }, 15000);

    function fail(err) {
      if (!settled) { settled = true; clearTimeout(timer); reject(err); }
      setState(false, err.message);
    }

    socket.setNoDelay(true);
    socket.on("connect", () => {
      const key = crypto.randomBytes(16).toString("base64");
      const req = [
        `GET ${pathName} HTTP/1.1`, `Host: ${host}:${port}`, "Upgrade: websocket", "Connection: Upgrade",
        `Sec-WebSocket-Key: ${key}`, "Sec-WebSocket-Version: 13", "\r\n",
      ].join("\r\n");
      socket.write(req);
    });

    socket.on("data", (chunk) => {
      try {
        state.buffer = Buffer.concat([state.buffer, chunk]);
        if (!state.upgraded) {
          const marker = state.buffer.indexOf("\r\n\r\n");
          if (marker < 0) return;
          const header = state.buffer.slice(0, marker).toString("latin1");
          if (!/^HTTP\/1\.1 101 /i.test(header)) throw new Error(`OpenClaw WebSocket upgrade rejected: ${header.split("\r\n")[0]}`);
          state.upgraded = true; state.buffer = state.buffer.slice(marker + 4); return processFrames();
        }
        processFrames();
      } catch (e) { try { socket.destroy(); } catch (_) {} fail(e); }
    });

    function processFrames() {
      state.buffer = handleFrame(state.buffer, (raw) => {
        let msg; try { msg = JSON.parse(raw); } catch (_) { return; }
        if (msg.type === "event" && msg.event === "connect.challenge") {
          const sharedAuth = readGatewayCredential();
          const challengeTs = Number(msg.payload?.ts);
          const signedAtMs = Number.isSafeInteger(challengeTs) && challengeTs >= 0 ? challengeTs : Date.now();
          const nonce = String(msg.payload?.nonce || "");
          if (!nonce) throw new Error("OpenClaw connect challenge missing nonce");
          // DACEXY is a same-machine desktop control-plane client, not a
          // separate user/device UI. Use OpenClaw's reserved direct-loopback
          // backend identity. This avoids the CLI device-pairing path.
          const client = { id: "gateway-client", version: "1.0.2", platform: "win32", deviceFamily: "desktop", mode: "backend" };
          const role = "operator";
          const scopes = ["operator.read", "operator.write"];
          // The direct local backend path authenticates with the shared Gateway
          // token/password. It deliberately does not use a DACEXY device token.
          const auth = sharedAuth || {};
          if (!Object.keys(auth).length) throw new Error("OpenClaw Gateway credentials not found");
          const params = {
            minProtocol: 4, maxProtocol: 4,
            client, role, scopes, caps: ["tool-events"], commands: [], permissions: {},
            locale: "en-IN", userAgent: "DACEXY-AI/1.0.2", auth,
          };
          const id = `connect-${++seq}`;
          connectWait = { id, resolve, reject, timer, recoveryAttempt, storedAuth: null, identity: null };
          socket.write(wsFrame(JSON.stringify({ type: "req", id, method: "connect", params })));
          return;
        }
        if (msg.type === "res") {
          const id = String(msg.id);
          if (connectWait?.id === id) {
            const cw = connectWait; connectWait = null;
            if (msg.ok === false || msg.error) {
              const code = String(msg.error?.details?.code || msg.error?.code || "");
              const canRecover = cw.storedAuth?.token && !cw.recoveryAttempt && /AUTH_DEVICE_TOKEN_MISMATCH|AUTH_TOKEN_MISMATCH/i.test(code);
              if (canRecover) {
                clearDeviceAuthToken(cw.identity.deviceId);
                try { socket.destroy(); } catch (_) {}
                setTimeout(() => connectOpenClaw(url, true, gatewayStartAttempt).then(resolve, reject), 50);
                return;
              }
              const message = msg.error?.message || msg.error?.code || "OpenClaw connection rejected";
              fail(new Error(message)); return;
            }
            settled = true; clearTimeout(cw.timer);
            const hello = msg.payload || {};
            const issued = hello.auth?.deviceToken;
            if (issued && cw.identity?.deviceId) storeDeviceAuthToken(cw.identity.deviceId, hello.auth?.role || "operator", issued, hello.auth?.scopes || []);
            setState(true); resolve({ connected: true }); return;
          }
          const p = pending.get(id);
          if (p) { pending.delete(id); clearTimeout(p.timer); if (msg.ok === false || msg.error) p.reject(new Error(msg.error?.message || msg.error?.code || "OpenClaw request failed")); else p.resolve(msg.payload); }
          return;
        }
        if (msg.type === "event" && msg.event === "chat") {
          const p = msg.payload || {}, runId = p.runId, stateName = p.state;
          for (const [id, waiter] of chatWaiters) {
            if (waiter.runId && runId && waiter.runId !== runId) continue;
            if (stateName === "final") { clearTimeout(waiter.timer); chatWaiters.delete(id); waiter.resolve(extractText(p.message) || waiter.text); }
            else if (stateName === "error") { clearTimeout(waiter.timer); chatWaiters.delete(id); waiter.reject(new Error(extractText(p.error) || "OpenClaw agent run failed")); }
            else if (stateName === "aborted") { clearTimeout(waiter.timer); chatWaiters.delete(id); waiter.resolve(waiter.text); }
            else if (typeof p.deltaText === "string") waiter.text += p.deltaText;
          }
        }
      });
    }

    socket.on("error", (err) => {
      if (isGatewayUnavailableError(err) && !gatewayStartAttempt) {
        try { socket.destroy(); } catch (_) {}
        setState(false, "OpenClaw Gateway is not running; starting the existing Gateway service…");
        startOpenClawGateway()
          .then(() => waitForGatewayPort(host, port, 30000))
          .then(() => connectOpenClaw(url, recoveryAttempt, true).then(resolve, reject))
          .catch((e) => fail(new Error(`OpenClaw Gateway unavailable at ${host}:${port}: ${e.message}`)));
        return;
      }
      fail(err);
    });
    socket.on("close", () => {
      state.closed = true; if (gateway === state) gateway = null; sessionKey = null;
      // If the Gateway closes before returning a structured `connect` response,
      // retain the real close reason when one was supplied by the server.
      const err = new Error(state.closeReason || "OpenClaw Gateway socket closed");
      rejectAll(err); setState(false, err.message);
      if (!settled) fail(err);
    });
  });
}

async function ensureSession() {
  await connectOpenClaw();
  // Use the durable default main-agent session. Creating a fresh session for
  // every DACEXY request races the Gateway session lifecycle and is not needed
  // for a local desktop operator.
  return sessionKey || "agent:main:main";
}

async function sendOpenClaw(text) {
  const key = await ensureSession();
  const idempotencyKey = `dacexy-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // Current OpenClaw integrations use the agent RPC for real agent turns and
  // agent.wait for the terminal result. chat.send is a UI/chat transport and
  // is intentionally not used for DACEXY's execution path.
  const ack = await rpc("agent", {
    message: text,
    sessionKey: key,
    idempotencyKey,
    deliver: false,
    timeout: 600,
    lane: "main",
  }, 30000);

  const runId = ack?.runId || ack?.run?.runId || idempotencyKey;
  let wait = await rpc("agent.wait", { runId, timeoutMs: 10 * 60 * 1000 }, 10 * 60 * 1000 + 5000);
  if (wait?.status === "timeout") {
    // Waiting is non-destructive. Keep the run alive and give it one bounded
    // retry after a long-running tool action.
    wait = await rpc("agent.wait", { runId, timeoutMs: 10 * 60 * 1000 }, 10 * 60 * 1000 + 5000);
  }
  if (wait?.status === "error") throw new Error(wait.error || "OpenClaw agent run failed");
  if (wait?.status === "timeout") throw new Error("OpenClaw agent run is still running; Gateway connection timed out while waiting");

  return extractText(wait?.result) || extractText(wait?.payload) || extractText(wait?.message) || "OpenClaw task completed.";
}

function runPowerShell(command) {
  return new Promise((resolve, reject) => {
    if (process.env.DACEXY_DEV_AGENT !== '1') return reject(new Error('Developer shell is disabled'));
    execFile('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command], { windowsHide: true, timeout: 120000, maxBuffer: 8 * 1024 * 1024 }, (error, stdout, stderr) => resolve({ ok: !error, code: error?.code ?? 0, stdout, stderr }));
  });
}

ipcMain.handle("dacexy:openclaw-connect", (_e, url) => connectOpenClaw(String(url || "ws://127.0.0.1:18789")));
ipcMain.handle("dacexy:openclaw-disconnect", () => { closeGateway(); return { connected: false }; });
ipcMain.handle("dacexy:openclaw-status", () => gatewayState);
ipcMain.handle("dacexy:openclaw-send", (_e, text) => sendOpenClaw(String(text || "")));
ipcMain.handle("dacexy:dev-powershell", (_e, command) => runPowerShell(String(command || "")));

function createWindow() {
  const win = new BrowserWindow({ width: 1280, height: 820, minWidth: 940, minHeight: 620, backgroundColor: "#fbfbfd", title: "DACEXY AI", autoHideMenuBar: true, webPreferences: { contextIsolation: true, nodeIntegration: false, preload: path.join(__dirname, "preload.cjs") } });
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: "deny" }; });
  win.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    if (level >= 2) console.error(`[DACEXY renderer] ${message} (${sourceId}:${line})`);
  });
  win.webContents.on("did-fail-load", (_event, code, description, validatedURL, isMainFrame) => {
    if (!isMainFrame) return;
    console.error(`[DACEXY renderer load failed] ${code} ${description} ${validatedURL}`);
    const html = `<!doctype html><html><body style="font-family:system-ui;padding:32px;background:#fbfbfd;color:#172033"><h1>DACEXY AI could not load</h1><p>Renderer load failed.</p><pre>${String(code)} ${String(description)}\n${String(validatedURL)}</pre><p>Close this window and run START-DACEXY-FIXED.ps1 again. The launcher will rebuild the renderer.</p></body></html>`;
    win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  });
  win.loadFile(path.join(__dirname, "..", "dist", "index.html")).catch((err) => {
    console.error("DACEXY loadFile failed", err);
  });
}
app.whenReady().then(() => { createWindow(); app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); }); });
app.on("window-all-closed", () => { closeGateway(); if (process.platform !== "darwin") app.quit(); });
