import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ArrowRight } from "lucide-react";

const TITLE = "Capabilities — Everything DACEXY can do for your business";
const DESCRIPTION =
  "Research, browse, write documents, generate reports, automate desktop and browser, organise files, analyse data, verify outputs and deliver completed work.";

export const Route = createFileRoute("/capabilities")({
  component: CapabilitiesPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "/capabilities" },
    ],
    links: [{ rel: "canonical", href: "/capabilities" }],
  }),
});

const groups: { title: string; items: string[] }[] = [
  {
    title: "Desktop automation",
    items: [
      "Mouse control",
      "Keyboard automation",
      "Opening software",
      "Managing files",
      "Creating folders",
      "Editing documents",
      "Taking screenshots",
      "Reading screen content",
      "OCR",
      "Clipboard operations",
    ],
  },
  {
    title: "Browser automation",
    items: [
      "Login",
      "Fill forms",
      "Search information",
      "Navigate dashboards",
      "Download reports",
      "Upload files",
      "Collect data",
      "Monitor websites",
    ],
  },
  {
    title: "Document intelligence",
    items: [
      "Business plans",
      "Proposals",
      "Reports",
      "Meeting notes",
      "Contracts",
      "Invoices",
      "Presentations",
      "Research summaries",
      "SOPs",
      "Marketing strategies",
    ],
  },
  {
    title: "File intelligence",
    items: [
      "PDF",
      "Word",
      "Excel",
      "CSV",
      "Images",
      "Text files",
      "Read, analyse and modify",
      "Organise, search and export",
    ],
  },
  {
    title: "Vision system",
    items: ["Screenshot analysis", "OCR", "UI understanding", "Image analysis"],
  },
  {
    title: "Business intelligence",
    items: [
      "Marketing",
      "Sales",
      "Finance",
      "Customer support",
      "Operations",
      "HR",
      "Strategy",
      "Research",
      "Analytics",
    ],
  },
];

const workflow = [
  "Understand the objective",
  "Research CRM platforms",
  "Collect pricing and features",
  "Compare competitors",
  "Generate a structured report",
  "Format the document professionally",
  "Export it as a PDF",
  "Create a project folder",
  "Save the report",
  "Verify the PDF exists and is complete",
  "Deliver the finished result",
];

function CapabilitiesPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="aurora-backdrop pointer-events-none absolute inset-x-0 top-0 h-[420px]" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center">
          <h1 className="text-5xl font-semibold md:text-6xl">
            Everything DACEXY <span className="text-cinematic">can do</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Conversational AI, autonomous reasoning, desktop automation, browser automation,
            document generation and business intelligence in one unified system.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <div key={g.title} className="surface-card lift p-7">
              <h2 className="font-display text-lg font-semibold">{g.title}</h2>
              <ul className="mt-5 space-y-2.5 text-sm text-muted-foreground">
                {g.items.map((i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-secondary/30">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-semibold md:text-4xl">One instruction, eleven steps</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            &ldquo;Research the best CRM software for small businesses, compare five options, create a
            detailed report with pricing, save it as a PDF, and organise it into a new folder.&rdquo;
          </p>
          <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {workflow.map((w, i) => (
              <li key={w} className="surface-card flex gap-4 p-5 text-sm">
                <span className="font-mono text-xs text-cinematic">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {w}
              </li>
            ))}
          </ol>
          <p className="mt-8 text-sm text-muted-foreground">
            You receive the completed report — not a chat response to copy and paste.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="text-3xl font-semibold md:text-4xl">Put it to work today</h2>
        <Link
          to="/pricing"
          className="flow-gradient mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-float)] transition-opacity hover:opacity-90"
          style={{ backgroundImage: "var(--gradient-cinematic)" }}
        >
          Start free <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </>
  );
}
