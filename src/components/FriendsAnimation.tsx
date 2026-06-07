import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw } from 'lucide-react';
import TeddyBear from './TeddyBear';

interface FriendsAnimationProps {
  onAnimationEnd: () => void;
  playAudioPrompt: (text: string, id: string) => Promise<void>;
}

export default function FriendsAnimation({ onAnimationEnd, playAudioPrompt }: FriendsAnimationProps) {
  const [celebrationStep, setCelebrationStep] = useState<'dancing' | 'transitioning'>('dancing');

  useEffect(() => {
    // Play celebratory speech triggers: First general happiness, then the reward voice trace
    const playCelPrompts = async () => {
      // Small delay to let components render
      await new Promise((r) => setTimeout(r, 200));
      await playAudioPrompt('¡LO LOGRASTE! ¡QUÉ INTELIGENTE ERES!', 'correct_generic');
      await new Promise((r) => setTimeout(r, 600));
      await playAudioPrompt('¡LO LOGRASTE! COMO PREMIO, ¡VAMOS A PINTAR!', 'victory');
      
      // Keep dancing for a total of ~8 seconds
      setTimeout(() => {
        setCelebrationStep('transitioning');
        setTimeout(() => {
          onAnimationEnd();
        }, 800);
      }, 7300);
    };

    playCelPrompts();
  }, [onAnimationEnd, playAudioPrompt]);

  // Generate simple random stars/confetti particle offsets
  const starsArray = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 90 + 5}%`,
    top: `${Math.random() * 70 + 5}%`,
    scale: Math.random() * 0.5 + 0.6,
    delay: Math.random() * 1.5,
    hue: Math.random() * 360,
  }));

  return (
    <div className="absolute inset-0 z-40 bg-gradient-to-b from-purple-100 via-pink-50 to-sky-100 flex flex-col justify-between p-6 overflow-hidden">
      {/* Slow rotating spotlight visual effects */}
      <div className="absolute inset-x-0 top-0 bottom-1/3 flex justify-around opacity-20 pointer-events-none -z-10">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="w-[600px] h-[600px] bg-gradient-to-tr from-cyan-200/50 via-transparent to-pink-200/50 rounded-full blur-2xl origin-center"
        />
        <motion.div
          animate={{ rotate: [360, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          className="w-[500px] h-[500px] bg-gradient-to-bl from-yellow-100/50 via-transparent to-purple-200/50 rounded-full blur-2xl origin-center"
        />
      </div>

      {/* Floating Sparkles */}
      {starsArray.map((star) => (
        <motion.div
          key={star.id}
          style={{
            position: 'absolute',
            left: star.left,
            top: star.top,
            color: `hsl(${star.hue}, 90%, 65%)`,
          }}
          animate={{
            y: [0, -40, 0],
            scale: [0, star.scale, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 2.2 + star.delay % 1,
            repeat: Infinity,
            delay: star.delay,
            ease: 'easeInOut',
          }}
          className="text-2xl drop-shadow pointer-events-none select-none"
        >
          ✦
        </motion.div>
      ))}

      {/* Greeting Title */}
      <div className="text-center mt-6 z-10">
        <motion.h1
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
          className="text-4xl md:text-5xl font-black text-rose-500 font-sans tracking-tight filter drop-shadow-sm"
        >
          ¡SÚPER BIEN!
        </motion.h1>
        <p className="text-base text-purple-700 font-semibold tracking-wide uppercase">¡TUS PELUCHES ESTÁN BAILANDO DE ALEGRÍA!</p>
      </div>

      {/* DANCING PELUCHES ROW */}
      <div className="flex items-end justify-center gap-2 md:gap-8 w-full max-w-4xl mx-auto h-2/3 pb-10 z-10 select-none">
        
        {/* --- DANCING BUNNY (YELLOW) --- */}
        <motion.div
          animate={{
            y: [0, -40, 0, -25, 0],
            rotate: [0, -8, 8, -4, 0],
            scaleY: [1, 0.85, 1.05, 0.95, 1],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.1,
          }}
          className="w-32 h-44 md:w-44 md:h-56 filter drop-shadow-md"
        >
          <svg viewBox="0 0 100 120" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bunnyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FEF08A" /> {/* Yellow-200 */}
                <stop offset="100%" stopColor="#FACC15" /> {/* Yellow-400 */}
              </linearGradient>
            </defs>
            {/* Long Cute Ears */}
            <motion.ellipse
              cx="35"
              cy="25"
              rx="9"
              ry="22"
              fill="url(#bunnyGrad)"
              animate={{ rotate: [0, -15, 10, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ originX: '35px', originY: '45px' }}
            />
            <ellipse cx="35" cy="25" rx="4" ry="14" fill="#FDA4AF" />

            <motion.ellipse
              cx="65"
              cy="25"
              rx="9"
              ry="22"
              fill="url(#bunnyGrad)"
              animate={{ rotate: [0, 15, -10, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
              style={{ originX: '65px', originY: '45px' }}
            />
            <ellipse cx="65" cy="25" rx="4" ry="14" fill="#FDA4AF" />

            {/* Feet */}
            <circle cx="38" cy="112" r="10" fill="url(#bunnyGrad)" />
            <circle cx="62" cy="112" r="10" fill="url(#bunnyGrad)" />

            {/* Body */}
            <ellipse cx="50" cy="88" rx="26" ry="22" fill="url(#bunnyGrad)" />
            <ellipse cx="50" cy="88" rx="14" ry="12" fill="#E0F2FE" />

            {/* Arms */}
            <motion.ellipse
              cx="20"
              cy="75"
              rx="8"
              ry="14"
              fill="url(#bunnyGrad)"
              animate={{ rotate: [-20, 45, -20] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
              style={{ originX: '25px', originY: '70px' }}
            />
            <motion.ellipse
              cx="80"
              cy="75"
              rx="8"
              ry="14"
              fill="url(#bunnyGrad)"
              animate={{ rotate: [20, -45, 20] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse', delay: 0.1 }}
              style={{ originX: '75px', originY: '70px' }}
            />

            {/* Head */}
            <ellipse cx="50" cy="52" rx="25" ry="21" fill="url(#bunnyGrad)" />

            {/* Eyes */}
            <ellipse cx="40" cy="48" rx="2" ry="4" fill="#3F2B0F" />
            <circle cx="39" cy="46" r="0.8" fill="#FFF" />
            <ellipse cx="60" cy="48" rx="2" ry="4" fill="#3F2B0F" />
            <circle cx="59" cy="46" r="0.8" fill="#FFF" />

            {/* Pink cheeks */}
            <circle cx="35" cy="54" r="4" fill="#FDA4AF" opacity="0.6" />
            <circle cx="65" cy="54" r="4" fill="#FDA4AF" opacity="0.6" />

            {/* Nose and tiny mouth */}
            <polygon points="48,53 52,53 50,55" fill="#FDA4AF" />
            <path d="M 48 57 Q 50 59 52 57" stroke="#3F2B0F" strokeWidth="1" fill="none" />
          </svg>
        </motion.div>

        {/* --- DANCING CONEJITO DE PELUCHE (CENTRAL MASTER PIECE) --- */}
        <div className="w-36 h-48 md:w-56 md:h-72 transform translate-y-3">
          <TeddyBear state="correct" />
        </div>

        {/* --- DANCING UNICORN (MAGICAL SPIRIT) --- */}
        <motion.div
          animate={{
            y: [0, -35, 0, -15, 0],
            rotate: [0, 10, -10, 5, 0],
            scaleY: [1, 0.88, 1.04, 0.96, 1],
          }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.25,
          }}
          className="w-32 h-44 md:w-44 md:h-56 filter drop-shadow-md"
        >
          <svg viewBox="0 0 100 120" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="unicornGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E0F2FE" /> {/* Light blue-50 */}
                <stop offset="100%" stopColor="#F5F3FF" /> {/* violet-50 */}
              </linearGradient>
              <linearGradient id="hornGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F472B6" />
                <stop offset="50%" stopColor="#FCD34D" />
                <stop offset="100%" stopColor="#67E8F9" />
              </linearGradient>
              <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FB7185" />
                <stop offset="100%" stopColor="#C084FC" />
              </linearGradient>
            </defs>

            {/* Horn (magical pulsing glow!) */}
            <motion.polygon
              points="50,6 45,28 55,28"
              fill="url(#hornGrad)"
              animate={{ scale: [1, 1.15, 1], filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'] }}
              transition={{ duration: 1, repeat: Infinity }}
              style={{ originX: '50px', originY: '28px' }}
            />

            {/* Feet */}
            <rect x="28" y="105" width="14" height="12" fill="#F471B5" rx="3" />
            <rect x="58" y="105" width="14" height="12" fill="#F471B5" rx="3" />

            {/* Body */}
            <ellipse cx="50" cy="85" rx="24" ry="24" fill="url(#unicornGrad)" stroke="#E9D5FF" strokeWidth="1" />
            <ellipse cx="50" cy="85" rx="11" ry="11" fill="#FAE8FF" />

            {/* Arms */}
            <motion.path
              d="M 28 85 A 15 15 0 0 1 12 70"
              stroke="url(#unicornGrad)"
              strokeWidth="9"
              strokeLinecap="round"
              fill="none"
              animate={{ rotate: [-30, 40, -30] }}
              transition={{ duration: 0.7, repeat: Infinity, repeatType: 'reverse' }}
              style={{ originX: '28px', originY: '85px' }}
            />
            <motion.path
              d="M 72 85 A 15 15 0 0 0 88 70"
              stroke="url(#unicornGrad)"
              strokeWidth="9"
              strokeLinecap="round"
              fill="none"
              animate={{ rotate: [30, -40, 30] }}
              transition={{ duration: 0.7, repeat: Infinity, repeatType: 'reverse', delay: 0.15 }}
              style={{ originX: '72px', originY: '85px' }}
            />

            {/* Mane (Hair behind head) */}
            <path d="M 32 30 Q 15 45 32 70" fill="url(#hairGrad)" />

            {/* Ears */}
            <path d="M 32 32 L 20 18 L 38 28 Z" fill="url(#unicornGrad)" />
            <path d="M 32 32 L 23 21 L 34 29 Z" fill="#FDA4AF" />

            <path d="M 68 32 L 80 18 L 62 28 Z" fill="url(#unicornGrad)" />
            <path d="M 68 32 L 77 21 L 66 29 Z" fill="#FDA4AF" />

            {/* Head */}
            <ellipse cx="50" cy="48" rx="24" ry="21" fill="url(#unicornGrad)" stroke="#E9D5FF" strokeWidth="1" />

            {/* Snout */}
            <ellipse cx="50" cy="55" rx="14" ry="8" fill="#FAE8FF" />
            <circle cx="46" cy="54" r="1.5" fill="#C084FC" />
            <circle cx="54" cy="54" r="1.5" fill="#C084FC" />

            {/* Smiling Eyes */}
            <path d="M 36 43 Q 41 37 46 43" stroke="#4B5563" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 54 43 Q 59 37 64 43" stroke="#4B5563" strokeWidth="2" fill="none" strokeLinecap="round" />

            {/* Blush */}
            <ellipse cx="32" cy="51" rx="4" ry="3" fill="#FDA4AF" opacity="0.6" />
            <ellipse cx="68" cy="51" rx="4" ry="3" fill="#FDA4AF" opacity="0.6" />
          </svg>
        </motion.div>

      </div>

      {/* Floating interactive instructions in footer */}
      <div className="text-center mb-6 z-10">
        <motion.p
          animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-lg md:text-xl font-bold font-sans text-rose-500 rounded-full px-8 py-2.5 bg-white/75 inline-block border-2 border-pink-200 shadow-sm uppercase"
        >
          💖 ¡PREPARANDO EL PALACIO DE COLORES! PINTEMOS JUNTAS... 💖
        </motion.p>
      </div>

      {/* Fade overlay for transitioning into the coloring book */}
      <AnimatePresence>
        {celebrationStep === 'transitioning' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 bg-white z-50 flex items-center justify-center text-4xl font-sans font-bold text-pink-500"
          >
            <div className="text-center space-y-4">
              <RefreshCw className="w-16 h-16 text-pink-400 animate-spin mx-auto" />
              <p className="tracking-tight uppercase">¡SÍ! ¡A PINTAR!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
