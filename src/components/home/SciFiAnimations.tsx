"use client";

import { useEffect, useRef, useState } from "react";
import { GraduationCap, Globe, BookOpen, Award, Zap, Brain, Target, Database, Network, Sparkles } from "lucide-react";

interface FloatingNode {
  id: number;
  x: number;
  y: number;
  icon: any;
  size: number;
  speed: number;
  delay: number;
  rotation: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
}

export default function SciFiAnimations() {
  const [nodes, setNodes] = useState<FloatingNode[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Initialize floating educational nodes
  useEffect(() => {
    const icons = [GraduationCap, Globe, BookOpen, Award, Zap, Brain, Target, Database];
    const newNodes: FloatingNode[] = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      icon: icons[i % icons.length],
      size: 20 + Math.random() * 30,
      speed: 0.5 + Math.random() * 1.5,
      delay: Math.random() * 2,
      rotation: Math.random() * 360,
    }));
    setNodes(newNodes);

    // Initialize particles
    const newParticles: Particle[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 3,
      speedX: (Math.random() - 0.5) * 0.2,
      speedY: (Math.random() - 0.5) * 0.2,
      opacity: 0.3 + Math.random() * 0.5,
    }));
    setParticles(newParticles);
  }, []);

  // Canvas animation for connection lines
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      setParticles(prev => prev.map(p => {
        let newX = p.x + p.speedX;
        let newY = p.y + p.speedY;
        
        if (newX < 0 || newX > 100) newX = Math.random() * 100;
        if (newY < 0 || newY > 100) newY = Math.random() * 100;
        
        return { ...p, x: newX, y: newY };
      }));

      // Draw connection lines between nearby nodes
      const canvasNodes = nodes.map(n => ({
        x: (n.x / 100) * canvas.width,
        y: (n.y / 100) * canvas.height,
      }));

      ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)';
      ctx.lineWidth = 1;
      
      for (let i = 0; i < canvasNodes.length; i++) {
        for (let j = i + 1; j < canvasNodes.length; j++) {
          const dx = canvasNodes[i].x - canvasNodes[j].x;
          const dy = canvasNodes[i].y - canvasNodes[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 300) {
            ctx.beginPath();
            ctx.moveTo(canvasNodes[i].x, canvasNodes[i].y);
            ctx.lineTo(canvasNodes[j].x, canvasNodes[j].y);
            ctx.stroke();
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Canvas for connection lines */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Floating educational nodes */}
      {nodes.map((node) => {
        const Icon = node.icon;
        return (
          <div
            key={node.id}
            className="absolute animate-float-sci-fi"
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              animationDelay: `${node.delay}s`,
              animationDuration: `${8 + node.speed * 4}s`,
            }}
          >
            <div
              className="relative flex items-center justify-center"
              style={{
                width: node.size,
                height: node.size,
                transform: `rotate(${node.rotation}deg)`,
              }}
            >
              {/* Glowing background */}
              <div
                className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl animate-pulse-glow"
                style={{ animationDelay: `${node.delay}s` }}
              />
              
              {/* Hexagonal frame */}
              <div className="absolute inset-0 rounded-full border-2 border-blue-400/30 animate-spin-slow" />
              
              {/* Icon */}
              <Icon
                className="relative text-blue-300/80"
                style={{ width: node.size * 0.5, height: node.size * 0.5 }}
                strokeWidth={1.5}
              />
            </div>
          </div>
        );
      })}

      {/* Data stream effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-blue-400/30 to-transparent animate-data-stream" />
        <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-blue-400/30 to-transparent animate-data-stream" style={{ animationDelay: '1s' }} />
        <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-transparent via-blue-400/30 to-transparent animate-data-stream" style={{ animationDelay: '2s' }} />
      </div>

      {/* Floating particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-blue-400/50 animate-particle-float"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            opacity: particle.opacity,
            animationDuration: `${10 + Math.random() * 10}s`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}

      {/* Circuit board pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-circuit-pulse" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-circuit-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-3/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-circuit-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Holographic corner decorations */}
      <div className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-blue-400/40 animate-hologram-scan" />
      <div className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-blue-400/40 animate-hologram-scan" style={{ animationDelay: '0.3s' }} />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-blue-400/40 animate-hologram-scan" style={{ animationDelay: '0.6s' }} />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-blue-400/40 animate-hologram-scan" style={{ animationDelay: '0.9s' }} />

      {/* Central glowing orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl animate-orb-pulse" />
      
      {/* Scanning line effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-blue-400/50 to-transparent animate-scan-line" />
      </div>

      {/* Floating educational terms */}
      <div className="absolute top-1/4 left-10 text-blue-300/30 text-xs font-mono animate-float-term" style={{ animationDelay: '0s' }}>
        AI_MATCHING
      </div>
      <div className="absolute top-1/3 right-16 text-blue-300/30 text-xs font-mono animate-float-term" style={{ animationDelay: '1s' }}>
        VERIFIED_DATA
      </div>
      <div className="absolute bottom-1/3 left-20 text-blue-300/30 text-xs font-mono animate-float-term" style={{ animationDelay: '2s' }}>
        GLOBAL_NETWORK
      </div>
      <div className="absolute bottom-1/4 right-10 text-blue-300/30 text-xs font-mono animate-float-term" style={{ animationDelay: '3s' }}>
        SMART_FILTERING
      </div>
    </div>
  );
}
