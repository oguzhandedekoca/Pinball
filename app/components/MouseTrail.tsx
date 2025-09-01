"use client";

import { useEffect, useRef, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
}

const MouseTrail = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isOverInteractive, setIsOverInteractive] = useState(false);
  const animationRef = useRef<number>();
  const particleIdRef = useRef(0);

  const colors = [
    "#ff6b6b", // Kırmızı
    "#4ecdc4", // Turkuaz
    "#45b7d1", // Mavi
    "#96ceb4", // Yeşil
    "#feca57", // Sarı
    "#ff9ff3", // Pembe
  ];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });

      // Mouse'un üzerinde olduğu elementi kontrol et
      const element = e.target as HTMLElement;
      const isInteractive =
        element.closest(
          'button, a, input, textarea, select, [role="button"], [tabindex]'
        ) !== null;

      setIsOverInteractive(isInteractive);

      // Sadece etkileşimli elementlerin üzerinde değilse parçacık oluştur
      if (!isInteractive && Math.random() > 0.3) {
        // %70 ihtimalle (önceden %50'ydi)
        const newParticle: Particle = {
          id: particleIdRef.current++,
          x: e.clientX + (Math.random() - 0.5) * 15, // Daha küçük alan
          y: e.clientY + (Math.random() - 0.5) * 15,
          vx: (Math.random() - 0.5) * 3, // Daha yavaş hareket
          vy: (Math.random() - 0.5) * 3,
          life: 1,
          maxLife: Math.random() * 0.6 + 0.4, // Daha kısa yaşam
          size: Math.random() * 10 + 6, // Daha küçük boyut
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 5, // Daha yavaş dönüş
        };

        setParticles((prev) => [...prev, newParticle]);
      }
    };

    const animate = () => {
      setParticles((prev) =>
        prev
          .map((particle) => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            life: particle.life - 0.02, // Daha hızlı kaybolma
            vx: particle.vx * 0.97, // Daha fazla sürtünme
            vy: particle.vy * 0.97,
            rotation: particle.rotation + particle.rotationSpeed,
          }))
          .filter((particle) => particle.life > 0)
      );

      animationRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Etkileşimli elementlerin üzerindeyse efektleri gizle
  if (isOverInteractive) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute opacity-80"
          style={{
            left: particle.x - particle.size / 2,
            top: particle.y - particle.size / 2,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: particle.life / particle.maxLife,
            transform: `scale(${particle.life / particle.maxLife}) rotate(${
              particle.rotation
            }deg)`,
            transition: "all 0.1s ease-out",
            boxShadow: `0 0 ${particle.size}px ${particle.color}`,
            borderRadius: "50%",
            filter: "blur(0.3px)",
          }}
        />
      ))}
    </div>
  );
};

export default MouseTrail;
