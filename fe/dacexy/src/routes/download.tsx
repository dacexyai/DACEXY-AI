import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ArrowRight } from "lucide-react";
import { DownloadSection } from "@/components/download-section";
import { Reveal } from "@/components/reveal";

const TITLE = "Download Dacexy AI — macOS & Windows Agent";
const DESCRIPTION =
  "Download the Dacexy AI desktop agent for macOS and Windows. Install in under a minute and let your AI employee run desktop, browser and document work locally.";

export const Route = createFileRoute("/download")({
  component: DownloadPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const requirements = [
  ["macOS", "macOS 13 Ventura or newer · Apple Silicon or Intel · 8 GB RAM"],
  ["Windows", "Windows 10 (21H2) or Windows 11 · 64-bit · 8 GB RAM"],
  ["Network", "Outbound HTTPS · optional local Ollama for offline models"],
  ["Permissions", "Accessibility and screen recording for desktop control"],
];

const install = [
  ["01", "Download the installer", "Pick macOS or Windows above."],
  ["02", "Grant permissions", "Approve accessibility so the agent can act for you."],
  ["03", "Sign in", "Use your Dacexy account to sync memory and projects."],
  ["04", "Give it a mission", "Type or say what you need — it does the rest."],
];

function DownloadPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="aurora-backdrop animate-drift pointer-events-none absolute inset-x-0 top-0 h-[420px]" aria-hidden="true" />
        <div className="grid-backdrop pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl px-6 pt-24 pb-8 text-center">
          <h1 className="text-4xl leading-[1.08] font-semibold md:text-6xl">
            Get your <span className="shine-text">AI employee</span> on your desktop.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            One install. Desktop automation, browser automation, documents, research and voice —
            running on your machine.
          </p>
        </div>
      </section>

      <DownloadSection />

      <section className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <h2 className="text-3xl font-semibold md:text-4xl">Installation in four steps.</h2>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-4">
          {install.map(([n, t, d], i) => (
            <Reveal key={n} delay={i * 90}>
              <div className="surface-card h-full p-6">
                <span className="font-mono text-sm text-cinematic">{n}</span>
                <h3 className="mt-3 text-base font-semibold">{t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-card/60">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal>
            <h2 className="text-3xl font-semibold md:text-4xl">System requirements.</h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {requirements.map(([t, d], i) => (
              <Reveal key={t} delay={i * 80}>
                <div className="surface-card flex h-full items-start gap-3 p-6">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <span className="block text-sm font-semibold">{t}</span>
                    <span className="text-sm text-muted-foreground">{d}</span>
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
          <Link
            to="/signup"
            className="flow-gradient mt-10 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-float)] transition-opacity hover:opacity-90"
            style={{ backgroundImage: "var(--gradient-cinematic)" }}
          >
            Create your account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
