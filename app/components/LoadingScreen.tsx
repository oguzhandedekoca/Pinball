'use client';
import { motion } from "framer-motion";

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="w-80 h-80 relative">
        <svg viewBox="0 0 200 120" className="w-full h-full">
          {/* Masa Çerçevesi */}
          <rect
            x="10"
            y="20"
            width="180"
            height="80"
            rx="4"
            fill="#8B4513"
            className="dark:opacity-80"
          />
          
          {/* Oyun Alanı */}
          <rect
            x="15"
            y="25"
            width="170"
            height="70"
            rx="2"
            fill="#0A8A30"
            className="dark:opacity-90"
          />

          {/* Orta Çizgi */}
          <line
            x1="100"
            y1="25"
            x2="100"
            y2="95"
            stroke="white"
            strokeWidth="2"
            strokeDasharray="4"
          />

          {/* Kaleler */}
          <rect x="15" y="50" width="5" height="20" fill="white" opacity="0.8" />
          <rect x="180" y="50" width="5" height="20" fill="white" opacity="0.8" />

          {/* Merkez Daire */}
          <circle cx="100" cy="60" r="15" stroke="white" strokeWidth="2" fill="none" opacity="0.5" />

          {/* Dönen Kollar (Animasyonlu) */}
          <motion.g
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            style={{ originX: "100px", originY: "60px" }}
          >
            <line
              x1="30"
              y1="60"
              x2="170"
              y2="60"
              stroke="#C0C0C0"
              strokeWidth="3"
            />
            <circle cx="60" cy="60" r="5" fill="#FFD700" />
            <circle cx="140" cy="60" r="5" fill="#FFD700" />
          </motion.g>

          {/* Hareketli Top */}
          <motion.circle
            cx="100"
            cy="60"
            r="3"
            fill="#FFFFFF"
            animate={{
              cx: [100, 30, 170, 100],
              cy: [60, 40, 80, 60],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Skor Göstergesi */}
          <rect x="85" y="10" width="30" height="12" rx="2" fill="#333" />
          <motion.text
            x="92"
            y="20"
            fill="white"
            fontSize="10"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            0 - 0
          </motion.text>

          {/* Oyuncu Figürleri (Animasyonlu) */}
          <motion.g
            animate={{ y: [-2, 2, -2] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <circle cx="60" cy="40" r="3" fill="#FF0000" />
            <circle cx="60" cy="80" r="3" fill="#FF0000" />
            <circle cx="140" cy="40" r="3" fill="#0000FF" />
            <circle cx="140" cy="80" r="3" fill="#0000FF" />
          </motion.g>
        </svg>
      </div>

      {/* Loading Yazısı */}
      <div className="mt-8 text-center space-y-4">
        <motion.h2 
          className="text-2xl font-bold text-blue-600 dark:text-blue-400"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Yükleniyor...
        </motion.h2>
        <div className="flex items-center justify-center gap-2">
          <motion.div
            className="w-3 h-3 rounded-full bg-blue-500"
            animate={{ y: [-4, 4, -4] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
          <motion.div
            className="w-3 h-3 rounded-full bg-green-500"
            animate={{ y: [-4, 4, -4] }}
            transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
          />
          <motion.div
            className="w-3 h-3 rounded-full bg-red-500"
            animate={{ y: [-4, 4, -4] }}
            transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
          />
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Langırt masası hazırlanıyor
        </p>
      </div>
    </div>
  );
} 