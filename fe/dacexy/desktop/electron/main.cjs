const { app, BrowserWindow, shell, ipcMain } = require("electron");
const { execFile, spawn } = require("child_process");
const http = require("http");
const path = require("path");
const fs = require("fs");
const os = require("os");
const net = require("net");
const crypto = require("crypto");

let gateway = null;
const AUTOMATION_WEBHOOK_PORT = 18791;
let automationServer = null;
const automationResultsFile = path.join(app.getPath("userData"), "state", "automation-results.json");
const automationMapFile = path.join(app.getPath("userData"), "state", "automation-conversations.json");
const automationDeliveredFile = path.join(app.getPath("userData"), "state", "automation-delivered.json");
let automationPollTimer = null;
let automationPollBusy = false;
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

function loadAutomationResults() { return readJsonFile(automationResultsFile, []); }
function saveAutomationResult(result) { const rows = loadAutomationResults(); rows.push({ ...result, receivedAt: new Date().toISOString() }); while (rows.length > 200) rows.shift(); writeJsonFile(automationResultsFile, rows); }
function loadAutomationMap() { return readJsonFile(automationMapFile, {}); }
function saveAutomationMap(map) { writeJsonFile(automationMapFile, map); }
function loadAutomationDelivered() { return readJsonFile(automationDeliveredFile, {}); }
function saveAutomationDelivered(map) { writeJsonFile(automationDeliveredFile, map); }
function runRowsFromJson(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.runs)) return value.runs;
  if (Array.isArray(value?.history)) return value.history;
  if (Array.isArray(value?.items)) return value.items;
  return [];
}
function automationRunText(run) {
  return extractText(run?.summary) || extractText(run?.output) || extractText(run?.result) || extractText(run?.payload) || extractText(run?.message) || extractText(run?.error) || "";
}
async function pollAutomationResults() {
  if (automationPollBusy) return;
  automationPollBusy = true;
  try {
    const map = loadAutomationMap();
    const delivered = loadAutomationDelivered();
    for (const [jobId, meta] of Object.entries(map)) {
      if (!meta?.conversationId) continue;
      try {
        const out = await runOpenClawCli(["automations", "runs", "--id", jobId, "--limit", "20", "--json"], 30000);
        const rows = runRowsFromJson(JSON.parse(out));
        for (const run of rows) {
          const runId = String(run?.runId || run?.id || run?.run?.runId || "");
          const completion = String(run?.completionStatus || run?.status || "").toLowerCase();
          const terminal = ["succeeded", "failed", "error", "skipped", "unknown", "ok"].includes(completion);
          if (!runId || !terminal || delivered[runId]) continue;
          const result = {
            jobId, runId, conversationId: meta.conversationId,
            name: meta.name || "OpenClaw automation",
            status: completion,
            text: automationRunText(run) || `OpenClaw automation finished with status: ${completion}`,
          };
          delivered[runId] = true;
          saveAutomationResult(result);
          for (const win of BrowserWindow.getAllWindows()) win.webContents.send("dacexy:automation-result", result);
        }
      } catch (_) {
        // Gateway may be restarting. Durable OpenClaw history will be checked again.
      }
    }
    saveAutomationDelivered(delivered);
  } finally {
    automationPollBusy = false;
  }
}
function startAutomationPoller() {
  if (automationPollTimer) return;
  pollAutomationResults().catch(() => {});
  automationPollTimer = setInterval(() => pollAutomationResults().catch(() => {}), 10000);
}
function stopAutomationPoller() { if (automationPollTimer) clearInterval(automationPollTimer); automationPollTimer = null; }
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

function connectOpenClaw(url = "ws://127.0.0.1:18789") {
  const parsed = new URL(url);
  if (parsed.protocol !== "ws:") throw new Error("DACEXY requires the local OpenClaw Gateway ws:// endpoint");
  const host = parsed.hostname || "127.0.0.1";
  const port = Number(parsed.port || 18789);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) throw new Error("Invalid OpenClaw Gateway port");
  if (gatewayState.connected) return Promise.resolve({ connected: true });
  return waitForGatewayPort(host, port, 5000)
    .then(() => {
      gateway = { socket: null, closed: false, reachable: true };
      sessionKey = "agent:main:main";
      setState(true, "");
      return { connected: true };
    })
    .catch((err) => {
      setState(false, `OpenClaw Gateway unavailable at ${host}:${port}: ${err.message}`);
      throw err;
    });
}

