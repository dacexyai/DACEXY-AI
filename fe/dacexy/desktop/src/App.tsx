import { useEffect, useMemo, useRef, useState } from "react";
import markUrl from "./assets/dacexy-mark.png";
import {
  IconArrowUp,
  IconBell,
  IconBolt,
  IconBranch,
  IconBroom,
  IconChart,
  IconChat,
  IconCheck,
  IconChevron,
  IconClock,
  IconCode,
  IconDownload,
  IconFolder,
  IconGear,
  IconGrid,
  IconHelp,
  IconInfo,
  IconMail,
  IconMic,
  IconPlug,
  IconPlus,
  IconSearch,
  IconShield,
  IconSidebar,
  IconSpark,
} from "./components/icons";
import {
  AGENT_MODELS,
  APP_VERSION,
  DEFAULT_SETTINGS,
  createConversation,
  createMessage,
  connectAgent,
  getStatus,
  sendMessage,
  type AgentSettings,
  type Conversation,
} from "./services/agent";
import { initials, restore, signIn, signOut, type Account } from "./services/auth";
import { getUsageStats } from "./services/usage";

type View = "chat" | "settings" | "about";

const runtime = (window as unknown as { dacexy?: Record<string, string> }).dacexy;

const QUICK = [
  { icon: IconFolder, label: "Organise and\nsummarise files" },
  { icon: IconMail, label: "Draft a reply\nto an email" },
  { icon: IconChart, label: "Research and\nbuild a report" },
  { icon: IconBroom, label: "Automate a\ndesktop routine" },
] as const;

const AGENT_FEATURES = [
  {
    icon: IconBolt,
    title: "Desktop automation",
    body: "Opens apps, moves files and completes multi-step routines while you watch the activity trail.",
  },
  {
    icon: IconCode,
    title: "Tooling & plugins",
    body: "Browser, terminal, files, mail and data tools exposed to the agent through one permission layer.",
  },
  {
    icon: IconShield,
    title: "Local-first security",
    body: "Runs on your machine. Every destructive action asks for approval before it executes.",
  },
  {
    icon: IconClock,
    title: "Scheduled runs",
    body: "Give the agent recurring work and it reports results back into your workspace threads.",
  },
] as const;

const INSTALL_STEPS = [
  "Downloading DACEXY Agent runtime",
  "Verifying package signature",
  "Installing agent service",
  "Registering desktop permissions",
  "Finishing up",
] as const;

function clock(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function displayMessageContent(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return String(value);
  if (Array.isArray(value)) return value.map(displayMessageContent).filter(Boolean).join("\n");
  if (typeof value === "object") {
    const v = value as Record<string, unknown>;
    for (const key of ["text", "content", "message", "summary", "output", "result", "error"]) {
      if (v[key] != null) {
        const rendered = displayMessageContent(v[key]);
        if (rendered) return rendered;
      }
    }
    try { return JSON.stringify(value, null, 2); } catch { return String(value); }
  }
  return String(value);
}

function Mark({ size = 30, halo = false }: { size?: number; halo?: boolean }) {
  return (
    <span className="mark" style={{ width: size, height: size }}>
      {halo && <span className="halo" aria-hidden="true" />}
      <img src={markUrl} alt="DACEXY" />
    </span>
  );
}

function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="aurora" />
      <div className="aurora two" />
      <div className="grid-backdrop" />
    </div>
  );
}

function Login({ onDone }: { onDone: (a: Account) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      onDone(await signIn(email, password));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-head">
          <Mark size={54} halo />
          <h1>
            Sign in to <span className="text-cinematic">DACEXY AI</span>
          </h1>
          <p>Your autonomous AI employee, on the desktop.</p>
        </div>

        <label className="field">
          Work email
          <input
            type="email"
            autoFocus
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="field">
          Password
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button className="btn-primary flow-gradient sheen" disabled={busy} type="submit">
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="auth-foot">
          Local workspace session · identity provider connects with the agent backend
        </p>
      </form>
    </div>
  );
}

/* ---------------- Agent hub / installer ---------------- */

