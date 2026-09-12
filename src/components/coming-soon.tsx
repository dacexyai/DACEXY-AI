import { Clock } from "lucide-react";

export function ComingSoonBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground shadow-[var(--shadow-card)] ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-primary pulse-ring" />
      Desktop agent &amp; app — coming soon
    </span>
  );
}

export function ComingSoonNote({ className = "" }: { className?: string }) {
  return (
    <p className={`flex items-start gap-2 text-sm text-muted-foreground ${className}`}>
      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <span>
        The DACEXY desktop agent and desktop app are <span className="text-foreground">coming soon</span>. Until then,
        chat with DACEXY right here on the web.
      </span>
    </p>
  );
}
