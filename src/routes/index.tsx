import { createFileRoute, Link } from "@tanstack/react-router";
import {
  MessageSquare,
  MonitorCog,
  Globe,
  LayoutTemplate,
  ImageIcon,
  Video,
  FileText,
  LineChart,
  Megaphone,
  BarChart3,
  Mic,
  Brain,
  ArrowRight,
  Check,
} from "lucide-react";
import { Download } from "lucide-react";
import { DownloadSection } from "@/components/download-section";
import { Reveal } from "@/components/reveal";
import { BrandMark } from "@/components/brand-mark";
import { AsciiField } from "@/components/ascii-field";
import { GlyphScramble } from "@/components/glyph-scramble";

const TITLE = "Dacexy AI — Your AI Employee That Actually Works";
const DESCRIPTION =
  "Dacexy AI is an autonomous AI employee for business. It researches, plans, automates your desktop and browser, creates documents and websites, and delivers finished work from a single instruction.";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

const trustedBy = ["GROWING BUSINESSES", "Startups", "AGENCIES", "Freelancers", "SHOPIFY STORES", "Consultants"];

const capabilities = [
  { icon: MessageSquare, title: "AI Chat", body: "Business-grade assistant on DeepSeek, Claude, GPT, Gemini and local Ollama models." },
  { icon: MonitorCog, title: "Desktop Automation", body: "Opens software, clicks, types, manages files and folders, and runs full workflows on your machine." },
  { icon: Globe, title: "Browser Automation", body: "Browses, searches, fills forms, extracts data and downloads files without supervision." },
  { icon: LayoutTemplate, title: "Website Builder", body: "Generates and deploys landing pages, portfolios and complete business websites." },
  { icon: ImageIcon, title: "Image Generation", body: "Marketing creatives, product shots, social graphics and logos on brand." },
  { icon: Video, title: "Video Generation", body: "Ads, product demos and social content produced end to end." },
  { icon: FileText, title: "Document Generator", body: "Word, PDF, Excel, PowerPoint, invoices, proposals and business plans." },
  { icon: LineChart, title: "Business Research", body: "Competitor analysis, industry reports, pricing studies and SWOT." },
  { icon: Megaphone, title: "Marketing", body: "Campaigns, email sequences, SEO research and social calendars." },
  { icon: BarChart3, title: "Analytics", body: "Reads your spreadsheets and files, then reports what actually matters." },
  { icon: Mic, title: "Voice Assistant", body: '"Hey Dex — create today\'s sales report and email it to my client."' },
  { icon: Brain, title: "Memory", body: "Remembers your business, projects, preferences and previous work." },
];

const runLog = [
  '> dex: "research our top 5 competitors and build the deck"',
  "",
  "→ planning ................................ 6 steps",
  "→ browser: 42 sources reviewed ............ ok",
  "→ desktop: /Reports/Q3-Competitors created  ok",
  "→ analysis: pricing + positioning matrix .. ok",
  "→ generating Competitor-Analysis.pptx ..... 18 slides",
  "→ generating Summary.pdf .................. 6 pages",
  "→ verifying figures and citations ......... passed",
  "",
  "delivered in 7m 12s — 2 files ready to download",
].join("\n");

const steps = [
  { n: "01", t: "Tell DACEXY what you need", d: "One instruction in plain language. No prompt engineering, no templates." },
  { n: "02", t: "DACEXY researches and plans", d: "It understands the intent, gathers context and builds an execution plan." },
  { n: "03", t: "DACEXY completes the work", d: "AI, browser, desktop and file tools working together until the job is done." },
  { n: "04", t: "Review and download", d: "Finished, verified deliverables — not a wall of text to copy and paste." },
];

const useCases = [
  "Create a complete business plan",
  "Generate and deploy a website",
  "Analyze competitors",
  "Build marketing campaigns",
  "Prepare investor presentations",
  "Generate invoices and contracts",
  "Automate repetitive back-office work",
  "Summarise meetings and send follow-ups",
];

const differences = [
  ["ChatGPT", "Answers questions."],
  ["Claude", "Writes content."],
  ["Gemini", "Searches information."],
  ["Copilot", "Helps developers."],
  ["DACEXY", "Actually finishes complete business tasks."],
];

const reasons = [
  "Autonomous AI",
  "Desktop Control",
  "Browser Automation",
  "Business Intelligence",
  "Multi-AI Engine",
  "Voice Commands",
  "Document Creation",
  "Website Generation",
  "Works 24/7",
];

const testimonials = [
  {
    q: "It replaced four tools and about two days of admin every week. We brief it once and the files land finished.",
    a: "Operations lead",
    r: "12-person agency, beta program",
  },
  {
    q: "The competitor research decks used to take a consultant a week. Dacexy delivers them the same afternoon.",
    a: "Founder",
    r: "B2B SaaS startup, beta program",
  },
  {
    q: "Invoices, proposals and follow-up emails now handle themselves. That is a whole role we did not need to hire.",
    a: "Managing director",
    r: "Ecommerce brand, beta program",
  },
];

