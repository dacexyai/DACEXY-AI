/**
 * Site-wide cinematic gradient field.
 * Large blurred colour masses sweep horizontally across the whole page,
 * with a travelling light scan for extra intensity.
 */
export function GradientField() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 hue-cycle">
        <div
          className="sweep-x absolute -top-1/3 left-[-20%] h-[80vh] w-[80vw] rounded-full opacity-[0.4] blur-[110px]"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, oklch(0.55 0.21 272) 65%, transparent), transparent 70%)",
          }}
        />
        <div
          className="sweep-x-rev absolute top-[20%] right-[-25%] h-[70vh] w-[70vw] rounded-full opacity-[0.36] blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, oklch(0.68 0.16 205) 60%, transparent), transparent 70%)",
          }}
        />
        <div
          className="sweep-x absolute bottom-[-20%] left-[10%] h-[65vh] w-[75vw] rounded-full opacity-[0.3] blur-[130px]"
          style={{
            animationDuration: "34s",
            background:
              "radial-gradient(circle, color-mix(in oklab, oklch(0.78 0.17 62) 55%, transparent), transparent 70%)",
          }}
        />
      </div>
      <div className="scan-line absolute inset-y-0 left-0 w-[38vw] bg-[linear-gradient(90deg,transparent,oklch(1_0_0/_55%),transparent)] mix-blend-overlay" />
      <div className="absolute inset-0 bg-background/45" />
    </div>
  );
}