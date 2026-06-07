import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface TeddyBearProps {
  state: 'idle' | 'talking' | 'correct' | 'incorrect' | 'welcoming';
}

export default function TeddyBear({ state }: TeddyBearProps) {
  const [blink, setBlink] = useState(false);
  const [danceIndex, setDanceIndex] = useState(0);

  // Periodic automatic blinking for a natural, living feel
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const isSadAndStill = state === 'incorrect';
  const isHappy = state === 'correct' || state === 'welcoming';
  const isTalking = state === 'talking';

  useEffect(() => {
    if (state === 'correct') {
      // Pick a random dance index from the 10 funny configurations
      setDanceIndex(Math.floor(Math.random() * 10));
    }
  }, [state]);

  const DANCE_NAMES = [
    'EL GIRO DORMILÓN 🥱🌀',
    'EL VAIVÉN DE OREJAS 🐰👂',
    'EL CANGREJO LENTO 🦀⏳',
    'LA GELATINA ALEGRÍA 🍮✨',
    'EL HELICÓPTERO DESPACITO 🚁🍃',
    'EL ROBOT CONSENTIDO 🤖⚙️',
    'EL SILLY PENGUIN 🐧❄️',
    'LA OLA ESPACIAL 🌊🚀',
    'EL SALTO ASTRONAUTA 👨‍🚀🎈',
    'LA GALLINITA DORMILONA 🐔💤',
  ];

  // Choose different slow and funny animations for the 10 funny dances
  const getDanceAnimationValue = (idx: number) => {
    switch (idx) {
      case 0: // EL GIRO DORMILÓN
        return {
          rotate: [0, 360],
          y: [0, -10, 0],
          scale: [1, 1.03, 1]
        };
      case 1: // EL VAIVÉN DE OREJAS
        return {
          x: [-12, 12, -12],
          rotate: [-8, 8, -8],
          y: [0, -3, 0]
        };
      case 2: // EL CANGREJO LENTO
        return {
          x: [-24, 24, -24],
          scaleX: [1, 1.1, 0.9, 1.1, 1],
          y: [0, -6, 0, -6, 0]
        };
      case 3: // LA GELATINA ALEGRÍA
        return {
          skewX: [-10, 10, -10],
          scaleY: [1, 0.85, 1.15, 1],
          scaleX: [1, 1.15, 0.85, 1],
          y: [0, -4, 0]
        };
      case 4: // EL HELICÓPTERO DESPACITO
        return {
          y: [-20, 5, -20],
          rotate: [-4, 4, -4],
          scale: [1, 1.05, 1]
        };
      case 5: // EL ROBOT CONSENTIDO (Rigid stepped feel)
        return {
          x: [0, 15, 15, -15, -15, 0],
          y: [0, -8, 8, -8, 0],
          rotate: [0, 6, -6, 6, 0]
        };
      case 6: // EL SILLY PENGUIN
        return {
          rotate: [-18, 18, -18],
          x: [-10, 10, -10],
          scaleY: [1, 0.94, 1]
        };
      case 7: // LA OLA ESPACIAL
        return {
          scaleY: [0.93, 1.18, 0.93, 1.18, 0.93],
          y: [8, -14, 8, -14, 8]
        };
      case 8: // EL SALTO ASTRONAUTA
        return {
          y: [12, -40, 12],
          scaleY: [0.85, 1.12, 0.85],
          scaleX: [1.1, 0.9, 1.1]
        };
      case 9: // LA GALLINITA DORMILONA
        return {
          scale: [1, 1.04, 0.96, 1],
          x: [0, 10, -10, 0],
          y: [0, 6, -6, 0]
        };
      default:
        return { y: [0, -10, 0] };
    }
  };

  const getDanceTransitionValue = (idx: number) => {
    switch (idx) {
      case 0: return { duration: 5.0, repeat: Infinity, ease: "linear" };
      case 5: return { duration: 4.5, repeat: Infinity, ease: "linear" };
      default: return { duration: 4.0, repeat: Infinity, ease: "easeInOut" };
    }
  };

  const getLeftArmAnimation = (idx: number, stateVal: string) => {
    if (stateVal === 'correct') {
      switch (idx) {
        case 0: return { rotate: [0, 180, 360], originX: "64px", originY: "130px" };
        case 1: return { rotate: [0, 40, 0, -25, 0], originX: "64px", originY: "130px" };
        case 2: return { rotate: [15, 70, 15], scaleX: [1, 0.75, 1], originX: "64px", originY: "130px" };
        case 3: return { rotate: [5, -45, 5], originX: "64px", originY: "130px" };
        case 4: return { rotate: [40, 40, 40], originX: "64px", originY: "130px" };
        case 5: return { rotate: [0, 80, 0, 80, 0], originX: "64px", originY: "130px" };
        case 6: return { rotate: [-15, -15, -15], originX: "64px", originY: "130px" };
        case 7: return { rotate: [0, 95, -15, 95, 0], originX: "64px", originY: "130px" };
        case 8: return { rotate: [130, 130, 130], scaleY: [1, 1.15, 1], originX: "64px", originY: "130px" };
        case 9: return { rotate: [35, 0, 35], originX: "64px", originY: "130px" };
        default: return { rotate: [0, 40, -10, 40, 0], originX: "64px", originY: "130px" };
      }
    }
    if (stateVal === 'incorrect') {
      return { rotate: 75, originX: "64px", originY: "130px" }; // Limp and sad, staying perfectly still
    }
    if (stateVal === 'welcoming' || stateVal === 'talking') {
      return { rotate: [0, 15, -15, 15, 0], originX: "64px", originY: "130px" };
    }
    return { rotate: [0, 3, 0], originX: "64px", originY: "130px" };
  };

  const getRightArmAnimation = (idx: number, stateVal: string) => {
    if (stateVal === 'correct') {
      switch (idx) {
        case 0: return { rotate: [0, -180, -360], originX: "136px", originY: "130px" };
        case 1: return { rotate: [0, -40, 0, 25, 0], originX: "136px", originY: "130px" };
        case 2: return { rotate: [-15, -70, -15], scaleX: [1, 0.75, 1], originX: "136px", originY: "130px" };
        case 3: return { rotate: [-5, 45, -5], originX: "136px", originY: "130px" };
        case 4: return { rotate: [-40, -40, -40], originX: "136px", originY: "130px" };
        case 5: return { rotate: [0, -80, 0, -80, 0], originX: "136px", originY: "130px" };
        case 6: return { rotate: [15, 15, 15], originX: "136px", originY: "130px" };
        case 7: return { rotate: [0, -95, 15, -95, 0], originX: "136px", originY: "130px" };
        case 8: return { rotate: [-130, -130, -130], scaleY: [1, 1.15, 1], originX: "136px", originY: "130px" };
        case 9: return { rotate: [-35, 0, -35], originX: "136px", originY: "130px" };
        default: return { rotate: [0, -45, 12, -45, 0], originX: "136px", originY: "130px" };
      }
    }
    if (stateVal === 'incorrect') {
      return { rotate: -75, originX: "136px", originY: "130px" }; // Limp and sad, staying perfectly still
    }
    if (stateVal === 'welcoming') {
      return { rotate: [0, -65, -35, -65, -45], originX: "136px", originY: "130px" };
    }
    return { rotate: [0, -3, 0], originX: "136px", originY: "130px" };
  };

  const getLeftEarAnimation = (idx: number, stateVal: string) => {
    if (stateVal === 'incorrect') {
      return { rotate: -40, y: 14 }; // Drooped down static on error
    }
    if (stateVal === 'correct') {
      switch (idx) {
        case 4: return { rotate: [0, 360] };
        case 1: return { rotate: [4, -50, 4] };
        case 3: return { rotate: [0, -22, 8, -22, 0] };
        default: return { rotate: [0, -18, 6, -18, 0] };
      }
    }
    return { rotate: [0, -3, 0] };
  };

  const getRightEarAnimation = (idx: number, stateVal: string) => {
    if (stateVal === 'incorrect') {
      return { rotate: 40, y: 14 }; // Drooped down static on error
    }
    if (stateVal === 'correct') {
      switch (idx) {
        case 4: return { rotate: [0, -360] };
        case 1: return { rotate: [-4, 50, -4] };
        case 3: return { rotate: [0, 22, -8, 22, 0] };
        default: return { rotate: [0, 18, -6, 18, 0] };
      }
    }
    return { rotate: [0, 3, 0] };
  };

  const getEarTransition = (idx: number, stateVal: string) => {
    if (stateVal === 'incorrect') {
      return { duration: 0.5, ease: "easeOut" };
    }
    if (stateVal === 'correct' && idx === 4) {
      return { duration: 2.2, repeat: Infinity, ease: "linear" }; // Helicopter slow spin
    }
    return { duration: 1.8, repeat: Infinity, ease: "easeInOut" };
  };

  // Breathing and stillness transition
  const breathTransition = isSadAndStill
    ? { duration: 0.5, ease: "easeOut" }
    : { duration: 3, repeat: Infinity, ease: "easeInOut" };

  return (
    <div className="relative w-52 h-52 md:w-64 md:h-64 mx-auto drop-shadow-xl select-none">
      <motion.svg
        viewBox="0 0 200 220"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        animate={
          state === 'correct'
            ? getDanceAnimationValue(danceIndex)
            : state === 'incorrect'
            ? { y: 22, scaleY: 0.93, rotate: -6 } // Droop down and freeze completely still
            : { y: [0, -3, 0] }
        }
        transition={
          state === 'correct'
            ? getDanceTransitionValue(danceIndex)
            : state === 'incorrect'
            ? { duration: 0.8, ease: "easeOut" } // Static sad response, no repeat!
            : { duration: 4, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <defs>
          <radialGradient id="bunnyFur" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F5EDF8" />
          </radialGradient>
          <radialGradient id="bunnyMuzzle" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF9F5" />
            <stop offset="100%" stopColor="#FFF0E6" />
          </radialGradient>
          <radialGradient id="innerEar" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFAEC9" />
            <stop offset="100%" stopColor="#F87EA5" />
          </radialGradient>
        </defs>

        {/* --- LEGS --- */}
        <g id="bunny-legs">
          <circle cx="65" cy="185" r="16" fill="url(#bunnyFur)" />
          <circle cx="65" cy="185" r="10" fill="#FFAEC9" opacity="0.3" />
          <circle cx="135" cy="185" r="16" fill="url(#bunnyFur)" />
          <circle cx="135" cy="185" r="10" fill="#FFAEC9" opacity="0.3" />
        </g>

        {/* --- BODY --- */}
        <motion.ellipse
          cx="100"
          cy="148"
          rx="42"
          ry="36"
          fill="url(#bunnyFur)"
          animate={isSadAndStill ? { scaleY: 0.94, y: 5 } : { scaleY: [1, 1.03, 1], y: 0 }}
          transition={breathTransition}
        />
        {/* Soft pastel belly patch */}
        <motion.ellipse
          cx="100"
          cy="150"
          rx="22"
          ry="18"
          fill="#FFF0F5"
          opacity="0.95"
          animate={isSadAndStill ? { scale: 0.94, y: 5 } : { scale: [1, 1.02, 1], y: 0 }}
          transition={breathTransition}
        />

        {/* --- ARMS --- */}
        {/* Left Arm */}
        <motion.path
          d="M 64 135 C 40 135, 30 115, 40 105 C 50 95, 64 115, 64 130"
          fill="url(#bunnyFur)"
          animate={getLeftArmAnimation(danceIndex, state)}
          transition={
            isSadAndStill
              ? { duration: 0.5, ease: "easeOut" }
              : { duration: 1.5, repeat: state === 'correct' ? Infinity : state === 'talking' ? Infinity : 0, repeatType: "reverse" }
          }
        />

        {/* Right Arm */}
        <motion.path
          d="M 136 135 C 160 135, 170 115, 160 105 C 150 95, 136 115, 136 130"
          fill="url(#bunnyFur)"
          animate={getRightArmAnimation(danceIndex, state)}
          transition={
            isSadAndStill
              ? { duration: 0.5, ease: "easeOut" }
              : { duration: 1.2, repeat: (state === 'correct' || state === 'welcoming') ? Infinity : 0, repeatType: "reverse" }
          }
        />

        {/* --- LONG RABBIT FLOPPY EARS --- */}
        <g id="bunny-ears">
          {/* Left Floppy Ear */}
          <motion.g
            animate={getLeftEarAnimation(danceIndex, state)}
            transition={getEarTransition(danceIndex, state)}
            style={{ originX: '65px', originY: '75px' }}
          >
            {/* Outer Ear */}
            <path
              d="M 50 78 C 30 15, 75 -2, 72 75 Z"
              fill="url(#bunnyFur)"
              stroke="#D3C2D7"
              strokeWidth="1.5"
            />
            {/* Inner Ear Cotton Pink */}
            <path
              d="M 54 75 C 38 25, 70 12, 67 72 Z"
              fill="url(#innerEar)"
            />
          </motion.g>

          {/* Right Floppy Ear */}
          <motion.g
            animate={getRightEarAnimation(danceIndex, state)}
            transition={getEarTransition(danceIndex, state)}
            style={{ originX: '135px', originY: '75px' }}
          >
            {/* Outer Ear */}
            <path
              d="M 150 78 C 170 15, 125 -2, 128 75 Z"
              fill="url(#bunnyFur)"
              stroke="#D3C2D7"
              strokeWidth="1.5"
            />
            {/* Inner Ear */}
            <path
              d="M 146 75 C 162 25, 130 12, 133 72 Z"
              fill="url(#innerEar)"
            />
          </motion.g>
        </g>

        {/* --- HEAD --- */}
        <motion.ellipse
          cx="100"
          cy="98"
          rx="48"
          ry="40"
          fill="url(#bunnyFur)"
          animate={
            isSadAndStill
              ? { y: 6, rotate: -3 }
              : isTalking
              ? { y: [0, -2, 1, -2, 0] }
              : { y: [0, -1, 0] }
          }
          transition={
            isSadAndStill
              ? { duration: 0.5, ease: "easeOut" }
              : { duration: isTalking ? 0.6 : 2, repeat: Infinity }
          }
        >
          {/* Subtle details highlight */}
          <ellipse cx="100" cy="96" rx="45" ry="37" fill="none" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.6" />
        </motion.ellipse>

        {/* --- EYES --- */}
        {/* Left Eye */}
        {isSadAndStill ? (
          <path d="M 72 94 Q 79 101 86 94" stroke="#475569" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        ) : blink || isHappy ? (
          <path d="M 72 95 Q 79 88 86 95" stroke="#312244" strokeWidth="4" fill="none" strokeLinecap="round" />
        ) : (
          <g>
            <circle cx="79" cy="93" r="6.5" fill="#312244" />
            <circle cx="77" cy="91" r="2.2" fill="#FFFFFF" />
            <circle cx="81" cy="95" r="1" fill="#FFFFFF" />
          </g>
        )}

        {/* Right Eye */}
        {isSadAndStill ? (
          <path d="M 114 94 Q 121 101 128 94" stroke="#475569" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        ) : blink || isHappy ? (
          <path d="M 114 95 Q 121 88 128 95" stroke="#312244" strokeWidth="4" fill="none" strokeLinecap="round" />
        ) : (
          <g>
            <circle cx="121" cy="93" r="6.5" fill="#312244" />
            <circle cx="119" cy="91" r="2.2" fill="#FFFFFF" />
            <circle cx="123" cy="95" r="1" fill="#FFFFFF" />
          </g>
        )}

        {/* --- ROSY CHEEKS --- */}
        <ellipse cx="66" cy="104" rx="8" ry="5" fill="#FB7185" opacity={isSadAndStill ? 0.22 : 0.55} />
        <ellipse cx="134" cy="104" rx="8" ry="5" fill="#FB7185" opacity={isSadAndStill ? 0.22 : 0.55} />

        {/* --- BLUE TEARS SLIDING WHEN SAD --- */}
        {isSadAndStill && (
          <g id="sad-tears">
            {/* Left teardrop */}
            <motion.path
              d="M 74 100 Q 77 108 74 111 Q 71 108 74 100 Z"
              fill="#38BDF8"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: [0, 0.9, 0.9, 0], y: [-4, 6, 12, 12] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
            />
            {/* Right teardrop */}
            <motion.path
              d="M 124 100 Q 127 108 124 111 Q 121 108 124 100 Z"
              fill="#38BDF8"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: [0, 0.9, 0.9, 0], y: [-4, 5, 11, 11] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
            />
          </g>
        )}

        {/* --- SNOUT & NOSE --- */}
        <ellipse cx="100" cy="106" rx="15" ry="10" fill="url(#bunnyMuzzle)" />

        {/* Cute Bunny Nose */}
        <polygon points="96,102 104,102 100,106" fill="#F47EA5" />

        {/* Cute Bunny Whiskers */}
        <line x1="68" y1="106" x2="52" y2="104" stroke="#D3C2D7" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="68" y1="110" x2="53" y2="111" stroke="#D3C2D7" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="132" y1="106" x2="148" y2="104" stroke="#D3C2D7" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="132" y1="110" x2="147" y2="111" stroke="#D3C2D7" strokeWidth="1.5" strokeLinecap="round" />

        {/* Mouth */}
        {isTalking ? (
          <motion.ellipse
            cx="100"
            cy="111"
            rx="4.5"
            ry="4.5"
            fill="#991B1B"
            animate={{ ry: [2, 5, 2] }}
            transition={{ duration: 0.2, repeat: Infinity }}
          />
        ) : isSadAndStill ? (
          <path d="M 94 113 Q 100 105 106 113" stroke="#312244" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        ) : isHappy ? (
          <path d="M 94 108 Q 100 116 106 108" stroke="#312244" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M 95 107 Q 98 109 100 107 Q 102 109 105 107" stroke="#312244" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        )}
      </motion.svg>

      {/* Dynamic Star Sparkles when CORRECT state is activated */}
      {state === 'correct' && (
        <>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 0], opacity: [0, 1, 0], x: [-10, -40], y: [-20, -50] }}
            transition={{ duration: 1 }}
            className="absolute top-10 left-10 text-yellow-400 text-3xl font-bold"
          >
            ★
          </motion.div>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.3, 0], opacity: [0, 1, 0], x: [10, 40], y: [-30, -70] }}
            transition={{ duration: 1.1 }}
            className="absolute top-5 right-10 text-yellow-300 text-4xl font-bold"
          >
            ★
          </motion.div>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.1, 0], opacity: [0, 1, 0], x: [15, 50], y: [10, 30] }}
            transition={{ duration: 0.9 }}
            className="absolute bottom-1/2 right-4 text-emerald-300 text-2xl font-bold"
          >
            ✦
          </motion.div>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.1, 0], opacity: [0, 1, 0], x: [-15, -50], y: [10, 35] }}
            transition={{ duration: 0.95 }}
            className="absolute bottom-1/2 left-4 text-pink-300 text-2xl font-bold"
          >
            ✦
          </motion.div>
        </>
      )}

      {/* Funny Slow Dance Label Panel */}
      {state === 'correct' && (
        <motion.div
          initial={{ opacity: 0, y: 15, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-purple-600 text-white font-black text-2xs md:text-xs tracking-wider uppercase py-1 px-4.5 rounded-full shadow-md whitespace-nowrap border-2 border-white flex items-center gap-1.5"
        >
          <span>🕺 BANDO LENTO:</span>
          <span className="text-yellow-300 font-extrabold">{DANCE_NAMES[danceIndex]}</span>
        </motion.div>
      )}

      {/* Sad & Still State Label Panel */}
      {isSadAndStill && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-slate-500 text-white font-extrabold text-2xs md:text-xs tracking-wider uppercase py-1 px-4.5 rounded-full shadow-md whitespace-nowrap border-2 border-white flex items-center gap-1.5"
        >
          <span>😢 CONEJITO TRISTE Y QUIETO</span>
        </motion.div>
      )}
    </div>
  );
}
