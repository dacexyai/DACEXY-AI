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
    name: "Starter",
    price: "$0",
    cadence: "forever",
    blurb: "For freelancers trying an AI employee for the first time.",
    features: ["50 autonomous tasks / month", "AI chat + document generation", "Browser automation", "Bring your own model keys"],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Business",
    price: "$99",
    cadence: "per workspace / month",
    blurb: "For small businesses and startups running daily operations.",
    features: [
      "Unlimited autonomous tasks",
      "Desktop + browser automation",
      "Website, image and video generation",
      "Voice assistant and long-term memory",
      "Multi-AI engine with auto switching",
      "Priority support",
    ],
    cta: "Start 14-day trial",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "annual agreement",
    blurb: "For agencies and teams deploying AI employees at scale.",
    features: [
      "Multiple AI employees and shared workflows",
      "Private or on-premise deployment",
      "SSO, audit trail and data residency",
      "Local Ollama models supported",
      "99.99% uptime SLA",
      "Named success manager",
    ],
    cta: "Talk to sales",
    featured: false,
  },
];

const faqs = [
  ["What counts as a task?", "One instruction taken from goal to finished deliverable, however many research, browser and desktop steps it takes."],
  ["Do you train on our data?", "Never. Your files, documents and business data are never used for training, on any plan."],
  ["Which AI models are included?", "DeepSeek, Claude, GPT, Gemini and local Ollama models, selected automatically per task."],
  ["Cheaper than hiring?", "A full-time assistant costs thousands a month. DACEXY works 24/7 for a fraction of one salary."],
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
            Works 24/7. Never gets tired. Costs a fraction of a monthly salary — for unlimited business tasks.
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