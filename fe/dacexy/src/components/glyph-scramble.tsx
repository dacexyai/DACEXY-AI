import { useEffect, useRef, useState } from "react";

const GLYPHS = "#$%@&*()+=/\\<>{}[]".split("");

/** Cycles characters into place on view, then re-scrambles on hover. */
export function GlyphScramble({ text, className }: { text: string; className?: string }) {
  const [out, setOut] = useState(text);
  const raf = useRef(0);

  const run = () => {
    cancelAnimationFrame(raf.current);
    const start = performance.now();
    const total = 900;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / total);
      const revealed = Math.floor(p * text.length);
      let s = "";
      for (let i = 0; i < text.length; i++) {
        const ch = text[i] ?? "";
        if (i < revealed || ch === " ") s += ch;
        else s += GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? "#";
      }
      setOut(s);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else setOut(text);
    };
    raf.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    run();
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <span className={className} onMouseEnter={run}>
      {out}
    </span>
  );
}
