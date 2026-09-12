import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Store,
  Rocket,
  User,
  Users,
  TrendingUp,
  Megaphone,
  Briefcase,
  Settings2,
  Crown,
  ArrowRight,
} from "lucide-react";

const TITLE = "Solutions — DACEXY for owners, startups, agencies and teams";
const DESCRIPTION =
  "How small business owners, startups, freelancers, agencies, sales, marketing, consultants, operations managers and founders put DACEXY to work.";

export const Route = createFileRoute("/solutions")({
  component: SolutionsPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "/solutions" },
    ],
    links: [{ rel: "canonical", href: "/solutions" }],
  }),
});

const audiences = [
  { icon: Store, title: "Small business owners", body: "Back-office admin, invoicing, supplier research and reporting handled without another hire." },
  { icon: Rocket, title: "Startups", body: "Investor decks, business plans, market research and go-to-market assets produced in an afternoon." },
  { icon: User, title: "Freelancers", body: "Proposals, contracts and client reports generated, formatted and delivered while you bill hours." },
  { icon: Users, title: "Agencies", body: "Campaign plans, competitor audits and client deliverables at scale across every account." },
  { icon: TrendingUp, title: "Sales teams", body: "Prospect research, outreach sequences, CRM data entry and pipeline summaries on autopilot." },
  { icon: Megaphone, title: "Marketing teams", body: "Content calendars, SEO research, creative briefs and performance reporting end to end." },
  { icon: Briefcase, title: "Consultants", body: "Deep research, SWOT analysis and client-ready reports with sources verified before delivery." },
  { icon: Settings2, title: "Operations managers", body: "Repetitive desktop and browser workflows executed, verified and logged every single day." },
  { icon: Crown, title: "Founders", body: "One instruction replaces a to-do list — DACEXY plans, executes and hands back finished work." },
];

const differences: [string, string[]][] = [
  [
    "Most AI assistants",
    ["Answer questions", "Generate text", "Require you to do the actual work"],
  ],
  [
    "DACEXY",
    [
      "Understands objectives",
      "Plans workflows",
      "Uses the right tools",
      "Automates desktop and browser tasks",
      "Generates professional deliverables",
      "Verifies results",
      "Recovers from failures",
      "Completes end-to-end business tasks autonomously",
    ],
  ],
];

function SolutionsPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="aurora-backdrop pointer-events-none absolute inset-x-0 top-0 h-[420px]" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center">
          <h1 className="text-5xl font-semibold md:text-6xl">
            An AI employee for <span className="text-cinematic">every business</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Give every team an agent that can think, plan, execute, verify and deliver real work
            24/7.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {audiences.map(({ icon: Icon, title, body }) => (
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
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-3xl font-semibold md:text-4xl">What makes DACEXY different</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {differences.map(([name, items], idx) => (
              <div
                key={name}
                className={
                  idx === 1
                    ? "gradient-border surface-card p-8 shadow-[var(--shadow-float)]"
                    : "surface-card lift p-8"
                }
              >
                <h3
                  className={
                    idx === 1
                      ? "font-display text-lg font-semibold text-cinematic"
                      : "font-display text-lg font-semibold"
                  }
                >
                  {name}
                </h3>
                <ul className="mt-5 space-y-2.5 text-sm text-muted-foreground">
                  {items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="text-3xl font-semibold md:text-4xl">Find your workflow</h2>
        <p className="mt-4 text-muted-foreground">
          Tell us the task that eats your week. We&apos;ll show you DACEXY finishing it.
        </p>
        <Link
          to="/contact"
          className="flow-gradient mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-float)] transition-opacity hover:opacity-90"
          style={{ backgroundImage: "var(--gradient-cinematic)" }}
        >
          Talk to us <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </>
  );
}
