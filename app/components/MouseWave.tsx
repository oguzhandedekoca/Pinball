"use client";

import { useEffect, useState, useRef } from "react";

interface Wave {
  id: number;
  x: number;
  y: number;
  radius: number;
  opacity: number;
  maxRadius: number;
}

const MouseWave = () => {
  const [waves, setWaves] = useState<Wave[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isOverInteractive, setIsOverInteractive] = useState(false);
  const waveIdRef = useRef(0);

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

      // Sadece etkileşimli elementlerin üzerinde değilse dalga oluştur
      if (!isInteractive) {
        // Yeni dalga oluştur
        const newWave: Wave = {
          id: waveIdRef.current++,
          x: e.clientX,
          y: e.clientY,
          radius: 0,
          opacity: 1,
          maxRadius: Math.random() * 100 + 50, // 50-150px
        };

        setWaves((prev) => [...prev, newWave]);
      }
    };

    const animate = () => {
      setWaves((prev) =>
        prev
          .map((wave) => ({
            ...wave,
            radius: wave.radius + 2,
            opacity: wave.opacity - 0.02,
          }))
          .filter((wave) => wave.opacity > 0 && wave.radius < wave.maxRadius)
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
    <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
      {waves.map((wave) => (
        <div
          key={wave.id}
          className="absolute border border-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
          style={{
            left: wave.x - wave.radius,
            top: wave.y - wave.radius,
            width: wave.radius * 2,
            height: wave.radius * 2,
            opacity: wave.opacity,
            borderWidth: "2px",
            borderImage: "linear-gradient(45deg, #06b6d4, #3b82f6, #8b5cf6) 1",
          }}
        />
      ))}
    </div>
  );
};

export default MouseWave;
