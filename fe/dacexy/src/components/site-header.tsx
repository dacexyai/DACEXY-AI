import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

const nav = [
  { to: "/chat", label: "Business Advisor" },
  { to: "/platform", label: "Platform" },
  { to: "/capabilities", label: "Capabilities" },
  { to: "/solutions", label: "Solutions" },
  { to: "/pricing", label: "Pricing" },
  { to: "/customers", label: "Customers" },
  { to: "/company", label: "Company" },
  { to: "/download", label: "Download" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <BrandMark className="h-8 w-8 transition-transform duration-500 hover:scale-110" glow />
          <span className="font-display text-[16px] font-semibold tracking-tight">Dacexy AI</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground lg:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeProps={{ className: "text-foreground font-medium" }}
              className="transition-colors hover:text-foreground"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <BrandMark className="h-7 w-7 opacity-90" />
          <Link
            to="/login"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            to="/download"
            className="sheen flow-gradient rounded-lg px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5"
            style={{ backgroundImage: "var(--gradient-cinematic)" }}
          >
            Download
          </Link>
        </div>

        <button
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setOpen((v) => !v)}
          className="rounded-md border border-border p-2 lg:hidden"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-6 py-4 lg:hidden">
          <div className="flex flex-col gap-4 text-sm">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)}>
                {n.label}
              </Link>
            ))}
            <Link to="/login" onClick={() => setOpen(false)}>
              Sign in
            </Link>
            <Link to="/signup" onClick={() => setOpen(false)}>
              Create account
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}