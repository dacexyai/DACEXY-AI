import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  FileText,
  Globe,
  Sparkles,
  LayoutGrid,
  LogOut,
  Loader2,
  PanelLeft,
  Search,
  SquarePen,
  Image as ImageIcon,
  Library,
  Blocks,
  FolderKanban,
  Settings,
  Plus,
  Mic,
  Brain,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { BrandMark } from "@/components/brand-mark";
import { ComingSoonBadge } from "@/components/coming-soon";
import { getBusinessAdvisorQuota, sendBusinessAdvisorMessage, type ChatHistoryMessage } from "@/lib/api";

const TITLE = "Business Advisor — Dacexy AI";
const DESCRIPTION = "Chat with Dacexy AI for practical business strategy, marketing, sales, finance and growth advice.";

export const Route = createFileRoute("/chat")({
  component: ChatPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type Message = ChatHistoryMessage & { id: string };

const suggestions = [
  { icon: FileText, label: "Business strategy", prompt: "Help me identify the 3 highest-impact priorities for my business right now." },
  { icon: Globe, label: "Competitor strategy", prompt: "Help me compare my competitors and find a defensible way to differentiate." },
  { icon: Sparkles, label: "Marketing & sales", prompt: "Build me a practical 30-day plan to generate more qualified leads and improve conversion." },
  { icon: LayoutGrid, label: "Growth plan", prompt: "Create a step-by-step growth plan with targets, metrics, risks and next actions." },
];

const navItems = [
  { icon: SquarePen, label: "New chat" },
  { icon: ImageIcon, label: "Images" },
  { icon: Library, label: "Library" },
  { icon: Blocks, label: "Plugins" },
  { icon: FolderKanban, label: "Projects" },
];

const recents = [
  "Business strategy",
  "Competitor strategy",
  "Marketing & sales",
  "Growth plan",
];

const models = [
  { id: "advisor", name: "Dacexy Business Advisor", hint: "Practical business strategy and decision support" },
];

function readUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("dacexy_user");
    return raw ? JSON.parse(raw) as { first_name: string; last_name: string; email: string; company?: string | null } : null;
  } catch {
    return null;
  }
}

function signOutLocal() {
  localStorage.removeItem("dacexy_token");
  localStorage.removeItem("dacexy_refresh_token");
  localStorage.removeItem("dacexy_user");
}

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

function ChatPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(readUser);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [sidebar, setSidebar] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [thinking, setThinking] = useState(true);
  const [query, setQuery] = useState("");
  const [model] = useState(models[0]!.id);
  const [quota, setQuota] = useState<{ calls_used: number; calls_limit: number; calls_remaining: number; plan: string } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("dacexy_token");
    const current = readUser();
    if (!token || !current) navigate({ to: "/login" });
    else setUser(current);
  }, [navigate]);

  useEffect(() => {
    if (localStorage.getItem("dacexy_token")) {
      getBusinessAdvisorQuota().then(setQuota).catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    if (!busy) inputRef.current?.focus();
  }, [busy, messages.length]);

  const filteredRecents = useMemo(
    () => recents.filter((r) => r.toLowerCase().includes(query.trim().toLowerCase())),
    [query],
  );

  async function submit(text: string) {
    const value = text.trim();
    if (!value || busy) return;
    if (quota && quota.calls_limit > 0 && quota.calls_remaining <= 0) {
      toast.error("Monthly chat limit reached", {
        description: "The Free plan includes 30 business-advisor chats per month.",
      });
      return;
    }

    const userMsg: Message = { id: newId(), role: "user", content: value };
    const history: ChatHistoryMessage[] = [...messages, userMsg].slice(-12).map(({ role, content }) => ({ role, content }));
    setMessages((current) => [...current, userMsg]);
    setInput("");
    setBusy(true);

    try {
      const result = await sendBusinessAdvisorMessage(value, history.slice(0, -1));
      setMessages((current) => [
        ...current,
        { id: newId(), role: "assistant", content: result.reply },
      ]);
      setQuota(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to get advice right now.";
      toast.error("Business advisor unavailable", { description: message });
    } finally {
      setBusy(false);
    }
  }

  if (!user) {
    return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }

  const firstName = user.first_name || "there";
  const initials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() || "U";

  return (
    <section className="relative overflow-hidden">
      <div className="aurora-backdrop animate-drift pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="grid-backdrop pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="relative z-10 flex min-h-[calc(100vh-4rem)]">
        <aside className={`hidden shrink-0 border-r border-border bg-card/60 backdrop-blur-xl transition-all duration-300 md:flex md:flex-col ${sidebar ? "w-64" : "w-[68px]"}`}>
          <div className="flex items-center justify-between gap-2 px-3 py-4">
            <span className="flex items-center gap-2 overflow-hidden">
              <BrandMark className="h-8 w-8 shrink-0" glow />
              {sidebar && <span className="font-display text-sm font-semibold">Dacexy</span>}
            </span>
            <button type="button" onClick={() => setSidebar((s) => !s)} aria-label="Toggle sidebar" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <PanelLeft className="h-4 w-4" />
            </button>
          </div>

          <nav className="space-y-1 px-2">
            {navItems.map((item, i) => (
              <button
                key={item.label}
                type="button"
                onClick={() => i === 0 && setMessages([])}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${i === 0 ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"}`}
              >
                <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.7} />
                {sidebar && <span className="truncate">{item.label}</span>}
              </button>
            ))}
          </nav>

          {sidebar && (
            <>
              <div className="mt-5 px-3">
                <div className="flex items-center gap-2 rounded-lg border border-border bg-background/60 px-2.5 py-1.5">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search chats" className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground" />
                </div>
              </div>
              <div className="mt-4 flex-1 overflow-y-auto px-2 pb-4">
                <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Recents</p>
                {filteredRecents.map((r) => (
                  <button key={r} type="button" className="block w-full truncate rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground">{r}</button>
                ))}
              </div>
            </>
          )}

          <div className="mt-auto border-t border-border p-2">
            <div className="flex items-center gap-2 rounded-lg px-2 py-2">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-card text-[11px] font-semibold">{initials}</span>
              {sidebar && (
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{user.first_name} {user.last_name}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{user.email}</span>
                </span>
              )}
              {sidebar && (
                <button type="button" onClick={() => setSettingsOpen(true)} aria-label="Open settings" className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                  <Settings className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3 backdrop-blur-xl md:px-6">
            <div className="flex items-center gap-2 md:hidden">
              <BrandMark className="h-8 w-8" glow />
              <span className="font-display text-sm font-semibold">Dacexy</span>
            </div>

            <div className="mx-auto hidden items-center gap-3 md:flex">
              <span className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium shadow-[var(--shadow-card)]">Business Advisor</span>
              {quota && (
                <span className="text-xs text-muted-foreground">
                  {quota.calls_limit < 0 ? "Unlimited chats" : `${quota.calls_remaining} of ${quota.calls_limit} chats remaining this month`}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <ComingSoonBadge className="hidden lg:inline-flex" />
              <button type="button" onClick={() => setSettingsOpen(true)} aria-label="Settings" className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground md:hidden">
                <Settings className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => { signOutLocal(); navigate({ to: "/login" }); }} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </div>
          </header>

          <div className="flex flex-1 flex-col">
            <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 md:px-6">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col justify-center">
                  <h1 className="text-center font-display text-3xl font-semibold md:text-4xl">
                    How can I <span className="shine-text">help</span>, {firstName}?
                  </h1>
                  <p className="mt-3 text-center text-sm text-muted-foreground">
                    Your AI business advisor for strategy, growth, marketing, sales and better decisions.
                  </p>
                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    {suggestions.map((s) => (
                      <button key={s.label} type="button" onClick={() => submit(s.prompt)} className="surface-card lift group flex items-start gap-3 p-4 text-left text-sm">
                        <span className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-lg text-primary-foreground" style={{ backgroundImage: "var(--gradient-cinematic)" }}>
                          <s.icon className="h-4 w-4" strokeWidth={1.7} />
                        </span>
                        <span>
                          <span className="block font-medium">{s.label}</span>
                          <span className="text-muted-foreground">{s.prompt}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {messages.map((m) => m.role === "user" ? (
                    <div key={m.id} className="flex justify-end gap-3">
                      <div className="max-w-[80%] rounded-2xl rounded-br-md px-4 py-3 text-[15px] font-medium text-primary-foreground shadow-[var(--shadow-card)]" style={{ backgroundImage: "var(--gradient-cinematic)" }}>{m.content}</div>
                      <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-card text-[11px] font-semibold">{initials}</span>
                    </div>
                  ) : (
                    <div key={m.id} className="flex gap-3">
                      <BrandMark className="mt-1 h-8 w-8 shrink-0" />
                      <div className="max-w-[85%] whitespace-pre-wrap text-[16px] font-medium leading-7 text-foreground">{m.content}</div>
                    </div>
                  ))}
                  {busy && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <BrandMark className="h-8 w-8" glow />
                      <span className="shine-text">Thinking…</span>
                    </div>
                  )}
                  <div ref={endRef} />
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gradient-to-t from-background via-background/90 to-transparent px-4 pb-6 pt-4 md:px-6">
              <form onSubmit={(e) => { e.preventDefault(); submit(input); }} className="mx-auto w-full max-w-3xl">
                <div className="gradient-border surface-card p-2 shadow-[var(--shadow-float)]">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(input); } }}
                    rows={1}
                    placeholder="Ask your business advisor anything…"
                    className="max-h-40 min-h-[46px] w-full resize-none bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground"
                    maxLength={8000}
                  />
                  <div className="flex items-center justify-between gap-2 px-1 pb-1">
                    <div className="flex items-center gap-1">
                      <button type="button" aria-label="Attach file" className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"><Plus className="h-4 w-4" /></button>
                      <button type="button" onClick={() => setThinking((t) => !t)} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors ${thinking ? "border border-primary/40 bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary"}`}>
                        <Brain className="h-3.5 w-3.5" /> Think
                      </button>
                      <select value={model} disabled aria-label="Model" className="rounded-full bg-transparent px-2 py-1.5 text-xs text-muted-foreground outline-none opacity-80">
                        {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" aria-label="Voice input" className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"><Mic className="h-4 w-4" /></button>
                      <button type="submit" disabled={busy || !input.trim()} aria-label="Send message" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40" style={{ backgroundImage: "var(--gradient-cinematic)" }}>
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  {quota?.calls_limit === 30 ? "Free plan: 30 business-advisor chats per month." : "Business Advisor · practical, decision-focused guidance."}
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      {settingsOpen && (
        <SettingsPanel onClose={() => setSettingsOpen(false)} thinking={thinking} setThinking={setThinking} email={user.email} name={`${user.first_name} ${user.last_name}`} />
      )}
    </section>
  );
}

function SettingsPanel({
  onClose,
  thinking,
  setThinking,
  email,
  name,
}: {
  onClose: () => void;
  thinking: boolean;
  setThinking: (v: boolean) => void;
  email: string;
  name: string;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4 backdrop-blur-sm">
      <div className="gradient-border surface-card w-full max-w-lg p-6 shadow-[var(--shadow-float)]">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">Business Advisor</h2>
            <p className="text-xs text-muted-foreground">Dacexy AI web chat</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close settings" className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-6 space-y-5">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-3">
            <BrandMark className="h-9 w-9" glow />
            <div className="min-w-0"><p className="truncate text-sm font-medium">{name}</p><p className="truncate text-xs text-muted-foreground">{email}</p></div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <span><span className="block text-sm font-medium">Extended thinking</span><span className="block text-xs text-muted-foreground">Use a deeper reasoning pass before replying</span></span>
            <button type="button" role="switch" aria-checked={thinking} onClick={() => setThinking(!thinking)} className={`relative h-6 w-11 rounded-full transition-colors ${thinking ? "" : "bg-secondary"}`} style={thinking ? { backgroundImage: "var(--gradient-cinematic)" } : undefined}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow-[var(--shadow-card)] transition-all ${thinking ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="text-sm font-medium">Monthly chat allowance</p>
            <p className="mt-1 text-xs text-muted-foreground">Free accounts receive 30 business-advisor chats per calendar month. Paid plans are not limited by this free quota.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
