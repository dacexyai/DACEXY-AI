import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

const TITLE = "Contact — Talk to the Dacexy AI team";
const DESCRIPTION =
  "Book a demo, ask about enterprise deployment, or get help onboarding your engineering team onto Dacexy AI.";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
});

const inputClass =
  "mt-2 w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring/40";

function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="aurora-backdrop pointer-events-none absolute inset-x-0 top-0 h-[340px]" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl px-6 py-20 text-center">
          <h1 className="text-5xl font-semibold md:text-6xl">
            Let&apos;s talk <span className="text-cinematic">delivery</span>.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Tell us about your stack and we&apos;ll show Dacexy working on it within 48 hours.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-12 px-6 py-16 md:grid-cols-[1.2fr_0.8fr]">
        <form
          className="surface-card p-8"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
            toast.success("Thanks — our team will reply within one business day.");
          }}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Full name
              <input required name="name" className={inputClass} placeholder="Ada Lovelace" />
            </label>
            <label className="block text-sm font-medium">
              Work email
              <input
                required
                type="email"
                name="email"
                className={inputClass}
                placeholder="ada@company.com"
              />
            </label>
          </div>
          <label className="mt-5 block text-sm font-medium">
            Company
            <input required name="company" className={inputClass} placeholder="Company Inc." />
          </label>
          <label className="mt-5 block text-sm font-medium">
            What are you hoping to automate?
            <textarea
              required
              name="message"
              rows={5}
              className={inputClass}
              placeholder="We have 200 services on an old framework version…"
            />
          </label>
          <button
            type="submit"
            className="flow-gradient mt-6 w-full rounded-xl px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            style={{ backgroundImage: "var(--gradient-cinematic)" }}
          >
            {sent ? "Request received" : "Request a demo"}
          </button>
        </form>

        <div className="space-y-8 text-sm">
          <div>
            <h2 className="font-display text-base font-semibold">Sales</h2>
            <p className="mt-2 text-muted-foreground">sales@dacexy.ai</p>
          </div>
          <div>
            <h2 className="font-display text-base font-semibold">Support</h2>
            <p className="mt-2 text-muted-foreground">support@dacexy.ai · 24/7 on Team and above</p>
          </div>
          <div>
            <h2 className="font-display text-base font-semibold">Offices</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              San Francisco · London · Bengaluru
            </p>
          </div>
          <div>
            <h2 className="font-display text-base font-semibold">Security</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              SOC 2 Type II, ISO 27001 and GDPR documentation available on request.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}