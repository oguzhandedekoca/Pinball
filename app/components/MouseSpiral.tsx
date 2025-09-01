"use client";

import { useEffect, useState, useRef } from "react";

interface SpiralLine {
  id: number;
  x: number;
  y: number;
  angle: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  color: string;
  thickness: number;
}

const MouseSpiral = () => {
  const [lines, setLines] = useState<SpiralLine[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const lineIdRef = useRef(0);

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
  ];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });

      // Yeni spiral çizgi oluştur
      const newLine: SpiralLine = {
        id: lineIdRef.current++,
        x: e.clientX,
        y: e.clientY,
        angle: Math.random() * Math.PI * 2,
        radius: 5,
        maxRadius: Math.random() * 60 + 30,
        opacity: 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        thickness: Math.random() * 2 + 1,
      };

      setLines((prev) => [...prev, newLine]);
    };

    const animate = () => {
      setLines((prev) =>
        prev
          .map((line) => ({
            ...line,
            radius: line.radius + 1,
            angle: line.angle + 0.1,
            opacity: line.opacity - 0.01,
          }))
          .filter((line) => line.opacity > 0 && line.radius < line.maxRadius)
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
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {lines.map((line) => {
        const endX = line.x + Math.cos(line.angle) * line.radius;
        const endY = line.y + Math.sin(line.angle) * line.radius;

        return (
          <div
            key={line.id}
            className="absolute"
            style={{
              left: line.x,
              top: line.y,
              width: line.radius,
              height: line.thickness,
              backgroundColor: line.color,
              opacity: line.opacity,
              transformOrigin: "0 50%",
              transform: `rotate(${line.angle}rad)`,
              borderRadius: "2px",
              boxShadow: `0 0 ${line.thickness * 2}px ${line.color}`,
            }}
          />
        );
      })}
    </div>
  );
};

export default MouseSpiral;
