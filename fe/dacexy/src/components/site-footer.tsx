import { Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/brand-mark";

const columns = [
  {
    title: "Product",
    links: [
      { to: "/platform", label: "Platform" },
      { to: "/capabilities", label: "Capabilities" },
      { to: "/solutions", label: "Solutions" },
      { to: "/pricing", label: "Pricing" },
      { to: "/customers", label: "Customers" },
      { to: "/download", label: "Download" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/company", label: "About" },
      { to: "/contact", label: "Contact" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-8 w-8" />
            <span className="font-display text-[16px] font-semibold">Dacexy AI</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            The autonomous AI employee that thinks, plans, executes, verifies and delivers real
            business work 24/7.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold">{col.title}</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="transition-colors hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Dacexy AI, Inc. All rights reserved.</span>
          <span>SOC 2 Type II · ISO 27001 · GDPR ready</span>
        </div>
      </div>
    </footer>
  );
}