"use client";

import { useEffect, useState, useRef } from "react";

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  wobble: number;
}

const MouseBubbles = () => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const bubbleIdRef = useRef(0);

  const colors = [
    "rgba(255, 107, 107, 0.6)", // Kırmızı
    "rgba(78, 205, 196, 0.6)", // Turkuaz
    "rgba(69, 183, 209, 0.6)", // Mavi
    "rgba(150, 206, 180, 0.6)", // Yeşil
    "rgba(254, 202, 87, 0.6)", // Sarı
    "rgba(255, 159, 243, 0.6)", // Pembe
    "rgba(84, 160, 255, 0.6)", // Mavi
    "rgba(95, 39, 205, 0.6)", // Mor
  ];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });

      // Rastgele baloncuk oluştur
      if (Math.random() > 0.8) {
        // %20 ihtimalle
        const newBubble: Bubble = {
          id: bubbleIdRef.current++,
          x: e.clientX + (Math.random() - 0.5) * 30,
          y: e.clientY + (Math.random() - 0.5) * 30,
          size: Math.random() * 20 + 10, // 10-30px
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 2 - 1, // Yukarı doğru
          life: 1,
          maxLife: Math.random() * 3 + 2, // 2-5 saniye
          color: colors[Math.floor(Math.random() * colors.length)],
          wobble: Math.random() * Math.PI * 2,
        };

        setBubbles((prev) => [...prev, newBubble]);
      }
    };

    const animate = () => {
      setBubbles((prev) =>
        prev
          .map((bubble) => ({
            ...bubble,
            x: bubble.x + bubble.vx + Math.sin(bubble.wobble) * 0.5,
            y: bubble.y + bubble.vy,
            vy: bubble.vy + 0.05, // Yerçekimi
            life: bubble.life - 0.01,
            wobble: bubble.wobble + 0.1,
          }))
          .filter((bubble) => bubble.life > 0 && bubble.y > -50)
      );

      requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-35 overflow-hidden">
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="absolute rounded-full"
          style={{
            left: bubble.x - bubble.size / 2,
            top: bubble.y - bubble.size / 2,
            width: bubble.size,
            height: bubble.size,
            backgroundColor: bubble.color,
            opacity: bubble.life / bubble.maxLife,
            transform: `scale(${bubble.life / bubble.maxLife})`,
            border: "2px solid rgba(255, 255, 255, 0.3)",
            boxShadow: `0 0 ${bubble.size}px ${bubble.color}`,
            filter: "blur(0.5px)",
          }}
        />
      ))}
    </div>
  );
};

export default MouseBubbles;
