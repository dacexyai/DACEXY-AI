import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Workflow,
  Brain,
  ShieldCheck,
  Activity,
  Layers,
  Boxes,
  MonitorCog,
  Globe,
  FileText,
  Eye,
  RefreshCcw,
  ArrowRight,
} from "lucide-react";

const TITLE = "Platform — How DACEXY plans, executes and verifies work";
const DESCRIPTION =
  "Inside DACEXY: agent brain, intelligent planner, AI provider cascade, desktop and browser automation, document intelligence, verification and recovery.";

export const Route = createFileRoute("/platform")({
  component: PlatformPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: "/platform" },
    ],
    links: [{ rel: "canonical", href: "/platform" }],
  }),
});

const pipeline = [
  "User Request",
  "Intent Understanding",
  "Mission Planning",
  "Research",
  "Execution",
  "Verification",
  "Recovery (if needed)",
  "Final Delivery",
];

const layers = [
  {
    icon: Brain,
    title: "Agent Brain",
    body: "Understands what you actually want — goal, context, required tools, expected output and success criteria — instead of matching keywords.",
  },
  {
    icon: Workflow,
    title: "Intelligent Planner",
    body: "Turns the goal into a structured mission plan with ordered steps, so tools are never called at random.",
  },
  {
    icon: Layers,
    title: "AI Provider Cascade",
    body: "DeepSeek → Gemini → Claude → GPT → Ollama → rule engine. If one provider fails, the mission continues without interruption.",
  },
  {
    icon: MonitorCog,
    title: "Desktop Automation",
    body: "Mouse and keyboard control, opening software, files and folders, editing documents, screenshots, screen reading, OCR and clipboard.",
  },
  {
    icon: Globe,
    title: "Browser Automation",
    body: "Logs in, fills forms, searches, navigates dashboards, downloads reports, uploads files, collects data and monitors websites.",
  },
  {
    icon: FileText,
    title: "Document & File Intelligence",
    body: "Reads and writes PDF, Word, Excel, CSV, images and text — analysing, modifying, organising and exporting real deliverables.",
  },
  {
    icon: Eye,
    title: "Vision System",
    body: "Screenshot analysis, OCR, UI understanding and image analysis, so DACEXY can operate apps that expose no API.",
  },
  {
    icon: Activity,
    title: "Mission Verification",
    body: "Checks the file was created, the task finished, the output is correct and quality standards are met — before calling it done.",
  },
  {
    icon: RefreshCcw,
    title: "Recovery Engine",
    body: "Detects a failure, finds the cause, forms a new execution strategy and continues. You never restart the task.",
  },
  {
    icon: Boxes,
    title: "Memory System",
    body: "Holds the conversation, current objective, generated files, completed steps and your preferences across long workflows.",
  },
  {
    icon: ShieldCheck,
    title: "Safety Layer",
    body: "Validates permissions, resources, target application state and execution readiness before any sensitive action runs.",
  },
  {
    icon: Globe,
    title: "Business Intelligence",
    body: "Marketing, sales, finance, support, operations, HR, strategy, research and analytics — completed as workflows, not answers.",
  },
];

const missionPlan = [
  "Mission",
  "Research company",
  "Collect information",
  "Analyze information",
  "Generate proposal",
  "Format document",
  "Export PDF",
  "Verify file",
  "Deliver",
];

const useCases = [
  ["Marketing & sales", "Campaign plans, outreach sequences, competitor pricing sheets and pipeline reporting delivered as files."],
  ["Finance & admin", "Invoices, contracts, expense summaries and spreadsheet analysis produced and filed automatically."],
  ["Operations", "Repetitive desktop and browser workflows executed end to end, verified and logged."],
  ["Research & strategy", "Market studies, SWOT, vendor comparisons and investor-ready reports with sources checked."],
];

function PlatformPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="aurora-backdrop pointer-events-none absolute inset-x-0 top-0 h-[420px]" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center">
          <h1 className="text-5xl font-semibold md:text-6xl">
            The runtime behind every <span className="text-cinematic">autonomous</span> mission.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            DACEXY understands goals, creates execution plans, uses tools, verifies results and
            delivers finished business work across your computer and the web.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-3xl font-semibold md:text-4xl">One execution pipeline</h2>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Every task follows the same lifecycle — which is why the output is a deliverable, not a
          guess.
        </p>
        <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {pipeline.map((p, i) => (
            <li key={p} className="surface-card lift p-5">
              <span className="font-mono text-xs text-cinematic">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="mt-2 text-sm font-medium">{p}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {layers.map(({ icon: Icon, title, body }) => (
            <div key={title} className="surface-card lift p-7">
              <span
                className="flow-gradient inline-grid h-10 w-10 place-items-center rounded-lg text-primary-foreground"
                style={{ backgroundImage: "var(--gradient-cinematic)" }}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h2 className="mt-5 text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-secondary/30">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-semibold md:text-4xl">A mission plan, not a prompt</h2>
              <p className="mt-4 text-muted-foreground">
                Ask for a business proposal and DACEXY recognises it needs research, writing,
                document generation and export — then builds the workflow before touching a tool.
              </p>
            </div>
            <ol className="surface-card space-y-3 p-7">
              {missionPlan.map((m, i) => (
                <li key={m} className="flex items-center gap-3 text-sm">
                  <span className="font-mono text-xs text-cinematic">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{m}</span>
                  {i < missionPlan.length - 1 && (
                    <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/50" />
                  )}
                </li>
              ))}
            </ol>
          </div>

          <h2 className="mt-20 text-3xl font-semibold md:text-4xl">Where businesses point it first</h2>
          <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2">
            {useCases.map(([t, d]) => (
              <div key={t} className="bg-card p-8">
                <h3 className="text-lg font-semibold">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="text-3xl font-semibold md:text-4xl">See it run on your business</h2>
        <p className="mt-4 text-muted-foreground">
          We&apos;ll run DACEXY against a real task from your business, live.
        </p>
        <Link
          to="/contact"
          className="flow-gradient mt-8 inline-block rounded-xl px-6 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-float)] transition-opacity hover:opacity-90"
          style={{ backgroundImage: "var(--gradient-cinematic)" }}
        >
          Book a demo
        </Link>
      </section>
    </>
  );
}