import { createFileRoute, Link } from "@tanstack/react-router";

const TITLE = "Company — About Dacexy AI";
const DESCRIPTION =
  "Dacexy AI is building the autonomous engineer: our mission, principles, milestones and the team behind the platform.";

export const Route = createFileRoute("/company")({
  component: CompanyPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: "/company" },
    ],
    links: [{ rel: "canonical", href: "/company" }],
  }),
});

const principles = [
  ["Review is sacred", "Autonomy without a readable diff is just risk. Every agent output is built to be reviewed."],
  ["Your code stays yours", "No training on customer repositories. Ever. Deployment choice is a first-class feature."],
  ["Boring reliability", "Agents are only useful if the platform never blinks. We engineer for the 99.99%."],
  ["Engineers, amplified", "We automate the typing, not the judgement. The best teams get faster, not smaller."],
];

const milestones = [
  ["2023", "Founded in San Francisco by four infrastructure engineers."],
  ["2024", "Private beta with 40 design partners; 100k agent runs."],
  ["2025", "General availability, SOC 2 Type II, VPC deployment."],
  ["2026", "$180M Series B; 3.1M pull requests shipped by Dacexy agents."],
];

function CompanyPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="aurora-backdrop pointer-events-none absolute inset-x-0 top-0 h-[380px]" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl px-6 py-20 text-center">
          <h1 className="text-5xl font-semibold md:text-6xl">
            We are building the <span className="text-cinematic">autonomous engineer</span>.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            A team of 190 across San Francisco, London and Bengaluru, obsessed with what software
            delivery looks like when execution stops being the bottleneck.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-3xl font-semibold md:text-4xl">Principles</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {principles.map(([t, d]) => (
            <div key={t} className="surface-card lift p-8">
              <h3 className="text-lg font-semibold">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-secondary/30">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <h2 className="text-3xl font-semibold md:text-4xl">Milestones</h2>
          <ol className="mt-10 space-y-6">
            {milestones.map(([y, d]) => (
              <li key={y} className="flex gap-8 border-b border-border pb-6 last:border-0">
                <span className="font-mono text-sm text-cinematic">{y}</span>
                <p className="text-muted-foreground">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="text-3xl font-semibold md:text-4xl">Come build with us</h2>
        <p className="mt-4 text-muted-foreground">
          We hire engineers who care about correctness as much as speed.
        </p>
        <Link
          to="/contact"
          className="flow-gradient mt-8 inline-block rounded-xl px-6 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-float)] transition-opacity hover:opacity-90"
          style={{ backgroundImage: "var(--gradient-cinematic)" }}
        >
          Get in touch
        </Link>
      </section>
    </>
  );
}