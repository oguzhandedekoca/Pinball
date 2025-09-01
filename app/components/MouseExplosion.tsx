"use client";

import { useEffect, useState, useRef } from "react";

interface ExplosionParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  rotation: number;
  rotationSpeed: number;
}

const MouseExplosion = () => {
  const [particles, setParticles] = useState<ExplosionParticle[]>([]);
  const particleIdRef = useRef(0);

  const colors = [
    "#ff6b6b",
    "#4ecdc4",
    "#45b7d1",
    "#96ceb4",
    "#feca57",
    "#ff9ff3",
    "#54a0ff",
    "#5f27cd",
    "#ff9f43",
    "#00d2d3",
    "#ff6348",
    "#2ed573",
    "#ff4757",
    "#3742fa",
    "#2f3542",
  ];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Patlama efekti oluştur
      const particleCount = 15;
      const newParticles: ExplosionParticle[] = [];

      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const speed = Math.random() * 8 + 4;

        newParticles.push({
          id: particleIdRef.current++,
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 12 + 6,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 1,
          maxLife: Math.random() * 1 + 0.5,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 20,
        });
      }

      setParticles((prev) => [...prev, ...newParticles]);
    };

    const animate = () => {
      setParticles((prev) =>
        prev
          .map((particle) => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vx: particle.vx * 0.95, // Sürtünme
            vy: particle.vy * 0.95,
            life: particle.life - 0.02,
            rotation: particle.rotation + particle.rotationSpeed,
          }))
          .filter((particle) => particle.life > 0)
      );

      requestAnimationFrame(animate);
    };

    window.addEventListener("click", handleClick);
    animate();

    return () => {
      window.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-55 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute"
          style={{
            left: particle.x - particle.size / 2,
            top: particle.y - particle.size / 2,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: particle.life / particle.maxLife,
            transform: `rotate(${particle.rotation}deg) scale(${
              particle.life / particle.maxLife
            })`,
            borderRadius: "50%",
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            filter: "blur(1px)",
          }}
        />
      ))}
    </div>
  );
};

export default MouseExplosion;
