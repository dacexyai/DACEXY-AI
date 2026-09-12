import { useEffect, useRef } from "react";

const CHARS = "#$%@&*+=-:.xX8O0!?/\\|<>[]{}()".split("");

/**
 * Animated ASCII glyph field — a shifting grid of #$%@&*( characters
 * that ripples across the hero, tinted with the brand gradient.
 */
export function AsciiField({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let w = 0;
    let h = 0;
    const cell = 14;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `600 ${cell - 2}px "JetBrains Mono", ui-monospace, monospace`;
      ctx.textBaseline = "top";
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const cols = Math.ceil(w / cell);
      const rows = Math.ceil(h / cell);
      const time = t / 1000;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const nx = x / cols;
          const ny = y / rows;
          // travelling interference pattern
          const wave =
            Math.sin(nx * 12 - time * 1.6) * 0.5 +
            Math.sin((nx + ny) * 9 + time * 1.1) * 0.3 +
            Math.sin(ny * 14 - time * 0.8) * 0.4;
          const v = (wave + 1.2) / 2.4;
          if (v < 0.42) continue;

          const idx = Math.floor(Math.abs(wave * 97 + x * 7 + y * 13 + time * 6)) % CHARS.length;
          const alpha = Math.min(0.85, (v - 0.42) * 1.9);
          const hue = 258 + Math.sin(nx * 3 + time * 0.6) * 60;
          ctx.fillStyle = `oklch(0.6 0.2 ${hue} / ${alpha})`;
          ctx.fillText(CHARS[idx] ?? "#", x * cell, y * cell);
        }
      }
      raf = requestAnimationFrame(draw);
    };

    if (reduce) {
      draw(0);
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
