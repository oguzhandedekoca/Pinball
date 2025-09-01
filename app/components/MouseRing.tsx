'use client';

import { useEffect, useState } from 'react';

const MouseRing = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      setIsMoving(true);

      // Mouse durduğunda efekti gizle
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMoving(false);
      }, 100);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      <div
        className={`absolute w-16 h-16 border-2 border-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-300 ease-out ${
          isMoving ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        }`}
        style={{
          left: mousePosition.x - 32,
          top: mousePosition.y - 32,
          background: 'conic-gradient(from 0deg, #8b5cf6, #ec4899, #3b82f6, #8b5cf6)',
          animation: isMoving ? 'spin 2s linear infinite' : 'none',
        }}
      />
      <div
        className={`absolute w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full transition-all duration-200 ease-out ${
          isMoving ? 'opacity-60 scale-100' : 'opacity-0 scale-50'
        }`}
        style={{
          left: mousePosition.x - 16,
          top: mousePosition.y - 16,
        }}
      />
    </div>
  );
};

export default MouseRing;
