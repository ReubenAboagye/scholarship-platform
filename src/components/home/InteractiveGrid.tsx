"use client";

import { useEffect, useRef } from "react";

export default function InteractiveGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const vLineRef = useRef<HTMLDivElement>(null);
  const hLineRef = useRef<HTMLDivElement>(null);
  const crosshairRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);

  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    const glow = glowRef.current;
    const vLine = vLineRef.current;
    const hLine = hLineRef.current;
    const crosshair = crosshairRef.current;
    const ripple = rippleRef.current;
    if (!container || !glow || !vLine || !hLine || !crosshair || !ripple) return;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      targetRef.current.x = e.clientX - rect.left;
      targetRef.current.y = e.clientY - rect.top;
    };

    const animate = () => {
      const target = targetRef.current;
      const current = currentRef.current;

      current.x = lerp(current.x, target.x, 0.14);
      current.y = lerp(current.y, target.y, 0.14);

      glow.style.transform = `translate(${current.x - 300}px, ${current.y - 300}px)`;
      vLine.style.transform = `translateX(${current.x}px)`;
      hLine.style.transform = `translateY(${current.y}px)`;
      crosshair.style.transform = `translate(${current.x}px, ${current.y}px) translate(-50%, -50%)`;
      ripple.style.transform = `translate(${current.x - 50}px, ${current.y - 50}px)`;

      rafRef.current = requestAnimationFrame(animate);
    };

    container.addEventListener("mousemove", handleMouseMove);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 opacity-40">
      {/* Base grid pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBMMDQgMEgwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoNTksIDEzMCwgMjQ2LCAwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]" />

      {/* Mouse-following glow effect on grid */}
      <div
        ref={glowRef}
        className="absolute top-0 left-0 rounded-full blur-3xl pointer-events-none will-change-transform"
        style={{
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)",
        }}
      />

      {/* Animated grid lines that follow cursor */}
      <div
        ref={vLineRef}
        className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-blue-400/60 to-transparent pointer-events-none will-change-transform"
      />
      <div
        ref={hLineRef}
        className="absolute top-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-blue-400/60 to-transparent pointer-events-none will-change-transform"
      />

      {/* Hexagonal grid overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImhleCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNMzAgMEw2MCAxNkw2MCA0NEwzMCA2MEwwIDQ0TDAgMTZMMzAgMHoiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSg1OSwgMTMwLCAyNDYsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjaGV4KSIvPjwvc3ZnPg==')] opacity-50" />

      {/* Pulsing crosshairs at cursor position */}
      <div
        ref={crosshairRef}
        className="absolute top-0 left-0 pointer-events-none will-change-transform"
      >
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-2 border-blue-400/40 rounded-full animate-ping" />
          <div className="absolute inset-2 border border-blue-400/30 rounded-full" />
          <div className="absolute inset-4 border border-blue-400/20 rounded-full" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-blue-400/60" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-blue-400/60" />
        </div>
      </div>

      {/* Scanning ripple effect */}
      <div
        ref={rippleRef}
        className="absolute top-0 left-0 rounded-full border-2 border-blue-400/30 pointer-events-none will-change-transform"
        style={{
          width: "100px",
          height: "100px",
          animation: "ripple-expand 2s ease-out infinite",
        }}
      />
    </div>
  );
}
