'use client';
import { motion, AnimatePresence } from "framer-motion";

export function LoadingScreen() {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800"
      >
        <div className="w-80 h-80 relative">
          <svg viewBox="0 0 200 120" className="w-full h-full">
            {/* Masa Kenarları */}
            <rect
              x="10"
              y="10"
              width="180"
              height="100"
              rx="4"
              fill="#8B4513"
              className="dark:opacity-80"
            />

            {/* Oyun Alanı */}
            <rect
              x="15"
              y="15"
              width="170"
              height="90"
              rx="2"
              fill="#0A8A30"
              className="dark:opacity-90"
            />

            {/* Langırt Çubukları (5 çubuk) */}
            {[30, 65, 100, 135, 170].map((x, i) => (
              <motion.g
                key={i}
                animate={{ rotate: [-10, 10, -10] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                  immediateRender: true
                }}
                style={{ originX: `${x}px`, originY: "60px" }}
              >
                <line
                  x1={x}
                  y1="15"
                  x2={x}
                  y2="105"
                  stroke="#C0C0C0"
                  strokeWidth="3"
                />
                {/* Her çubukta 2-4 oyuncu */}
                {[...Array(i === 2 ? 4 : 3)].map((_, j) => (
                  <g key={j}>
                    <rect
                      x={x - 4}
                      y={25 + j * 25}
                      width="8"
                      height="12"
                      fill={i % 2 === 0 ? "#FF0000" : "#0000FF"}
                      rx="1"
                    />
                    <rect
                      x={x - 2}
                      y={25 + j * 25}
                      width="4"
                      height="12"
                      fill={i % 2 === 0 ? "#FF4444" : "#4444FF"}
                      rx="1"
                    />
                  </g>
                ))}
              </motion.g>
            ))}

            {/* Top */}
            <motion.circle
              cx="100"
              cy="60"
              r="3"
              fill="#FFFFFF"
              initial={{ cx: 100, cy: 60 }}
              animate={{
                cx: [100, 40, 160, 100],
                cy: [60, 30, 90, 60],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                immediateRender: true,
                times: [0, 0.33, 0.66, 1]
              }}
            />

            {/* Skor Göstergesi */}
            <rect x="85" y="5" width="30" height="12" rx="2" fill="#333" />
            <motion.text
              x="92"
              y="14"
              fill="white"
              fontSize="10"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              0 - 0
            </motion.text>
          </svg>
        </div>

        {/* Loading Yazısı */}
        <div className="mt-8 text-center space-y-4">
          <motion.h2
            className="text-2xl font-bold text-blue-600 dark:text-blue-400"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              immediateRender: true
            }}
          >
            Yükleniyor...
          </motion.h2>
          <div className="flex items-center justify-center gap-2">
            <motion.div
              className="w-3 h-3 rounded-full bg-blue-500"
              animate={{ y: [-4, 4, -4] }}
              transition={{
                duration: 0.4,
                repeat: Infinity,
                immediateRender: true
              }}
            />
            <motion.div
              className="w-3 h-3 rounded-full bg-green-500"
              animate={{ y: [-4, 4, -4] }}
              transition={{
                duration: 0.4,
                repeat: Infinity,
                delay: 0.1,
                immediateRender: true
              }}
            />
            <motion.div
              className="w-3 h-3 rounded-full bg-red-500"
              animate={{ y: [-4, 4, -4] }}
              transition={{
                duration: 0.4,
                repeat: Infinity,
                delay: 0.2,
                immediateRender: true
              }}
            />
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Langırt masası hazırlanıyor
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
} 