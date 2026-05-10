"use client";

import { useEffect, useRef } from "react";

export default function InteractiveGrid() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = grid.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Calculate percentage position
      const xPercent = (x / rect.width) * 100;
      const yPercent = (y / rect.height) * 100;

      grid.style.setProperty("--mouse-x", `${xPercent}%`);
      grid.style.setProperty("--mouse-y", `${yPercent}%`);
    };

    grid.addEventListener("mousemove", handleMouseMove);
    return () => {
      grid.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={gridRef}
      className="absolute inset-0 opacity-40"
      style={{
        "--mouse-x": "50%",
        "--mouse-y": "50%",
      } as React.CSSProperties}
    >
      {/* Base grid pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBMMDQgMEgwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoNTksIDEzMCwgMjQ2LCAwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]" />

      {/* Mouse-following glow effect on grid */}
      <div
        className="absolute rounded-full blur-3xl pointer-events-none"
        style={{
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)",
          left: "calc(var(--mouse-x) - 300px)",
          top: "calc(var(--mouse-y) - 300px)",
          transition: "left 0.2s ease-out, top 0.2s ease-out",
        }}
      />

      {/* Animated grid lines that follow cursor */}
      <div
        className="absolute w-px h-full bg-gradient-to-b from-transparent via-blue-400/60 to-transparent pointer-events-none"
        style={{
          left: "var(--mouse-x)",
          transition: "left 0.15s ease-out",
        }}
      />
      <div
        className="absolute h-px w-full bg-gradient-to-r from-transparent via-blue-400/60 to-transparent pointer-events-none"
        style={{
          top: "var(--mouse-y)",
          transition: "top 0.15s ease-out",
        }}
      />

      {/* Hexagonal grid overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImhleCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNMzAgMEw2MCAxNkw2MCA0NEwzMCA2MEwwIDQ0TDAgMTZMMzAgMHoiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSg1OSwgMTMwLCAyNDYsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjaGV4KSIvPjwvc3ZnPg==')] opacity-50" />

      {/* Pulsing crosshairs at cursor position */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: "var(--mouse-x)",
          top: "var(--mouse-y)",
          transform: "translate(-50%, -50%)",
          transition: "left 0.15s ease-out, top 0.15s ease-out",
        }}
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
        className="absolute rounded-full border-2 border-blue-400/30 pointer-events-none"
        style={{
          width: "100px",
          height: "100px",
          left: "calc(var(--mouse-x) - 50px)",
          top: "calc(var(--mouse-y) - 50px)",
          transition: "left 0.15s ease-out, top 0.15s ease-out",
          animation: "ripple-expand 2s ease-out infinite",
        }}
      />
    </div>
  );
}
