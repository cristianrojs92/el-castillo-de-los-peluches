import { motion } from 'motion/react';

export default function CastleBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-sky-100 via-pink-50 to-purple-100 -z-10 select-none">
      {/* Decorative slow ambient light glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-200/40 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-purple-200/30 rounded-full blur-3xl" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-yellow-100/40 rounded-full blur-3xl animate-pulse" />

      {/* Styled Pastel Castle (Blurred/Soft-focus to prevent eye fatigue) */}
      <div className="absolute bottom-0 inset-x-0 h-2/3 flex items-end justify-center opacity-40 blur-sm pointer-events-none">
        <svg
          viewBox="0 0 800 600"
          className="w-full max-w-4xl h-auto translate-y-12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Spires and Back walls */}
          <rect x="250" y="250" width="80" height="250" fill="#E2D4F5" rx="10" />
          <path d="M240 250 H340 L290 150 Z" fill="#9CA3AF" className="fill-purple-300" />
          <rect x="470" y="250" width="80" height="250" fill="#E2D4F5" rx="10" />
          <path d="M460 250 H570 L510 150 Z" fill="#9CA3AF" className="fill-purple-300" />

          {/* Central Main Castle Block */}
          <rect x="300" y="290" width="200" height="210" fill="#FCE7F3" rx="15" />
          <rect x="360" y="200" width="80" height="150" fill="#F472B6" className="fill-pink-200" rx="10" />
          <path d="M350 200 H450 L400 90 Z" fill="#D946EF" className="fill-pink-400" />

          {/* Flags */}
          <path d="M400 90 V50 H430 L420 70 L430 90 H400" fill="#FB7185" />
          <path d="M290 150 V110 H315 L307 125 L315 140 H290" fill="#38BDF8" />
          <path d="M510 150 V110 H535 L527 125 L535 140 H510" fill="#38BDF8" />

          {/* Cloud layers over the castle base */}
          <path
            d="M -100 550 Q 100 500 300 540 Q 500 480 700 520 Q 900 550 1000 550 V 650 H -100 Z"
            fill="#FFFFFF"
            opacity="0.8"
          />
          <path
            d="M -50 580 Q 200 530 450 560 Q 650 520 850 580 V 650 H -50 Z"
            fill="#F1F5F9"
            opacity="0.9"
          />
        </svg>
      </div>

      {/* Floating interactive cute clouds helper */}
      <motion.div
        animate={{
          x: [0, 15, 0],
          y: [0, -10, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-16 left-[5%] w-32 h-16 bg-white/60 blur-[1px] rounded-full filter"
      >
        <div className="absolute -top-4 left-6 w-16 h-16 bg-white/60 rounded-full" />
        <div className="absolute -top-2 left-16 w-12 h-12 bg-white/60 rounded-full" />
      </motion.div>

      <motion.div
        animate={{
          x: [0, -20, 0],
          y: [0, 8, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-28 right-[8%] w-44 h-20 bg-white/50 blur-[1px] rounded-full filter"
      >
        <div className="absolute -top-6 left-8 w-20 h-20 bg-white/50 rounded-full" />
        <div className="absolute -top-4 left-24 w-16 h-16 bg-white/50 rounded-full" />
      </motion.div>
    </div>
  );
}
