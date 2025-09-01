"use client";

import { useEffect, useState, useRef } from "react";

interface Star {
  id: number;
  x: number;
  y: number;
  angle: number;
  distance: number;
  size: number;
  speed: number;
  opacity: number;
}

const MouseStars = () => {
  const [stars, setStars] = useState<Star[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isOverInteractive, setIsOverInteractive] = useState(false);
  const starIdRef = useRef(0);

  useEffect(() => {
    // Daha az yıldız oluştur (8 yerine 6)
    const initialStars: Star[] = Array.from({ length: 6 }, (_, i) => ({
      id: starIdRef.current++,
      x: 0,
      y: 0,
      angle: i * 60 * (Math.PI / 180), // 60 derece aralıklarla
      distance: 25 + Math.random() * 15, // Daha küçük mesafe
      size: Math.random() * 3 + 2, // Daha küçük boyut
      speed: 0.015 + Math.random() * 0.02, // Daha yavaş dönüş
      opacity: 0.6 + Math.random() * 0.3, // Daha düşük opaklık
    }));

    setStars(initialStars);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });

      // Mouse'un üzerinde olduğu elementi kontrol et
      const element = e.target as HTMLElement;
      const isInteractive =
        element.closest(
          'button, a, input, textarea, select, [role="button"], [tabindex]'
        ) !== null;

      setIsOverInteractive(isInteractive);
    };

    const animate = () => {
      setStars((prev) =>
        prev.map((star) => ({
          ...star,
          angle: star.angle + star.speed,
          x: mousePosition.x + Math.cos(star.angle) * star.distance,
          y: mousePosition.y + Math.sin(star.angle) * star.distance,
        }))
      );

      requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [mousePosition]);

  // Etkileşimli elementlerin üzerindeyse efektleri gizle
  if (isOverInteractive) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-35 overflow-hidden">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute text-yellow-300"
          style={{
            left: star.x - star.size / 2,
            top: star.y - star.size / 2,
            fontSize: star.size,
            opacity: star.opacity,
            transform: `rotate(${(star.angle * 180) / Math.PI}deg)`,
            filter: "drop-shadow(0 0 3px rgba(255, 255, 0, 0.6))",
          }}
        >
          ✦
        </div>
      ))}
    </div>
  );
};

export default MouseStars;
