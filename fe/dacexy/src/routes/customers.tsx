import { createFileRoute, Link } from "@tanstack/react-router";

const TITLE = "Customers — Engineering teams building with Dacexy AI";
const DESCRIPTION =
  "How fintech, infrastructure and marketplace teams use Dacexy AI agents to cut cycle time and clear engineering backlogs.";

export const Route = createFileRoute("/customers")({
  component: CustomersPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: "/customers" },
    ],
    links: [{ rel: "canonical", href: "/customers" }],
  }),
});

const stories = [
  {
    company: "Heliospay",
    sector: "Payments infrastructure",
    metric: "4.2x",
    metricLabel: "faster migration delivery",
    quote:
      "We moved 340 services onto a new SDK in six weeks. Dacexy opened the PRs, we reviewed them. Nobody worked a weekend.",
    person: "Ana Ferraro, VP Engineering",
  },
  {
    company: "Northwind",
    sector: "Logistics",
    metric: "68%",
    metricLabel: "of agent PRs merged unedited",
    quote:
      "The reasoning trace is what sold our staff engineers. They can see exactly why every line changed.",
    person: "Daniel Okoye, Principal Engineer",
  },
  {
    company: "Atlas Bank",
    sector: "Financial services",
    metric: "0",
    metricLabel: "code leaving our VPC",
    quote:
      "Air-gapped deployment plus policy gates got us through risk review in one cycle instead of three.",
    person: "Priya Raghavan, Head of Platform",
  },
];

function CustomersPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="aurora-backdrop pointer-events-none absolute inset-x-0 top-0 h-[380px]" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl px-6 py-20 text-center">
          <h1 className="text-5xl font-semibold md:text-6xl">
            Teams that already <span className="text-cinematic">delegate</span>.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            From seed-stage teams to regulated banks, engineers use Dacexy to spend their hours on
            the decisions that matter.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-6 px-6 py-16">
        {stories.map((s) => (
          <article key={s.company} className="surface-card grid gap-8 p-8 md:grid-cols-[220px_1fr] md:p-10">
            <div>
              <div className="font-display text-4xl font-semibold text-cinematic">{s.metric}</div>
              <div className="mt-2 text-sm text-muted-foreground">{s.metricLabel}</div>
              <div className="mt-6 text-xs tracking-[0.18em] text-muted-foreground uppercase">
                {s.sector}
              </div>
              <div className="mt-1 font-display text-lg font-semibold">{s.company}</div>
            </div>
            <blockquote className="border-l border-border pl-8">
              <p className="text-xl leading-relaxed">“{s.quote}”</p>
              <footer className="mt-5 text-sm text-muted-foreground">{s.person}</footer>
            </blockquote>
          </article>
        ))}
      </section>

      <section className="border-t border-border bg-secondary/30">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-3xl font-semibold md:text-4xl">Your team could be next</h2>
          <Link
            to="/contact"
            className="flow-gradient mt-8 inline-block rounded-xl px-6 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-float)] transition-opacity hover:opacity-90"
            style={{ backgroundImage: "var(--gradient-cinematic)" }}
          >
            Talk to sales
          </Link>
        </div>
      </section>
    </>
  );
}