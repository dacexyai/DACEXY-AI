import { Link } from "@tanstack/react-router";
import { Monitor, Download, ShieldCheck, Cpu } from "lucide-react";
import { Reveal } from "./reveal";

const WINDOWS_URL = (import.meta.env.VITE_DESKTOP_DOWNLOAD_URL as string | undefined)?.trim() || "";

export const DOWNLOADS = {
  windows: {
    label: "Download for Windows",
    meta: "Windows 10 & 11 · 64-bit",
    href: WINDOWS_URL,
    download: "DACEXY-AI-Setup.exe",
    icon: Monitor,
  },
} as const;

export function DownloadSection({ compact = false }: { compact?: boolean }) {
  return (
    <section id="download" className="relative overflow-hidden border-y border-border bg-secondary/30">
      <div className="aurora-backdrop animate-drift pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6 py-24">
        <Reveal className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs text-muted-foreground shadow-[var(--shadow-card)]">
            <Download className="h-3.5 w-3.5 text-primary" />
            Desktop agent · v1.0.1
          </span>
          <h2 className="mt-6 text-3xl font-semibold md:text-5xl">Download the <span className="shine-text">DACEXY agent</span>.</h2>
          <p className="mt-4 text-muted-foreground">The desktop agent runs locally and connects to the DACEXY gateway on your machine.</p>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Reveal>
            {WINDOWS_URL ? (
              <a href={WINDOWS_URL} download="DACEXY-AI-Setup.exe" className="gradient-border surface-card group flex h-full items-center gap-5 p-7 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-float)]">
                <span className="flow-gradient inline-grid h-14 w-14 shrink-0 place-items-center rounded-xl text-primary-foreground" style={{ backgroundImage: "var(--gradient-cinematic)" }}>
                  <Monitor className="h-7 w-7" strokeWidth={1.6} />
                </span>
                <span className="min-w-0">
                  <span className="block text-lg font-semibold">Download for Windows</span>
                  <span className="mt-1 block text-sm text-muted-foreground">Windows 10 & 11 · 64-bit</span>
                </span>
                <Download className="ml-auto h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary" />
              </a>
            ) : (
              <div className="surface-card flex items-center gap-5 p-7 opacity-90">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-border bg-card"><Monitor className="h-7 w-7 text-primary" /></span>
                <span><span className="block text-lg font-semibold">Windows installer</span><span className="mt-1 block text-sm text-muted-foreground">Set VITE_DESKTOP_DOWNLOAD_URL in Vercel to publish the .exe.</span></span>
              </div>
            )}
          </Reveal>
        </div>

        {!compact && (
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              [ShieldCheck, "Authenticated", "Desktop sign-in uses the same DACEXY backend account."],
              [Cpu, "Runs locally", "Desktop automation communicates with the local gateway."],
              [Download, "One installer", "Publish the verified Windows installer through Vercel."],
            ].map(([Icon, t, d], i) => {
              const I = Icon as typeof ShieldCheck;
              return <Reveal key={t as string} delay={i * 100}><div className="surface-card flex h-full items-start gap-3 p-5 text-sm"><I className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span><span className="block font-medium">{t as string}</span><span className="text-muted-foreground">{d as string}</span></span></div></Reveal>;
            })}
          </div>
        )}

        <p className="mt-8 text-sm text-muted-foreground">Need a managed rollout? <Link to="/contact" className="text-primary hover:underline">Talk to sales</Link>.</p>
      </div>
    </section>
  );
}
