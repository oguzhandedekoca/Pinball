'use client';
import { motion } from "framer-motion";

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="w-64 h-64 relative">
        {/* Langırt Masası */}
        <svg
          viewBox="0 0 200 100"
          className="w-full h-full"
        >
          {/* Masa Çerçevesi */}
          <rect
            x="10"
            y="20"
            width="180"
            height="60"
            fill="#8B4513"
            className="dark:opacity-80"
          />
          
          {/* Oyun Alanı */}
          <rect
            x="15"
            y="25"
            width="170"
            height="50"
            fill="#0A8A30"
            className="dark:opacity-90"
          />

          {/* Çizgiler */}
          <line
            x1="100"
            y1="25"
            x2="100"
            y2="75"
            stroke="white"
            strokeWidth="2"
            strokeDasharray="4"
          />

          {/* Dönen Kollar (Animasyonlu) */}
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            origin="100, 50"
          >
            <line
              x1="30"
              y1="50"
              x2="170"
              y2="50"
              stroke="#C0C0C0"
              strokeWidth="3"
            />
            <circle cx="60" cy="50" r="5" fill="#FFD700" />
            <circle cx="140" cy="50" r="5" fill="#FFD700" />
          </motion.g>
        </svg>
      </div>
      <div className="mt-8 text-center">
        <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
          Yükleniyor...
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Langırt masası hazırlanıyor
        </p>
      </div>
    </div>
  );
} 