import dMark from "@/assets/dacexy-mark.png";
import { cn } from "@/lib/utils";

export function BrandMark({ className, glow = false }: { className?: string; glow?: boolean }) {
  return (
    <span className={cn("relative inline-grid place-items-center", className)}>
      {glow && <span aria-hidden="true" className="halo-glow pointer-events-none absolute inset-0 -z-10 rounded-full blur-2xl" />}
      <img src={dMark} alt="Dacexy AI logo mark" className="h-full w-full object-contain" loading="eager" decoding="async" />
    </span>
  );
}
