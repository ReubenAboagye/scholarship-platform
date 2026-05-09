"use client";

import { useEffect, useRef } from "react";

export default function HeroSpotlight() {
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const spotlight = spotlightRef.current;
    if (!spotlight) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = spotlight.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      spotlight.style.setProperty("--mouse-x", `${x}px`);
      spotlight.style.setProperty("--mouse-y", `${y}px`);
    };

    spotlight.addEventListener("mousemove", handleMouseMove);
    return () => {
      spotlight.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={spotlightRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{
        "--mouse-x": "50%",
        "--mouse-y": "50%",
      } as React.CSSProperties}
    >
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-20 pointer-events-none mix-blend-overlay"
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)",
          left: "calc(var(--mouse-x) - 300px)",
          top: "calc(var(--mouse-y) - 300px)",
          transition: "left 0.15s ease-out, top 0.15s ease-out",
        }}
      />
    </div>
  );
}
