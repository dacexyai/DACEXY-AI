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

type View = "chat" | "agent" | "dashboard" | "settings" | "about";

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
            OpenClaw Gateway at ws://127.0.0.1:18789 (direct connection).
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
          DACEXY connects directly to the OpenClaw Gateway on ws://127.0.0.1:18789. No DACEXY Brize
          or compatibility bridge is used.
        </p>
      </section>
    </div>
  );
}

/* ---------------- App ---------------- */

export default function App() {
  const [account, setAccount] = useState<Account | null>(() => restore());
  const [conversations, setConversations] = useState<Conversation[]>(() => [
    createConversation("Welcome to DACEXY"),
  ]);
  const [activeId, setActiveId] = useState<string>("");
  const [view, setView] = useState<View>("chat");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState(false);
  const [rail, setRail] = useState(false);
  const [query, setQuery] = useState("");
  const [agentConnected, setAgentConnected] = useState(false);
  const [settings, setSettings] = useState<AgentSettings>(DEFAULT_SETTINGS);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  async function send(text: string) {
    const value = text.replace(/\s+/g, " ").trim();
    if (!value || busy || !active) return;
    const conv = active;
    setInput("");
    setBusy(true);
    setView("chat");
    patch(conv.id, (c) => ({
      ...c,
      title: c.messages.length === 0 ? value.slice(0, 38) : c.title,
      messages: [...c.messages, createMessage("user", value)],
      updatedAt: Date.now(),
    }));
    try {
      const reply = await sendMessage({ conversation: conv, input: value, settings });
      setAgentConnected(true);
      patch(conv.id, (c) => ({ ...c, messages: [...c.messages, reply], updatedAt: Date.now() }));
    } catch (err) {
      setAgentConnected(false);
      const message = err instanceof Error ? err.message : "DACEXY Agent request failed.";
      patch(conv.id, (c) => ({ ...c, messages: [...c.messages, createMessage("assistant", `Agent error: ${message}`)], updatedAt: Date.now() }));
    } finally {
      setBusy(false);
    }
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
    { key: "agent" as const, label: "Agent hub", icon: IconDownload },
    { key: "dashboard" as const, label: "Dashboard", icon: IconGrid },
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
            <Mark size={18} />
            DACEXY AI
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
              <button className="workspace" onClick={() => setView("chat")}>
                <span className="brand-text">DACEXY</span>
                <span className="account-chevron">
                  <IconChevron />
                </span>
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

            <nav className="rail-nav">
              {NAV.map(({ key, label, icon: Icon, action }) => (
                <button
                  key={label}
                  className={view === key && !action ? "is-active" : ""}
                  onClick={() => (action ? action() : setView(key))}
                >
                  <span className="nav-icon">
                    <Icon />
                  </span>
                  {label}
                </button>
              ))}
              <button onClick={() => setView("agent")}>
                <span className="nav-icon">
                  <IconPlug />
                </span>
                Plugins
              </button>
              <button onClick={() => setView("dashboard")}>
                <span className="nav-icon">
                  <IconBranch />
                </span>
                Workflows
              </button>
            </nav>

            <div className="side-search">
              <IconSearch />
              <input
                placeholder="Search chats"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="sidebar-scroll">
              <p className="side-label">Recents</p>
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
                    What should we <span className="text-cinematic">build?</span>
                  </h1>
                  <p className="hero-sub">
                    Ask DACEXY to run something on your desktop, or pick a starting point.
                  </p>
                  <div className="hero-grid">
                    {QUICK.map(({ icon: Icon, label }) => (
                      <button
                        key={label}
                        className="hero-card"
                        onClick={() => send(label.replace("\n", " "))}
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
                        <div className="bubble">{m.content}</div>
                      </article>
                    ))}
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

                {view === "agent" && (
                  <div className="panel wide">
                    <AgentHub connected={agentConnected} onConnected={setAgentConnected} />
                  </div>
                )}

                {view === "dashboard" && (
                  <div className="panel">
                    <div className="stat-grid">
                      {[
                        ["Conversations", String(conversations.length)],
                        [
                          "Messages",
                          String(conversations.reduce((n, c) => n + c.messages.length, 0)),
                        ],
                        ["Model", settings.model],
                        ["Agent", agentConnected ? "Connected" : "Offline"],
                      ].map(([k, v]) => (
                        <div key={k} className="stat">
                          <span>{k}</span>
                          <strong>{v}</strong>
                        </div>
                      ))}
                    </div>
                    <section className="card">
                      <h2>Recent activity</h2>
                      <div className="about">
                        <dl>
                          {conversations.slice(0, 6).map((c) => (
                            <div key={c.id}>
                              <dt>{c.title}</dt>
                              <dd>{clock(c.updatedAt)}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </section>
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
                        The agent backend is not connected in this build, so no data leaves this
                        machine.
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
                          <dd>{agentConnected ? "Local runtime" : "Local OpenClaw Gateway"}</dd>
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
                    <span className="chip">
                      <IconFolder /> Choose workspace
                    </span>
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
                      <IconShield /> Ask for approval
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
                  <IconChat /> Responses are powered by your local OpenClaw Gateway.
                </p>
              </footer>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
