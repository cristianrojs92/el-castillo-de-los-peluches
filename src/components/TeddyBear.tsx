import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import './ChibiBunny.css';

export type TeddyBearState = 'idle' | 'talking' | 'correct' | 'incorrect' | 'welcoming';

interface TeddyBearProps {
  state: TeddyBearState;
}

export default function TeddyBear({ state }: TeddyBearProps) {
  const [blink, setBlink] = useState(false);

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

  // "Six Seven" trend dance values based on the HTML provided
  const danceBodyValues = {
    y: [0, -15, 0, -15, 0],
    rotate: [-4, 0, 4, 0, -4],
    times: [0, 0.25, 0.5, 0.75, 1],
  };

  const danceLeftArmValues = {
    rotate: [10, 130, 130, 10, 10],
    y: [0, -5, -5, 0, 0],
    times: [0, 0.1, 0.4, 0.5, 1],
  };

  const danceRightArmValues = {
    rotate: [-10, -10, -130, -130, -10],
    y: [0, 0, -5, -5, 0],
    times: [0, 0.5, 0.6, 0.9, 1],
  };

  const popSixValues = {
    scale: [0, 1.1, 1.1, 0, 0],
    rotate: [-20, -10, -10, -20, -20],
    opacity: [0, 1, 1, 0, 0],
    times: [0, 0.15, 0.35, 0.5, 1],
  };

  const popSevenValues = {
    scale: [0, 0, 1.1, 1.1, 0],
    rotate: [20, 20, 10, 10, 20],
    opacity: [0, 0, 1, 1, 0],
    times: [0, 0.5, 0.65, 0.85, 1],
  };

  // Animation getters
  const getBodyAnimation = (stateVal: string) => {
    if (stateVal === 'correct') return danceBodyValues;
    if (stateVal === 'incorrect') return { y: 22, scaleY: 0.93, rotate: -6 };
    return { y: [0, -3, 0] };
  };

  const getBodyTransition = (stateVal: string) => {
    if (stateVal === 'correct') return { duration: 2, repeat: Infinity, ease: "easeInOut" };
    if (stateVal === 'incorrect') return { duration: 0.8, ease: "easeOut" };
    return { duration: 4, repeat: Infinity, ease: "easeInOut" };
  };

  const getLeftEarAnimation = (stateVal: string) => {
    if (stateVal === 'correct') return { rotate: [-35, -15, -35], times: [0, 0.5, 1] };
    if (stateVal === 'incorrect') return { rotate: -65, y: 14 };
    return { rotate: [-25, -28, -25] };
  };

  const getRightEarAnimation = (stateVal: string) => {
    if (stateVal === 'correct') return { rotate: [15, 35, 15], times: [0, 0.5, 1] };
    if (stateVal === 'incorrect') return { rotate: 65, y: 14 };
    return { rotate: [25, 28, 25] };
  };

  const getEarTransition = (stateVal: string) => {
    if (stateVal === 'incorrect') return { duration: 0.5, ease: "easeOut" };
    if (stateVal === 'correct') return { duration: 2, repeat: Infinity, ease: "easeInOut" };
    return { duration: 1.8, repeat: Infinity, ease: "easeInOut" };
  };

  const getLeftArmAnimation = (stateVal: string) => {
    if (stateVal === 'correct') return danceLeftArmValues;
    if (stateVal === 'incorrect') return { rotate: 75 }; // Limp and sad
    if (stateVal === 'welcoming' || stateVal === 'talking') return { rotate: [0, 15, -15, 15, 0] };
    return { rotate: [0, 3, 0] };
  };

  const getRightArmAnimation = (stateVal: string) => {
    if (stateVal === 'correct') return danceRightArmValues;
    if (stateVal === 'incorrect') return { rotate: -75 }; // Limp and sad
    if (stateVal === 'welcoming') return { rotate: [0, -65, -35, -65, -45] };
    return { rotate: [0, -3, 0] };
  };

  const getArmTransition = (stateVal: string) => {
    if (stateVal === 'correct') return { duration: 2, repeat: Infinity, ease: "easeInOut" };
    if (stateVal === 'incorrect') return { duration: 0.5, ease: "easeOut" };
    return { duration: 1.5, repeat: stateVal === 'talking' || stateVal === 'welcoming' ? Infinity : 0, repeatType: "reverse" as const };
  };

  const breathTransition = isSadAndStill
    ? { duration: 0.5, ease: "easeOut" }
    : { duration: 3, repeat: Infinity, ease: "easeInOut" };

  return (
    <div className="relative w-52 h-52 md:w-64 md:h-64 mx-auto drop-shadow-xl select-none flex justify-center items-center">
      
      <motion.div
        className="bunny-chibi"
        animate={getBodyAnimation(state)}
        transition={getBodyTransition(state)}
      >
        {/* Números flotantes de la coreografía "Six Seven" */}
        {state === 'correct' && (
          <>
            <motion.div
              className="number number-6"
              animate={popSixValues}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              6
            </motion.div>
            <motion.div
              className="number number-7"
              animate={popSevenValues}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              7
            </motion.div>
          </>
        )}

        {/* Orejas */}
        <motion.div
          className="bunny-chibi-ear left"
          animate={getLeftEarAnimation(state)}
          transition={getEarTransition(state)}
        >
          <div className="bunny-chibi-ear-inner"></div>
        </motion.div>
        
        <motion.div
          className="bunny-chibi-ear right"
          animate={getRightEarAnimation(state)}
          transition={getEarTransition(state)}
        >
          <div className="bunny-chibi-ear-inner"></div>
        </motion.div>

        {/* Cabeza */}
        <motion.div
          className="bunny-chibi-head"
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
          <div className="bunny-chibi-face-pattern-center"></div>
          <div className={`bunny-chibi-blush left ${isSadAndStill ? 'opacity-30' : ''}`}></div>
          <div className={`bunny-chibi-blush right ${isSadAndStill ? 'opacity-30' : ''}`}></div>
          
          <motion.div 
            className="bunny-chibi-eye left"
            animate={{ scaleY: (blink || isHappy) ? [1, 0.1, 1] : isSadAndStill ? 0.8 : 1 }}
            transition={blink ? { duration: 0.15 } : { duration: 0 }}
          ></motion.div>
          <motion.div 
            className="bunny-chibi-eye right"
            animate={{ scaleY: (blink || isHappy) ? [1, 0.1, 1] : isSadAndStill ? 0.8 : 1 }}
            transition={blink ? { duration: 0.15 } : { duration: 0 }}
          ></motion.div>
          
          <div className="bunny-chibi-nose"></div>
          
          <motion.div 
            className={`bunny-chibi-mouth ${isSadAndStill ? 'sad' : ''}`}
            animate={isTalking ? { scaleY: [1, 2.5, 1], y: [0, 2, 0] } : {}}
            transition={{ duration: 0.2, repeat: Infinity }}
          ></motion.div>

          {/* Lágrimas para estado triste */}
          {isSadAndStill && (
            <>
              <motion.div
                className="bunny-chibi-tear left"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: [0, 0.9, 0.9, 0], y: [-4, 6, 12, 12] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
              />
              <motion.div
                className="bunny-chibi-tear right"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: [0, 0.9, 0.9, 0], y: [-4, 5, 11, 11] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
              />
            </>
          )}
        </motion.div>

        {/* Cuerpo */}
        <motion.div
          className="bunny-chibi-body"
          animate={isSadAndStill ? { scaleY: 0.94, y: 5 } : { scaleY: [1, 1.03, 1], y: 0 }}
          transition={breathTransition}
        ></motion.div>

        {/* Brazos */}
        <motion.div
          className="bunny-chibi-arm left"
          animate={getLeftArmAnimation(state)}
          transition={getArmTransition(state)}
        ></motion.div>
        
        <motion.div
          className="bunny-chibi-arm right"
          animate={getRightArmAnimation(state)}
          transition={getArmTransition(state)}
        ></motion.div>

        {/* Cola */}
        <div className="bunny-chibi-tail"></div>

        {/* Piernas */}
        <div className="bunny-chibi-leg left"></div>
        <div className="bunny-chibi-leg right"></div>
      </motion.div>

      {/* Sombra debajo del conejo */}
      <motion.div 
        className="bunny-chibi-shadow absolute -bottom-5"
        animate={state === 'correct' ? { scale: [1, 0.8, 1], opacity: [0.25, 0.1, 0.25] } : {}}
        transition={state === 'correct' ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : {}}
      ></motion.div>

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

      {/* Trend Dance Label Panel */}
      {state === 'correct' && (
        <motion.div
          initial={{ opacity: 0, y: 15, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-purple-600 text-white font-black text-2xs md:text-xs tracking-wider uppercase py-1 px-4.5 rounded-full shadow-md whitespace-nowrap border-2 border-white flex items-center gap-1.5"
        >
          <span>🕺 BAILE TREND:</span>
          <span className="text-yellow-300 font-extrabold">SIX SEVEN ✨</span>
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
