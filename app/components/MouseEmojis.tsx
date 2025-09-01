"use client";

import { useEffect, useState, useRef } from "react";

interface Emoji {
  id: number;
  x: number;
  y: number;
  emoji: string;
  size: number;
  angle: number;
  speed: number;
  life: number;
  maxLife: number;
  bounce: number;
}

const MouseEmojis = () => {
  const [emojis, setEmojis] = useState<Emoji[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const emojiIdRef = useRef(0);

  const emojiList = [
    "✨",
    "🎉",
    "💫",
    "⭐",
    "🌟",
    "💎",
    "🔥",
    "💖",
    "🎊",
    "🌈",
    "🍀",
    "🎯",
  ];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });

      // Rastgele emoji oluştur
      if (Math.random() > 0.7) {
        // %30 ihtimalle
        const newEmoji: Emoji = {
          id: emojiIdRef.current++,
          x: e.clientX + (Math.random() - 0.5) * 40,
          y: e.clientY + (Math.random() - 0.5) * 40,
          emoji: emojiList[Math.floor(Math.random() * emojiList.length)],
          size: Math.random() * 20 + 15, // 15-35px
          angle: Math.random() * 360,
          speed: Math.random() * 0.1 + 0.05,
          life: 1,
          maxLife: Math.random() * 2 + 1, // 1-3 saniye
          bounce: Math.random() * 0.1,
        };

        setEmojis((prev) => [...prev, newEmoji]);
      }
    };

    const animate = () => {
      setEmojis((prev) =>
        prev
          .map((emoji) => ({
            ...emoji,
            angle: emoji.angle + emoji.speed,
            y: emoji.y - 0.5, // Yukarı doğru hareket
            x: emoji.x + Math.sin(emoji.angle * 0.1) * 2, // Sallanma
            life: emoji.life - 0.016,
            bounce: emoji.bounce + 0.1,
          }))
          .filter((emoji) => emoji.life > 0)
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
    <div className="fixed inset-0 pointer-events-none z-45 overflow-hidden">
      {emojis.map((emoji) => (
        <div
          key={emoji.id}
          className="absolute select-none"
          style={{
            left: emoji.x - emoji.size / 2,
            top: emoji.y - emoji.size / 2,
            fontSize: emoji.size,
            opacity: emoji.life / emoji.maxLife,
            transform: `rotate(${emoji.angle}deg) scale(${
              1 + Math.sin(emoji.bounce) * 0.2
            })`,
            filter: "drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))",
            transition: "all 0.1s ease-out",
          }}
        >
          {emoji.emoji}
        </div>
      ))}
    </div>
  );
};

export default MouseEmojis;
