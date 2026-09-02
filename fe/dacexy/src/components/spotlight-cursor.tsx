import { useEffect, useRef } from "react";

export function SpotlightCursor() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (el) el.style.transform = `translate3d(${e.clientX - 220}px, ${e.clientY - 220}px, 0)`;
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="spotlight-orb pointer-events-none fixed top-0 left-0 z-0 hidden h-[440px] w-[440px] rounded-full opacity-70 blur-3xl lg:block"
    />
  );
}
