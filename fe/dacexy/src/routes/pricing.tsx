import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

const TITLE = "Pricing — Dacexy AI, Your AI Employee";
const DESCRIPTION =
  "Instead of hiring another employee, hire DACEXY. Free to start, then a fraction of a monthly salary for unlimited autonomous business tasks.";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: "/pricing" },
    ],
    links: [{ rel: "canonical", href: "/pricing" }],
  }),
});

const plans = [
  {
    name: "Free",
    price: "₹0",
    cadence: "forever",
    blurb: "Try DACEXY with a protected weekly AI-work budget.",
    features: ["₹5/week DACEXY provider-cost budget", "Real agent task execution", "Browser + desktop automation", "Files, research and business workflows"],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Business",
    price: "₹1,999",
    cadence: "per month",
    blurb: "For businesses running DACEXY every day.",
    features: ["₹250/month provider-cost safety budget", "Long-running tasks up to 30 minutes", "Up to 3 concurrent tasks", "Browser + desktop automation", "Business memory and workflows", "Priority support"],
    cta: "Start Business",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "₹9,999",
    cadence: "per month",
    blurb: "For teams that need higher limits and parallel work.",
    features: ["₹1,000/month provider-cost safety budget", "Long-running tasks up to 60 minutes", "Up to 8 concurrent tasks", "Advanced automation and workflows", "Enterprise deployment controls", "Priority support"],
    cta: "Start Enterprise",
    featured: false,
  },
];

const faqs = [
  ["What counts as a task?", "One instruction taken from goal to finished deliverable, however many research, browser and desktop steps it takes."],
  ["Do you train on our data?", "Never. Your files, documents and business data are never used for training, on any plan."],
  ["Which AI models are included?", "DeepSeek, Claude, GPT, Gemini and local Ollama models, selected automatically per task."],
  ["How does the cost protection work?", "Each plan has a provider-cost safety budget. DACEXY admits tasks while budget remains and does not impose an arbitrary tiny task-count quota."],
];

function PricingPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="aurora-backdrop pointer-events-none absolute inset-x-0 top-0 h-[380px]" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl px-6 py-20 text-center">
          <h1 className="text-5xl font-semibold md:text-6xl">
            Hire an employee, not another <span className="text-cinematic">AI tool</span>.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Works 24/7. Long task limits, real computer work, and built-in provider-cost protection.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={
                p.featured
                  ? "gradient-border surface-card relative p-8 shadow-[var(--shadow-float)]"
                  : "surface-card lift p-8"
              }
            >
              {p.featured && (
                <span
                  className="flow-gradient absolute -top-3 left-8 rounded-full px-3 py-1 text-[11px] font-medium text-primary-foreground"
                  style={{ backgroundImage: "var(--gradient-cinematic)" }}
                >
                  Most popular
                </span>
              )}
              <h2 className="text-lg font-semibold">{p.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{p.blurb}</p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-display text-4xl font-semibold">{p.price}</span>
                <span className="text-sm text-muted-foreground">{p.cadence}</span>
              </div>
              <ul className="mt-7 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/contact"
                className={
                  p.featured
                    ? "flow-gradient mt-8 block rounded-xl px-5 py-3 text-center text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                    : "mt-8 block rounded-xl border border-border px-5 py-3 text-center text-sm font-medium transition-colors hover:bg-secondary"
                }
                style={p.featured ? { backgroundImage: "var(--gradient-cinematic)" } : undefined}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-secondary/30">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <h2 className="text-3xl font-semibold">Frequently asked</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {faqs.map(([q, a]) => (
              <div key={q} className="surface-card lift p-6">
                <h3 className="text-base font-semibold">{q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}