"use client";

import { useEffect, useState } from "react";

interface BackgroundParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

const BackgroundParticles = () => {
  const [particles, setParticles] = useState<BackgroundParticle[]>([]);

  useEffect(() => {
    // Daha az parçacık oluştur (20 yerine 12)
    const initialParticles: BackgroundParticle[] = Array.from(
      { length: 12 },
      (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 2 + 1, // Daha küçük boyut
        speed: Math.random() * 0.3 + 0.05, // Daha yavaş hareket
        opacity: Math.random() * 0.2 + 0.05, // Daha düşük opaklık
      })
    );

    setParticles(initialParticles);

    const animate = () => {
      setParticles((prev) =>
        prev.map((particle) => ({
          ...particle,
          y: particle.y - particle.speed,
          opacity: particle.opacity + (Math.random() - 0.5) * 0.005, // Daha az değişim
        }))
      );
    };

    const interval = setInterval(animate, 80); // Daha yavaş animasyon (50ms yerine 80ms)

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            opacity: Math.max(0, Math.min(1, particle.opacity)),
            transform: `translateY(${
              particle.y < -10 ? window.innerHeight + 10 : 0
            }px)`,
            transition: "transform 0.1s ease-out",
          }}
        />
      ))}
    </div>
  );
};

export default BackgroundParticles;
