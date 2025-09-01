"use client";

import { useEffect, useState, useRef } from "react";

interface LightRing {
  id: number;
  x: number;
  y: number;
  radius: number;
  opacity: number;
  maxRadius: number;
  color: string;
  thickness: number;
}

const MouseLightRings = () => {
  const [rings, setRings] = useState<LightRing[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isOverInteractive, setIsOverInteractive] = useState(false);
  const ringIdRef = useRef(0);

  const colors = [
    "rgba(255, 107, 107, 0.3)", // Kırmızı
    "rgba(78, 205, 196, 0.3)", // Turkuaz
    "rgba(69, 183, 209, 0.3)", // Mavi
    "rgba(150, 206, 180, 0.3)", // Yeşil
    "rgba(254, 202, 87, 0.3)", // Sarı
    "rgba(255, 159, 243, 0.3)", // Pembe
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

      // Sadece etkileşimli elementlerin üzerinde değilse ışık halkası oluştur
      if (!isInteractive) {
        // Yeni ışık halkası oluştur
        const newRing: LightRing = {
          id: ringIdRef.current++,
          x: e.clientX,
          y: e.clientY,
          radius: 10,
          opacity: 0.8,
          maxRadius: Math.random() * 80 + 40, // 40-120px
          color: colors[Math.floor(Math.random() * colors.length)],
          thickness: Math.random() * 3 + 2, // 2-5px
        };

        setRings((prev) => [...prev, newRing]);
      }
    };

    const animate = () => {
      setRings((prev) =>
        prev
          .map((ring) => ({
            ...ring,
            radius: ring.radius + 1.5,
            opacity: ring.opacity - 0.015,
          }))
          .filter((ring) => ring.opacity > 0 && ring.radius < ring.maxRadius)
      );

      requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Etkileşimli elementlerin üzerindeyse efektleri gizle
  if (isOverInteractive) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-25 overflow-hidden">
      {rings.map((ring) => (
        <div
          key={ring.id}
          className="absolute rounded-full"
          style={{
            left: ring.x - ring.radius,
            top: ring.y - ring.radius,
            width: ring.radius * 2,
            height: ring.radius * 2,
            opacity: ring.opacity,
            border: `${ring.thickness}px solid ${ring.color}`,
            boxShadow: `0 0 ${ring.radius}px ${ring.color}`,
            filter: "blur(1px)",
          }}
        />
      ))}
    </div>
  );
};

export default MouseLightRings;