function AgentHub({
  connected,
  onConnected,
}: {
  connected: boolean;
  onConnected: (v: boolean) => void;
}) {
  const [installing, setInstalling] = useState(false);
  const [step, setStep] = useState(0);
  const [installed, setInstalled] = useState(connected);
  const [endpoint, setEndpoint] = useState("");

  useEffect(() => {
    if (!installing) return;
    if (step >= INSTALL_STEPS.length) {
      setInstalling(false);
      setInstalled(true);
      return;
    }
    const t = setTimeout(() => setStep((s) => s + 1), 750);
    return () => clearTimeout(t);
  }, [installing, step]);

  const progress = Math.round((step / INSTALL_STEPS.length) * 100);

  return (
    <div className="hub">
      <section className="hub-hero live-border">
        <div className="hub-hero-copy">
          <span className="tagline">
            <IconSpark /> DACEXY Agent
          </span>
          <h2>
            Install the <span className="text-cinematic">DACEXY Agent</span> on this machine
          </h2>
          <p>
            The agent runtime is what gives DACEXY hands: file access, app control, browsing and
            scheduled automation — all local, all permissioned.
          </p>
          <div className="hub-actions">
            <button
              className="btn-primary flow-gradient sheen"
              disabled={installing || installed}
              onClick={() => {
                setStep(0);
                setInstalling(true);
              }}
            >
              <IconDownload />
              {installed ? "Agent installed" : installing ? "Installing…" : "Download agent"}
            </button>
            <button
              className="btn-outline"
              disabled={!installed}
              onClick={async () => {
                try {
                  if (connected) { onConnected(false); return; }
                  await connectAgent(DEFAULT_SETTINGS);
                  onConnected(true);
                } catch { onConnected(false); }
              }}
            >
              <IconPlug />
              {connected ? "Disconnect" : "Connect"}
            </button>
          </div>
          <p className="hint">
            Runtime version {APP_VERSION} · Windows x64 · connects to the locally installed DACEXY
            the local AI agent runtime (direct connection).
          </p>
        </div>
        <div className="hub-hero-art" aria-hidden="true">
          <Mark size={130} halo />
        </div>
      </section>

      {(installing || installed) && (
        <section className="card installer">
          <h2>Installer</h2>
          <div className="progress">
            <span style={{ width: `${installed ? 100 : progress}%` }} className="flow-gradient" />
          </div>
          <ul className="steps">
            {INSTALL_STEPS.map((label, i) => {
              const done = installed || i < step;
              return (
                <li key={label} className={done ? "done" : i === step ? "active" : ""}>
                  <span className="step-dot">{done ? <IconCheck /> : i + 1}</span>
                  {label}
                </li>
              );
            })}
          </ul>
          <div className={`conn-row ${connected ? "on" : ""}`}>
            <span className={`dot ${connected ? "on" : ""}`} />
            {connected
              ? "Agent connected · desktop control available"
              : installed
                ? "Agent installed · not connected"
                : "Installing agent runtime"}
          </div>
        </section>
      )}

      <div className="feature-grid">
        {AGENT_FEATURES.map(({ icon: Icon, title, body }) => (
          <article key={title} className="feature">
            <span className="feature-icon">
              <Icon />
            </span>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>

      <section className="card">
        <h2>Connection</h2>
        <label>
          Agent endpoint
          <input
            type="text"
            placeholder="http://127.0.0.1:8721"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
          />
        </label>
        <p className="hint">
          DACEXY connects directly to the local AI agent runtime. No compatibility bridge is used.
        </p>
      </section>
    </div>
  );
}

type ChatMode = "advisor" | "task" | "automation";
type ApprovalRequest = { scope: string; label: string; input: string; mode: ChatMode; rememberable: boolean };
type AutomationSpec = { cron?: string; at?: string; prompt: string; name: string; timezone?: string; agent?: string; conversationId?: string };

const chatApi = (window as any).dacexy;

function classifyPermission(text: string): { scope: string; label: string; rememberable: boolean } | null {
  const t = text.toLowerCase();
  if (/\b(send|reply|forward)\b/.test(t)) return { scope: "sensitive:send", label: "send or reply to an external message", rememberable: true };
  if (/\b(post|publish|instagram|facebook|linkedin|x\/twitter|tweet|social media)\b/.test(t)) return { scope: "sensitive:publish", label: "publish content to a social account", rememberable: true };
  if (/\b(gmail|email|inbox|mailbox)\b/.test(t) && /\b(open|check|read|summari[sz]e|find|scan|review|draft|compose)\b/.test(t)) return { scope: "private:gmail-read", label: "access private Gmail content", rememberable: true };
  if (/\b(whatsapp|telegram|slack|discord)\b/.test(t) && /\b(read|check|open|scan|review)\b/.test(t)) return { scope: "private:messaging-read", label: "read private messages", rememberable: true };
  if (/\b(delete|erase|remove|wipe|empty|format)\b/.test(t)) return { scope: "destructive:delete", label: "delete or permanently remove data", rememberable: false };
  if (/\b(pay|purchase|buy|transfer money|bank|payment|checkout)\b/.test(t)) return { scope: "financial:payment", label: "perform a financial action", rememberable: false };
  return null;
}

function parseAutomationRequest(text: string): AutomationSpec | null {
  const t = text.replace(/\s+/g, " ").trim();
  const lower = t.toLowerCase();
  let cron = "";
  let at = "";
  let name = "DACEXY Automation";
  const to24 = (hRaw: string, minRaw?: string, apRaw?: string) => {
    let h = Number(hRaw); const min = Number(minRaw || 0); const ap = (apRaw || "").toLowerCase();
    if (ap === "pm" && h < 12) h += 12; if (ap === "am" && h === 12) h = 0;
    return { h, min };
  };
  const localIso = (d: Date) => d.toISOString();

  // Explicit cron expression: `cron 0 9 * * 1-5 | task` or `cron "0 9 * * 1-5" task`.
  const cronMatch = lower.match(/^cron\s+["']?((?:[0-9*/?,\-]+\s+){4}[0-9*/?,\-]+)["']?\s*(?:\||:)\s*(.+)$/i);
  if (cronMatch) {
    cron = cronMatch[1].trim();
    name = "Scheduled Automation";
  }

  // One-shot relative schedules supported by the OpenClaw scheduler.
  if (!cron) {
    const rel = lower.match(/\bin\s+(\d+)\s+(minute|minutes|hour|hours|day|days)\b/i);
    if (rel) {
      const n = Number(rel[1]);
      const ms = /hour/i.test(rel[2]) ? n * 60 * 60 * 1000 : /day/i.test(rel[2]) ? n * 24 * 60 * 60 * 1000 : n * 60 * 1000;
      at = new Date(Date.now() + ms).toISOString();
    }
  }

  if (!cron && !at) {
    const m = lower.match(/(?:today\s+)?at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(today|tomorrow)?/i);
    if (m && /\b(today|tomorrow)\b/i.test(t)) {
      const { h, min } = to24(m[1], m[2], m[3]);
      const d = new Date();
      if (/tomorrow/i.test(m[4] || "")) d.setDate(d.getDate() + 1);
      d.setHours(h, min, 0, 0);
      if (d.getTime() > Date.now()) at = localIso(d);
    }
  }
  if (!at && !cron) {
    let m = lower.match(/every\s+(\d+)\s+(minute|minutes|hour|hours)\b/i);
    if (m) { const n=Number(m[1]); cron=/hour/i.test(m[2]) ? `0 */${n} * * *` : `*/${n} * * * *`; }
  }
  if (!at && !cron) {
    const m = lower.match(/every day(?: at)?\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (m) { const {h,min}=to24(m[1],m[2],m[3]); cron=`${min} ${h} * * *`; }
  }
  if (!at && !cron) {
    const m = lower.match(/every weekday(?:s)?(?: at)?\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (m) { const {h,min}=to24(m[1],m[2],m[3]); cron=`${min} ${h} * * 1-5`; }
  }
  if (!at && !cron) {
    const m = lower.match(/every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?: at)?\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (m) { const days:any={sunday:0,monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6}; const {h,min}=to24(m[2],m[3],m[4]); cron=`${min} ${h} * * ${days[m[1].toLowerCase()]}`; }
  }
  if (!at && !cron) return null;
  if (/gmail|email|inbox/i.test(t)) name = "Gmail Briefing";
  else if (/marketing|instagram|linkedin|social/i.test(t)) name = "Marketing Automation";
  else if (/competitor|research/i.test(t)) name = "Business Research";
  else if (/report/i.test(t)) name = "Scheduled Report";
  const task = cronMatch ? cronMatch[2].trim() : t;
  const prompt = `${task}\n\nDACEXY automation policy: execute this task through the OpenClaw automation scheduler and its available agent tools, skills, browser, files, shell, plugins, subagents, APIs, and task flows as appropriate. Do not turn this into a plan or acknowledgement. Preserve the user's requested outcome exactly. Prefer the fastest reliable execution path, batch or parallelize safe independent work, reuse existing sessions where appropriate, avoid redundant research and narration, and verify critical side effects before reporting success. Use the signed-in browser profile for private sites only when access is available and permitted; use isolated/public sessions for public work. Never expose credentials. If a required capability or private session is unavailable, report that clearly. Do not claim success unless the requested action actually completed.`;
  return { ...(at ? { at } : { cron }), prompt, name, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata", agent: "main" };
}
function formatAutomation(a: any): string {
  const name = a?.displayName || a?.name || "Automation";
  const schedule = a?.schedule?.expr || a?.schedule?.cron || a?.cron || "scheduled";
  const status = a?.status || (a?.enabled === false ? "disabled" : "active");
  return `🔄 ${name}\nSchedule: ${schedule}\nStatus: ${status}`;
}

/* ---------------- App ---------------- */

export default function App() {
  const [account, setAccount] = useState<Account | null>(() => restore());
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("dacexy-conversations-v1") || "null");
      if (Array.isArray(saved) && saved.length) return saved;
    } catch {}
    return [createConversation("Welcome to DACEXY")];
  });
  const [activeId, setActiveId] = useState<string>("");
  const [view, setView] = useState<View>("chat");
  const [usageStats, setUsageStats] = useState<any>(null);

  useEffect(() => {
    if (!account || view !== "settings") return;
    getUsageStats().then(setUsageStats).catch(() => setUsageStats(null));
  }, [account, view]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState(false);
  const [rail, setRail] = useState(false);
  const [query, setQuery] = useState("");
  const [agentConnected, setAgentConnected] = useState(false);
  const [mode, setMode] = useState<ChatMode>("task");
  const [approval, setApproval] = useState<ApprovalRequest | null>(null);
  const [permissions, setPermissions] = useState<Record<string, any>>({});
  const [settings, setSettings] = useState<AgentSettings>(DEFAULT_SETTINGS);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { localStorage.setItem("dacexy-conversations-v1", JSON.stringify(conversations)); } catch {}
  }, [conversations]);

  useEffect(() => { chatApi?.permissions?.get?.().then((v: any) => setPermissions(v?.grants || {})).catch(() => {}); }, []);
  useEffect(() => {
    const addResult = (result: any) => {
      const text = `🔄 Automation result — ${result?.name || "Scheduled task"}

${result?.text || result?.status || "Completed"}`;
      setConversations((prev) => {
        const targetId = result?.conversationId;
        const targetConversation = targetId ? prev.find((c) => c.id === targetId) : prev[0];
        if (!targetConversation) return prev;
        if (result?.runId && targetConversation.messages.some((m) => m.content.includes(String(result.runId)))) return prev;
        return prev.map((c) => c.id === targetConversation.id ? { ...c, messages: [...c.messages, createMessage("assistant", `${text}${result?.runId ? `\n\nRun ID: ${result.runId}` : ""}`)], updatedAt: Date.now() } : c);
      });
    };
    chatApi?.automations?.results?.().then((rows: any[]) => (rows || []).slice(-10).forEach(addResult)).catch(() => {});
    const off = chatApi?.automations?.onResult?.(addResult);
    return () => { try { off?.(); } catch {} };
  }, []);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? conversations[0],
    [conversations, activeId],
  );
  const status = getStatus(settings);
  const empty = !!active && active.messages.length === 0;
  const recents = conversations.filter((c) =>
    c.title.toLowerCase().includes(query.trim().toLowerCase()),
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [active?.messages.length, busy, view]);

  useEffect(() => {
    let cancelled = false;
    connectAgent(settings)
      .then(() => { if (!cancelled) setAgentConnected(true); })
      .catch(() => { if (!cancelled) setAgentConnected(false); });
    return () => { cancelled = true; };
  }, [settings.gatewayUrl]);

  function patch(id: string, fn: (c: Conversation) => Conversation) {
    setConversations((prev) => prev.map((c) => (c.id === id ? fn(c) : c)));
  }

  async function executeSend(value: string, sendMode: ChatMode, appendUser = true) {
    const conv = active;
    if (!conv) return;
    setBusy(true);
    if (appendUser) patch(conv.id, (c) => ({ ...c, title: c.messages.length === 0 ? value.slice(0, 38) : c.title, messages: [...c.messages, createMessage("user", value)], updatedAt: Date.now() }));
    try {
      if (sendMode === "automation") {
        const lower = value.toLowerCase();
        const automationApi = chatApi?.automations;
        if (/\b(show|list)\b.*\b(automation|automations|jobs)\b|\b(automation|automations|jobs)\b.*\b(show|list)\b/.test(lower)) {
          const listed = await automationApi?.list?.();
          const rows = Array.isArray(listed) ? listed : (listed?.jobs || listed?.automations || []);
          const text = rows.length ? rows.map(formatAutomation).join("\n\n") : "No scheduled automations are currently configured.";
          patch(conv.id, (c) => ({ ...c, messages: [...c.messages, createMessage("assistant", `🔄 Your scheduled automations\n\n${text}`)], updatedAt: Date.now() }));
          return;
        }
        const findAutomation = async () => {
          const listed = await automationApi?.list?.();
          const rows = Array.isArray(listed) ? listed : (listed?.jobs || listed?.automations || []);
          const target = lower.replace(/\b(pause|disable|resume|enable|delete|remove|run|start|automation|automations|job|now)\b/g, " ").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
          return rows.find((a: any) => String(a?.name || a?.displayName || "").toLowerCase().includes(target) || target.includes(String(a?.name || "").toLowerCase()));
        };
        if (/^\s*(pause|disable)\b/.test(lower)) {
          const a = await findAutomation(); if (!a?.id) throw new Error("I couldn't find that automation. Say ‘show automations’ to see the exact names.");
          await automationApi.disable(a.id); patch(conv.id, (c) => ({ ...c, messages: [...c.messages, createMessage("assistant", `⏸️ Paused automation: ${a.displayName || a.name}`)], updatedAt: Date.now() })); return;
        }
        if (/^\s*(resume|enable|start)\b/.test(lower)) {
          const a = await findAutomation(); if (!a?.id) throw new Error("I couldn't find that automation. Say ‘show automations’ to see the exact names.");
          await automationApi.enable(a.id); patch(conv.id, (c) => ({ ...c, messages: [...c.messages, createMessage("assistant", `▶️ Enabled automation: ${a.displayName || a.name}`)], updatedAt: Date.now() })); return;
        }
        if (/^\s*(delete|remove)\b/.test(lower)) {
          const a = await findAutomation(); if (!a?.id) throw new Error("I couldn't find that automation. Say ‘show automations’ to see the exact names.");
          await automationApi.remove(a.id); patch(conv.id, (c) => ({ ...c, messages: [...c.messages, createMessage("assistant", `🗑️ Removed automation: ${a.displayName || a.name}`)], updatedAt: Date.now() })); return;
        }
        if (/^\s*(run|start)\b.*\bnow\b/.test(lower)) {
          const a = await findAutomation(); if (!a?.id) throw new Error("I couldn't find that automation. Say ‘show automations’ to see the exact names.");
          const result = await automationApi.run(a.id); patch(conv.id, (c) => ({ ...c, messages: [...c.messages, createMessage("assistant", `▶️ Queued automation: ${a.displayName || a.name}\n\n${typeof result === "string" ? result : JSON.stringify(result, null, 2)}`)], updatedAt: Date.now() })); return;
        }
        const spec = parseAutomationRequest(value);
        if (!spec) {
          const msg = "I can create this automation, but I need a clear schedule in the chat (for example: ‘every day at 8 AM’, ‘every weekday at 9 AM’, or ‘every 30 minutes’).";
          patch(conv.id, (c) => ({ ...c, messages: [...c.messages, createMessage("assistant", msg)], updatedAt: Date.now() }));
          return;
        }
        const created = await chatApi?.automations?.create?.({ ...spec, conversationId: conv.id });
        patch(conv.id, (c) => ({ ...c, messages: [...c.messages, createMessage("assistant", `✅ Automation created.\n\n${formatAutomation(created)}\n\nIt is now managed by DACEXY and executed by the local automation runtime. The schedule is stored outside the chat app, so it survives DACEXY restarts.`)], updatedAt: Date.now() }));
        return;
      }
      const prefix = sendMode === "advisor"
        ? "DACEXY mode: BUSINESS ADVISOR. Answer as a business advisor. Do not operate the computer, browser, email, files, or external accounts unless the user explicitly asks to execute an action."
        : "DACEXY mode: TASK EXECUTION. Execute the user's requested task using the available agent tools. Reuse the signed-in browser profile for private sites when permission is granted and use an isolated profile for public work. Prefer direct APIs, shell commands, and native tools when reliable. Batch safe independent work, reuse existing sessions, avoid redundant research and narration, verify critical side effects, and do not claim success unless the action actually completed.";
      const reply = await sendMessage({ conversation: conv, input: `${prefix}\n\nUser request: ${value}`, settings });
      setAgentConnected(true);
      patch(conv.id, (c) => ({ ...c, messages: [...c.messages, reply], updatedAt: Date.now() }));
    } catch (err) {
      setAgentConnected(false);
      const message = err instanceof Error ? err.message : "DACEXY Agent request failed.";
      patch(conv.id, (c) => ({ ...c, messages: [...c.messages, createMessage("assistant", `Agent error: ${message}`)], updatedAt: Date.now() }));
    } finally { setBusy(false); }
  }

  async function send(text: string, forcedMode?: ChatMode) {
    const value = text.replace(/\s+/g, " ").trim();
    if (!value || busy || !active) return;
    const sendMode = forcedMode || mode;
    setInput(""); setView("chat");
    const permission = classifyPermission(value);
    if (permission && !permissions[permission.scope]) {
      setApproval({ ...permission, input: value, mode: sendMode });
      patch(active.id, (c) => ({ ...c, messages: [...c.messages, createMessage("user", value)], updatedAt: Date.now() }));
      return;
    }
    await executeSend(value, sendMode);
  }

  async function approveAndRun(remember: boolean) {
    if (!approval) return;
    const pending = approval; setApproval(null);
    if (remember) {
      const next = await chatApi?.permissions?.grant?.(pending.scope);
      setPermissions(next?.grants || { ...permissions, [pending.scope]: { grantedAt: new Date().toISOString() } });
    }
    await executeSend(pending.input, pending.mode, false);
  }


  function newChat() {
    const c = createConversation();
    setConversations((prev) => [c, ...prev]);
    setActiveId(c.id);
    setView("chat");
  }

  if (!account) {
    return (
      <>
        <Backdrop />
        <Login onDone={setAccount} />
      </>
    );
  }

  const NAV = [
    { key: "chat" as const, label: "New chat", icon: IconPlus, action: newChat },
    { key: "settings" as const, label: "Settings", icon: IconGear },
    { key: "about" as const, label: "About", icon: IconInfo },
  ];

  return (
    <>
      <Backdrop />
      <div className={`shell ${rail ? "is-rail" : ""}`}>
        <div className="titlebar">
          <button className="tb-icon" onClick={() => setRail((r) => !r)} title="Toggle sidebar">
            <IconSidebar />
          </button>
          <span className="tb-brand">
            <Mark size={20} />
            DACEXY AI
            <span className="beta-badge">BETA</span>
          </span>
          <nav className="tb-menu">
            <span>File</span>
            <span>Edit</span>
            <span>View</span>
            <span>Help</span>
          </nav>
          <span className={`tb-status ${agentConnected ? "on" : ""}`}>
            <span className={`dot ${agentConnected ? "on" : ""}`} />
            {agentConnected ? "Agent connected" : status.label}
          </span>
        </div>

        <div className="app">
          <aside className="sidebar">
            <div className="side-head">
              <button className="workspace" onClick={() => setView("chat")} title="DACEXY AI">
                <Mark size={34} />
                <span className="workspace-copy"><strong>DACEXY AI</strong><small>AI Co-Assistant for Business</small></span>
              </button>
              <span className="side-head-tools">
                <button className="tb-icon" title="Search">
                  <IconSearch />
                </button>
                <button className="tb-icon" title="Notifications">
                  <IconBell />
                </button>
              </span>
            </div>

            <nav className="rail-nav primary-nav" aria-label="Primary">
              <button className={view === "chat" ? "is-active" : ""} onClick={() => setView("chat")}><span className="nav-icon"><IconChat /></span>Chat</button>
              <button className="nav-disabled" disabled><span className="nav-icon"><IconCheck /></span>Tasks <small>Soon</small></button>
              <button className={mode === "automation" ? "is-active" : ""} onClick={() => { setView("chat"); setMode("automation"); }}><span className="nav-icon"><IconClock /></span>Automations</button>
              <button className="nav-disabled" disabled><span className="nav-icon"><IconGrid /></span>Tools <small>Soon</small></button>
              <button className="nav-disabled" disabled><span className="nav-icon"><IconInfo /></span>Knowledge <small>Soon</small></button>
              <button className={view === "settings" ? "is-active" : ""} onClick={() => setView("settings")}><span className="nav-icon"><IconGear /></span>Settings</button>
            </nav>
            <div className="nav-divider" />

            <div className="side-search">
              <IconSearch />
              <input
                placeholder="Search chats"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="sidebar-scroll">
              <div className="section-heading"><span>Recent Chats</span><span>···</span></div>
              {recents.map((c) => (
                <button
                  key={c.id}
                  className={`conv ${active?.id === c.id && view === "chat" ? "is-active" : ""}`}
                  onClick={() => {
                    setActiveId(c.id);
                    setView("chat");
                  }}
                  title={c.title}
                >
                  <span className="conv-title">{c.title}</span>
                </button>
              ))}
              {recents.length === 0 && <p className="side-empty">No matching chats</p>}
            </div>

            <div className="integration-card">
              <div className="section-heading"><span>Agent Status</span><span className="status-live"><i /> Ready</span></div>
              <div className="integration-row"><span className="status-dot" /><span>Agent runtime</span><strong>Connected</strong></div>
              <div className="integration-row"><span className="status-dot" /><span>Browser</span><strong>Ready</strong></div>
              <div className="integration-row"><span className="status-dot" /><span>Local computer</span><strong>Ready</strong></div>
            </div>

            <div className="account-wrap">
              {menu && (
                <div className="account-menu">
                  <button
                    onClick={() => {
                      signOut();
                      setAccount(null);
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
              <button className="account" onClick={() => setMenu((m) => !m)}>
                <span className="avatar-chip flow-gradient">{initials(account)}</span>
                <span className="account-meta">
                  <strong>{account.name}</strong>
                  <span>{account.plan}</span>
                </span>
                <span className="account-chevron">
                  <IconHelp />
                </span>
              </button>
            </div>
          </aside>

          <main className="main">
            {view === "chat" && empty ? (
              <div className="hero-wrap">
                <div className="hero">
                  <Mark size={78} halo />
                  <h1>
                    Hello, I’m <span className="text-cinematic">DACEXY AI</span>
                  </h1>
                  <p className="hero-sub">
                    Your AI co-assistant for business. Research, create files, browse the web, manage work and complete real tasks.
                  </p>
                  <div className="hero-grid">
                    {QUICK.map(({ icon: Icon, label }) => (
                      <button
                        key={label}
                        className="hero-card"
                        onClick={() => send(label.replace("\n", " "), "task")}
                      >
                        <span className="hero-icon">
                          <Icon />
                        </span>
                        <span className="hero-label">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="scroll" ref={scrollRef}>
                {view === "chat" && (
                  <div className="thread">
                    {active?.messages.map((m) => (
                      <article key={m.id} className={`msg ${m.role}`}>
                        {m.role === "user" ? (
                          <span className="avatar">{initials(account)}</span>
                        ) : (
                          <span className="avatar agent">
                            <img src={markUrl} alt="DACEXY" />
                          </span>
                        )}
                        <div className="bubble">{displayMessageContent(m.content)}</div>
                      </article>
                    ))}
                    {approval && (
                      <article className="msg assistant approval-msg">
                        <span className="avatar agent"><img src={markUrl} alt="DACEXY" /></span>
                        <div className="bubble approval-card">
                          <strong>🔐 Permission needed</strong>
                          <p>This request needs permission to <b>{approval.label}</b>.</p>
                          <p className="hint">You can allow it once and DACEXY will remember the permission instead of asking again.</p>
                          <div className="approval-actions">
                            {approval.rememberable && <button className="btn-primary flow-gradient" onClick={() => approveAndRun(true)}>Allow & remember</button>}
                            <button className={approval.rememberable ? "btn-outline" : "btn-primary flow-gradient"} onClick={() => approveAndRun(false)}>Allow once</button>
                            <button className="btn-outline" onClick={() => setApproval(null)}>Decline</button>
                          </div>
                        </div>
                      </article>
                    )}
                    {busy && (
                      <article className="msg assistant">
                        <span className="avatar agent">
                          <img src={markUrl} alt="DACEXY" />
                        </span>
                        <div className="bubble typing">
                          <i /> <i /> <i />
                        </div>
                      </article>
                    )}
                  </div>
                )}

                {view === "settings" && (
                  <div className="panel">
                    <section className="card">
                      <h2>Agent</h2>
                      <label>
                        Model
                        <select
                          value={settings.model}
                          onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                        >
                          {AGENT_MODELS.map((m) => (
                            <option key={m}>{m}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Temperature · {settings.temperature.toFixed(2)}
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.05}
                          value={settings.temperature}
                          onChange={(e) =>
                            setSettings({ ...settings, temperature: +e.target.value })
                          }
                        />
                      </label>
                      <label>
                        Gateway URL
                        <input
                          type="text"
                          placeholder="Configured in a later release"
                          value={settings.gatewayUrl}
                          onChange={(e) => setSettings({ ...settings, gatewayUrl: e.target.value })}
                        />
                      </label>
                    </section>
                    <section className="card">
                      <h2>Workspace</h2>
                      <div className="about">
                        <dl>
                          <div>
                            <dt>Signed in as</dt>
                            <dd>{account.email}</dd>
                          </div>
                          <div>
                            <dt>Plan</dt>
                            <dd>{account.plan}</dd>
                          </div>
                        </dl>
                      </div>
                    </section>
                    <section className="card">
                      <h2>Usage protection</h2>
                      <div className="about">
                        <dl>
                          <div><dt>Safety budget</dt><dd>{usageStats ? `₹${Number(usageStats.budget_rupees || 0).toFixed(2)} / ${usageStats.period}` : "Protected by plan"}</dd></div>
                          <div><dt>Used</dt><dd>{usageStats ? `₹${Number(usageStats.spent_rupees || 0).toFixed(2)}` : "—"}</dd></div>
                          <div><dt>Remaining</dt><dd>{usageStats ? `₹${Number(usageStats.remaining_rupees || 0).toFixed(2)}` : "—"}</dd></div>
                        </dl>
                      </div>
                      <p className="hint">Tasks are admitted while your plan budget remains. There is no arbitrary tiny task-count quota.</p>
                    </section>
                    <section className="card">
                      <h2>Privacy</h2>
                      <label className="row">
                        <input
                          type="checkbox"
                          checked={settings.desktopControl}
                          onChange={(e) =>
                            setSettings({ ...settings, desktopControl: e.target.checked })
                          }
                        />
                        Allow desktop control
                      </label>
                      <label className="row">
                        <input
                          type="checkbox"
                          checked={settings.telemetry}
                          onChange={(e) =>
                            setSettings({ ...settings, telemetry: e.target.checked })
                          }
                        />
                        Share anonymous usage data
                      </label>
                      <p className="hint">
                        Anonymous telemetry is optional. Account usage and plan protection are handled by the DACEXY service.
                      </p>
                    </section>
                  </div>
                )}

                {view === "about" && (
                  <div className="panel">
                    <section className="card about">
                      <span className="brand">
                        <Mark size={38} halo />
                        <span className="brand-text">DACEXY AI</span>
                      </span>
                      <p className="lead">The DACEXY desktop agent for Windows.</p>
                      <dl>
                        <div>
                          <dt>Version</dt>
                          <dd>{APP_VERSION}</dd>
                        </div>
                        <div>
                          <dt>Platform</dt>
                          <dd>{runtime?.platform ?? "web"}</dd>
                        </div>
                        <div>
                          <dt>Runtime</dt>
                          <dd>Electron {runtime?.electron ?? "—"}</dd>
                        </div>
                        <div>
                          <dt>Chromium</dt>
                          <dd>{runtime?.chrome ?? "—"}</dd>
                        </div>
                        <div>
                          <dt>Agent backend</dt>
                          <dd>{agentConnected ? "Local runtime" : "Local agent runtime"}</dd>
                        </div>
                      </dl>
                      <p className="hint">© {new Date().getFullYear()} DACEXY. All rights reserved.</p>
                    </section>
                  </div>
                )}
              </div>
            )}

            {view === "chat" && (
              <footer className="composer-wrap">
                <div className="composer-shell">
                  <div className="composer-head">
                    <div className="mode-switch" role="tablist" aria-label="DACEXY mode">
                      <button className={mode === "advisor" ? "mode is-active" : "mode"} onClick={() => setMode("advisor")}>💬 Advisor</button>
                      <button className={mode === "task" ? "mode is-active" : "mode"} onClick={() => setMode("task")}>⚡ Task</button>
                      <button className={mode === "automation" ? "mode is-active" : "mode"} onClick={() => setMode("automation")}>⏱ Automation</button>
                    </div>
                  </div>
                  <textarea
                    value={input}
                    placeholder="Do anything"
                    rows={1}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send(input);
                      }
                    }}
                  />
                  <div className="composer-foot">
                    <button className="tb-icon" title="Attach">
                      <IconPlus />
                    </button>
                    <span className="foot-chip">
                      <IconShield /> Sensitive actions ask in chat
                    </span>
                    <span className="foot-spacer" />
                    <select
                      className="model-select"
                      value={settings.model}
                      onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                    >
                      {AGENT_MODELS.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                    <button className="tb-icon" title="Voice input">
                      <IconMic />
                    </button>
                    <button
                      className="send flow-gradient"
                      disabled={busy || !input.trim()}
                      onClick={() => send(input)}
                      title="Send"
                    >
                      <IconArrowUp />
                    </button>
                  </div>
                </div>
                <p className="composer-hint">
                  <IconChat /> Responses are powered by your local AI agent.
                </p>
              </footer>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