function quoteCmdArg(arg) {
  const s = String(arg ?? "");
  if (!/[\s"&|<>^()]/.test(s)) return s;
  return '"' + s.replace(/(\\*)"/g, '$1$1\\"').replace(/(\\+)$/g, '$1$1') + '"';
}

function findOpenClawEntry() {
  const candidates = [
    process.env.OPENCLAW_CLI,
    path.join(process.env.APPDATA || "", "npm", "node_modules", "openclaw", "openclaw.mjs"),
    path.join(os.homedir(), "AppData", "Roaming", "npm", "node_modules", "openclaw", "openclaw.mjs"),
  ].filter(Boolean);
  return candidates.find((p) => fs.existsSync(p)) || null;
}

function findSystemNode() {
  const candidates = [
    process.env.DACEXY_NODE,
    process.env.NODE_EXE,
    path.join(process.env.ProgramFiles || "C:\\Program Files", "nodejs", "node.exe"),
    path.join(process.env.ProgramW6432 || "", "nodejs", "node.exe"),
    path.join(process.env.LOCALAPPDATA || "", "Programs", "nodejs", "node.exe"),
  ].filter(Boolean);
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch (_) {}
  }
  return null;
}

function runOpenClawCli(args, timeout = 30000, onLine = null) {
  return new Promise((resolve, reject) => {
    const entry = findOpenClawEntry();
    if (!entry) return reject(new Error("OpenClaw CLI entrypoint not found. Expected the DACEXY-managed OpenClaw installation."));
    const nodeExe = findSystemNode();
    if (!nodeExe) return reject(new Error("Compatible system Node.js executable not found. Expected C:\\Program Files\\nodejs\\node.exe."));

    const child = spawn(nodeExe, [entry, ...args.map((v) => String(v))], {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });
    let stdout = "";
    let stderr = "";
    let remainder = "";
    const timer = setTimeout(() => {
      try { child.kill(); } catch (_) {}
      reject(new Error(`OpenClaw task timed out after ${Math.ceil(timeout / 60000)} minutes.`));
    }, timeout);

    const consume = (chunk) => {
      remainder += String(chunk);
      const lines = remainder.split(/\r?\n/);
      remainder = lines.pop() || "";
      for (const line of lines) {
        if (onLine) { try { onLine(line); } catch (_) {} }
      }
    };
    child.stdout.on("data", (chunk) => { stdout += String(chunk); if (stdout.length > 16 * 1024 * 1024) stdout = stdout.slice(-16 * 1024 * 1024); consume(chunk); });
    child.stderr.on("data", (chunk) => { stderr += String(chunk); if (stderr.length > 16 * 1024 * 1024) stderr = stderr.slice(-16 * 1024 * 1024); consume(chunk); });
    child.on("error", (error) => { clearTimeout(timer); reject(error); });
    child.on("close", (code) => {
      clearTimeout(timer);
      const out = stdout.trim();
      const err = stderr.trim();
      if (code !== 0) return reject(new Error(err || out || `OpenClaw CLI failed: ${args.join(" ")}`));
      resolve(out);
    });
  });
}

let activeAgentRun = Promise.resolve();

async function sendOpenClaw(text) {
  const prompt = String(text || "").trim();
  if (!prompt) throw new Error("OpenClaw task is empty");
  await connectOpenClaw();

  const run = activeAgentRun.then(async () => {
    const startedAt = Date.now();
    emitInstallerProgress({ type: "task", state: "running", elapsedSeconds: 0, message: "Starting OpenClaw task" });
    const result = await runOpenClawCli(
      ["agent", "--agent", "main", "--message", prompt, "--thinking", "off", "--timeout", "300"],
      5 * 60 * 1000 + 30000,
      (line) => {
        const textLine = String(line || "").trim();
        if (!textLine) return;
        const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
        let message = "OpenClaw is working";
        if (/tool|exec|browser|search|read|write|click|plan|progress/i.test(textLine)) message = textLine.slice(0, 180);
        emitInstallerProgress({ type: "task", state: "running", elapsedSeconds, message });
      },
    );
    if (!result.trim()) throw new Error("OpenClaw returned no terminal result; DACEXY will not report a false success.");
    emitInstallerProgress({ type: "task", state: "completed", elapsedSeconds: Math.floor((Date.now() - startedAt) / 1000), message: "Task completed" });
    return result;
  });
  activeAgentRun = run.catch(() => {});
  return run;
}


function runPowerShell(command) {
  return new Promise((resolve, reject) => {
    if (process.env.DACEXY_DEV_AGENT !== '1') return reject(new Error('Developer shell is disabled'));
    execFile('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command], { windowsHide: true, timeout: 120000, maxBuffer: 8 * 1024 * 1024 }, (error, stdout, stderr) => resolve({ ok: !error, code: error?.code ?? 0, stdout, stderr }));
  });
}

const dacexyStateDir = path.join(app.getPath("userData"), "state");
const permissionsFile = path.join(dacexyStateDir, "permissions.json");
function readJsonFile(file, fallback) { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch (_) { return fallback; } }
function writeJsonFile(file, value) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(value, null, 2), { mode: 0o600 }); }
function getPermissions() { const v = readJsonFile(permissionsFile, { grants: {} }); return v && v.grants ? v : { grants: {} }; }
function grantPermission(scope) { const v = getPermissions(); v.grants[String(scope)] = { grantedAt: new Date().toISOString() }; writeJsonFile(permissionsFile, v); return v; }
function revokePermission(scope) { const v = getPermissions(); delete v.grants[String(scope)]; writeJsonFile(permissionsFile, v); return v; }
async function listAutomations() { const out = await runOpenClawCli(["automations", "list", "--all", "--json"]); try { return JSON.parse(out); } catch (_) { throw new Error(`Invalid automation JSON: ${out.slice(0, 500)}`); } }
async function createAutomation({ cron, at, prompt, name, timezone, agent = "main", conversationId = "" }) {
  if ((!cron && !at) || !prompt || !name) throw new Error("Automation requires a schedule, task, and name.");
  const schedule = at ? "--at" : "--cron";
  const args = ["automations", "create", schedule, at || cron, "--message", prompt, "--name", name, "--agent", agent, "--session", "isolated"];
  if (timezone && !at) args.push("--tz", timezone);
  args.push("--json");
  const out = await runOpenClawCli(args);
  let created;
  try { created = JSON.parse(out); } catch (_) { throw new Error(`Invalid automation JSON: ${out.slice(0, 500)}`); }
  const jobId = String(created?.id || created?.jobId || created?.job?.id || "");
  if (!jobId) throw new Error("OpenClaw created the automation but returned no job id; DACEXY cannot track its result safely.");
  const map = loadAutomationMap();
  map[jobId] = { conversationId: String(conversationId || ""), name, createdAt: Date.now() };
  saveAutomationMap(map);
  return created;
}

ipcMain.handle("dacexy:openclaw-connect", (_e, url) => connectOpenClaw(String(url || "ws://127.0.0.1:18789")));
ipcMain.handle("dacexy:openclaw-disconnect", () => { closeGateway(); return { connected: false }; });
ipcMain.handle("dacexy:openclaw-status", () => gatewayState);
ipcMain.handle("dacexy:openclaw-credentials", () => {
  const c = readGatewayCredential();
  return c?.token ? { mode: "token", token: c.token } : c?.password ? { mode: "password", password: c.password } : { mode: "none" };
});
ipcMain.handle("dacexy:openclaw-send", (_e, text) => sendOpenClaw(String(text || "")));
ipcMain.handle("dacexy:permissions-get", () => getPermissions());
ipcMain.handle("dacexy:permissions-grant", (_e, scope) => grantPermission(String(scope || "")));
ipcMain.handle("dacexy:permissions-revoke", (_e, scope) => revokePermission(String(scope || "")));
ipcMain.handle("dacexy:automations-list", () => listAutomations());
ipcMain.handle("dacexy:automations-create", (_e, spec) => createAutomation(spec || {}));
ipcMain.handle("dacexy:automations-delete", (_e, id) => runOpenClawCli(["automations", "delete", String(id || ""), "--json"]));
ipcMain.handle("dacexy:automations-run", (_e, id) => runOpenClawCli(["automations", "run", String(id || ""), "--wait", "--wait-timeout", "10m", "--json"], 10 * 60 * 1000 + 30000));
ipcMain.handle("dacexy:automations-enable", (_e, id) => runOpenClawCli(["automations", "enable", String(id || ""), "--json"]));
ipcMain.handle("dacexy:automations-disable", (_e, id) => runOpenClawCli(["automations", "disable", String(id || ""), "--json"]));

ipcMain.handle("dacexy:agent-status", () => ({ installed: agentInstalled(), installer: !!installerRoot(), gateway: gatewayState }));
ipcMain.handle("dacexy:agent-install", () => installAgentRuntime());

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
ipcMain.handle("dacexy:automations-results", () => loadAutomationResults());

app.whenReady().then(() => {
  createWindow();
  startAutomationPoller();
  // Self-heal the local execution runtime automatically. This is intentionally
  // best-effort: the UI must still open if Gateway is temporarily starting.
  connectOpenClaw("ws://127.0.0.1:18789").catch((err) => {
    console.error("[DACEXY] initial OpenClaw connection failed:", err.message);
  });
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { stopAutomationPoller(); closeGateway(); if (process.platform !== "darwin") app.quit(); });