const faqs: [string, string][] = [
  ["What is DACEXY?", "An autonomous AI employee for business. You give it a goal and it performs the work from start to finish, then hands back finished deliverables."],
  ["How is it different from ChatGPT?", "Chat assistants generate text and leave the work to you. DACEXY researches, plans, uses your desktop and browser, creates the files and verifies the result."],
  ["Can it control my computer?", "Yes. With your permission it can open applications, click, type, organise folders and run multi-step workflows on your machine."],
  ["Which AI models does it use?", "DeepSeek, Claude, GPT, Gemini and local Ollama models, with automatic provider switching so every task runs on the best fit."],
  ["Can it generate websites?", "Yes — landing pages, portfolios and full business sites, generated and deployed automatically."],
  ["Does it create documents?", "Word, PDF, Excel, PowerPoint, reports, invoices, proposals and business plans, formatted and ready to send."],
  ["Is my data secure?", "Your data stays yours. Work runs under scoped permissions with secret redaction, a full audit trail and no training on your content."],
];

function Index() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="aurora-backdrop animate-drift pointer-events-none absolute inset-x-0 top-0 h-[540px]" aria-hidden="true" />
        <div className="grid-backdrop pointer-events-none absolute inset-0" aria-hidden="true" />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[620px] opacity-[0.5] [mask-image:radial-gradient(ellipse_75%_60%_at_50%_28%,black,transparent_78%)]"
          aria-hidden="true"
        >
          <AsciiField />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 pt-24 pb-16 text-center md:pt-32">
          <Reveal className="flex justify-center">
            <span className="relative inline-grid place-items-center">
              <span
                aria-hidden="true"
                className="animate-spin-slow absolute inset-[-14px] rounded-full opacity-30 [mask-image:radial-gradient(closest-side,transparent_72%,black_74%)]"
                style={{ backgroundImage: "var(--gradient-cinematic)" }}
              />
              <BrandMark className="animate-float h-16 w-16 md:h-20 md:w-20" glow />
            </span>
          </Reveal>
          <Reveal as="span" className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase shadow-[var(--shadow-card)]">
            <span className="h-1.5 w-1.5 rounded-full bg-primary pulse-ring" />
            <GlyphScramble text="ONE AI · UNLIMITED BUSINESS TASKS" />
          </Reveal>
          <span className="sr-only">Dacexy AI</span>
          <Reveal delay={90}>
            <h1 className="mt-6 text-5xl leading-[1.05] font-semibold md:text-7xl">
              Your AI employee that actually <span className="shine-text">gets work done</span>.
            </h1>
          </Reveal>
          <Reveal delay={180}>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Stop switching between AI tools. DACEXY researches, plans, automates, creates documents,
            builds websites and completes business tasks from start to finish — all from a single
            instruction.
          </p>
          </Reveal>
          <Reveal delay={260} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/download"
              className="sheen flow-gradient inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-float)] transition-transform hover:-translate-y-0.5"
              style={{ backgroundImage: "var(--gradient-cinematic)" }}
            >
              <Download className="h-4 w-4" />
              <span className="font-mono tracking-tight">Download for macOS &amp; Windows</span>
            </Link>
            <Link
              to="/pricing"
              className="lift inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 font-mono text-sm font-medium shadow-[var(--shadow-card)] hover:bg-secondary"
            >
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>

          <Reveal delay={340} className="live-border animate-float mx-auto mt-16 overflow-hidden rounded-2xl bg-card text-left shadow-[var(--shadow-float)]">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
              <span className="h-2.5 w-2.5 rounded-full bg-primary/60 caret-blink" />
              <span className="ml-2 font-mono text-[12px] text-muted-foreground">
                dacexy — autonomous run
              </span>
            </div>
            <pre className="overflow-x-auto p-6 font-mono text-[13px] leading-7 text-muted-foreground">
              <code>{runLog}</code>
              <span className="caret-blink text-primary">▍</span>
            </pre>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-border bg-secondary/30">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <p className="text-center text-xs tracking-[0.2em] text-muted-foreground uppercase">
            Trusted by teams who are done doing it manually
          </p>
          <div className="mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
            <div className="animate-marquee flex w-max items-center gap-12">
              {[...trustedBy, ...trustedBy].map((l, i) => (
                <span
                  key={`${l}-${i}`}
                  className="font-display text-lg font-semibold tracking-tight whitespace-nowrap text-muted-foreground/70"
                >
                  {l}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pt-24">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold md:text-5xl">What is DACEXY?</h2>
            <p className="mt-6 text-muted-foreground">
              DACEXY is an autonomous AI business agent designed to act like a digital employee
              rather than a chatbot. Instead of only answering questions, it understands goals,
              creates execution plans, uses tools, verifies results and completes real business work
              across your computer and the web.
            </p>
            <p className="mt-4 text-muted-foreground">
              It combines conversational AI, autonomous reasoning, desktop automation, browser
              automation, document generation and business intelligence into one unified system.
            </p>
            <Link
              to="/capabilities"
              className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              Explore capabilities <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="gradient-border surface-card p-8 shadow-[var(--shadow-float)]">
            <h3 className="font-display text-lg font-semibold text-cinematic">Core vision</h3>
            <p className="mt-4 text-muted-foreground">
              Give every business an AI employee that can think, plan, execute, verify and deliver
              real work 24/7.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-muted-foreground">
              {[
                "Understands the objective, not just the prompt",
                "Plans a structured mission before acting",
                "Verifies its own output before delivery",
                "Recovers automatically when a step fails",
              ].map((i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {i}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {[
            ["24/7", "always working"],
            ["6+", "AI models orchestrated"],
            ["40+", "business tasks automated"],
            ["1", "instruction to finished work"],
          ].map(([v, l]) => (
            <div key={l}>
              <div className="font-display text-4xl font-semibold text-cinematic">{v}</div>
              <div className="mt-2 text-sm text-muted-foreground">{l}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card/60">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="max-w-2xl text-3xl font-semibold md:text-5xl">What DACEXY can do.</h2>
          <p className="mt-4 max-w-xl text-muted-foreground">
            One autonomous employee covering the work that usually needs a whole toolkit — and a
            whole team.
          </p>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map(({ icon: Icon, title, body }, i) => (
              <Reveal
                key={title}
                delay={(i % 3) * 90}
                className="surface-card lift group p-7"
              >
                <span
                  className="flow-gradient inline-grid h-10 w-10 place-items-center rounded-lg text-primary-foreground transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
                  style={{ backgroundImage: "var(--gradient-cinematic)" }}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-14 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold md:text-5xl">How it works.</h2>
            <p className="mt-4 max-w-md text-muted-foreground">
              No manual prompting. No copy and paste. No switching between AI tools. You set the
              goal, DACEXY does the rest and verifies its own work.
            </p>
            <Link
              to="/platform"
              className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              See the platform <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ol className="space-y-5">
            {steps.map((s) => (
              <li key={s.n} className="surface-card flex gap-5 p-6">
                <span className="font-mono text-sm text-cinematic">{s.n}</span>
                <div>
                  <h3 className="text-base font-semibold">{s.t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-y border-border bg-secondary/30">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-3xl font-semibold md:text-5xl">Use cases.</h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {useCases.map((u, i) => (
              <Reveal key={u} delay={(i % 4) * 80} className="surface-card lift p-6 text-sm font-medium">
                {u}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-3xl font-semibold md:text-5xl">Why DACEXY is different.</h2>
        <div className="mt-12 grid gap-4 md:grid-cols-5">
          {differences.map(([name, desc]) => {
            const isDex = name === "DACEXY";
            return (
              <div
                key={name}
                className={
                  isDex
                    ? "gradient-border surface-card p-6 shadow-[var(--shadow-float)]"
                    : "surface-card p-6"
                }
              >
                <h3 className={isDex ? "font-display text-base font-semibold text-cinematic" : "font-display text-base font-semibold"}>
                  {name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((r) => (
            <div key={r} className="lift flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 text-sm">
              <Check className="h-4 w-4 shrink-0 text-primary" />
              {r}
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card/60">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-3xl font-semibold md:text-5xl">What early teams say.</h2>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Feedback from the beta program — measurable hours returned to the business.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.q} className="surface-card lift p-7">
                <blockquote className="text-sm leading-relaxed">&ldquo;{t.q}&rdquo;</blockquote>
                <figcaption className="mt-6 text-sm">
                  <span className="font-medium">{t.a}</span>
                  <span className="block text-muted-foreground">{t.r}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-24">
        <h2 className="text-3xl font-semibold md:text-5xl">Frequently asked.</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {faqs.map(([q, a]) => (
            <div key={q} className="surface-card lift p-6">
              <h3 className="text-base font-semibold">{q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a}</p>
            </div>
          ))}
        </div>
      </section>

      <DownloadSection />

      <section className="px-6 py-24">
        <div
          className="flow-gradient relative mx-auto max-w-6xl overflow-hidden rounded-3xl px-8 py-20 text-center shadow-[var(--shadow-float)]"
          style={{ backgroundImage: "var(--gradient-cinematic)" }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay [mask-image:radial-gradient(ellipse_80%_70%_at_50%_50%,black,transparent_80%)]"
            aria-hidden="true"
          >
            <AsciiField />
          </div>
          <h2 className="relative text-4xl font-semibold text-primary-foreground md:text-5xl">
            Stop working like it&apos;s 2020.
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-primary-foreground/80">
            Let DACEXY become your AI employee and automate your business.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/pricing"
              className="rounded-xl bg-card px-6 py-3 font-mono text-sm font-medium text-foreground transition-opacity hover:opacity-90"
            >
              Start free today
            </Link>
            <Link
              to="/contact"
              className="rounded-xl border border-primary-foreground/40 px-6 py-3 font-mono text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10"
            >
              Talk to sales
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
