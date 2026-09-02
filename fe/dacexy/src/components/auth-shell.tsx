import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

const points = [
  "Autonomous missions across desktop, browser and files",
  "Documents, decks and websites delivered finished",
  "Memory of your business, projects and preferences",
  "Works 24/7 — no prompt engineering required",
];

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden">
      <div className="aurora-backdrop animate-drift pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="grid-backdrop pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl gap-14 px-6 py-20 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        <div className="hidden lg:block">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs text-muted-foreground shadow-[var(--shadow-card)]">
            <span className="h-1.5 w-1.5 rounded-full bg-primary pulse-ring" />
            {eyebrow}
          </span>
          <h1 className="mt-7 text-4xl leading-[1.08] font-semibold md:text-5xl">
            Your AI employee is <span className="shine-text">one login away</span>.
          </h1>
          <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {p}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-muted-foreground">
            Already installed the agent?{" "}
            <Link to="/download" className="text-primary hover:underline">
              Get the latest build
            </Link>
          </p>
        </div>

        <div className="gradient-border surface-card animate-float p-8 shadow-[var(--shadow-float)] md:p-10">
          <h2 className="font-display text-2xl font-semibold">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          {children}
          <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
        </div>
      </div>
    </section>
  );
}

export function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input
        {...props}
        className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/25"
      />
    </label>
  );
}
