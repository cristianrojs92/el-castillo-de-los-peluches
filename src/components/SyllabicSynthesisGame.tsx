import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowLeft, RotateCcw } from 'lucide-react';
import { TeddyBearState } from './TeddyBear';
import WordTypingChallenge from './WordTypingChallenge';
import { WORDS_DATABASE } from '../data/words';
import { scrambleSyllables } from '../utils/scramble';
import ColorCodedText from './ColorCodedText';

interface SyllabicSynthesisGameProps {
  customVoices: Record<string, string>;
  onLevelComplete: () => void;
  playAudioPrompt: (text: string, id: string) => Promise<void>;
  onBackToMenu: () => void;
  teddyState: TeddyBearState;
  setTeddyState: (state: TeddyBearState) => void;
}

export default function SyllabicSynthesisGame({
  customVoices,
  onLevelComplete,
  playAudioPrompt,
  onBackToMenu,
  teddyState,
  setTeddyState,
}: SyllabicSynthesisGameProps) {
  // Game states
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [choices, setChoices] = useState<{ text: string; initialIndex: number; key: number }[]>([]);
  const [placedIndices, setPlacedIndices] = useState<number[]>([]); // Indexes of syllables placed successfully (e.g. [0, 1])
  const [disabledButtons, setDisabledButtons] = useState<Record<number, boolean>>({}); // Key -> disabled
  const [bubbleText, setBubbleText] = useState<string>('');
  const [isAnswering, setIsAnswering] = useState<boolean>(false);
  const [shakingId, setShakingId] = useState<number | null>(null); // Track key of wrong syllable shaking
  const [isFused, setIsFused] = useState<boolean>(false); // True when current word is fused and Celebrating
  const [showTypingChallenge, setShowTypingChallenge] = useState<boolean>(false); // Show typing challenge after word completion

  const welcomeFired = useRef<boolean>(false);

  // Randomize word order once on component mount
  const shuffledWords = useMemo(() => {
    const arr = [...WORDS_DATABASE];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, []);

  const activeWord = shuffledWords[currentWordIndex] || shuffledWords[0];

  // Initiate current word
  useEffect(() => {
    if (currentWordIndex < shuffledWords.length) {
      initiateWord(currentWordIndex);
    } else {
      onLevelComplete();
    }
  }, [currentWordIndex, shuffledWords.length, onLevelComplete]);

  const initiateWord = async (wordIndex: number) => {
    setIsAnswering(false);
    setIsFused(false);
    setPlacedIndices([]);
    setDisabledButtons({});
    setShakingId(null);

    const targetWord = shuffledWords[wordIndex];
    const scrambled = scrambleSyllables(targetWord.syllables);
    setChoices(scrambled);

    setTeddyState('talking');

    // Welcome message for the word synthesis level
    if (!welcomeFired.current && wordIndex === 0) {
      welcomeFired.current = true;
      setBubbleText('¡HOLA PRINCESA!\n\n¡VAMOS A ARMAR LINDAS PALABRAS!');
      // TTS/Audio placeholder for starting Synthesis
      await playAudioPrompt(
        '¡HOLA PRINCESA! VAMOS A ARMAR LINDAS PALABRAS CON SUS SÍLABAS. ¡ES MUY DIVERTIDO!',
        'synthesis_intro'
      );
      await new Promise((r) => setTimeout(r, 300));
    }

    setBubbleText(`¡MIRA EL DIBUJO!\n\n¿QUÉ SÍLABA VA PRIMERO?`);

    // Voice prompt for current word
    const promptText = `¡Mira el dibujo! Es un ${targetWord.clueName}. Vamos a armar la palabra ${targetWord.clueName}. ¿Qué sílaba va primero? Busca la sílaba... ${targetWord.syllables[0].toLowerCase()}.`;
    
    // CONNECT AUDIO ASSETS BELOW:
    // Here we query playAudioPrompt. You may map custom parent-recordings (e.g., "synthesis_word_[id]") 
    // inside AudioSettings.tsx and use them here.
    await playAudioPrompt(promptText, `synthesis_prompt_${targetWord.id}`);
    
    setTeddyState('idle');
  };

  const handleSyllableClick = async (item: { text: string; initialIndex: number; key: number }) => {
    if (isAnswering || isFused) return;

    // Cancel any ongoing speech to prioritize user action
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setIsAnswering(true);

    const nextCorrectIndex = placedIndices.length; // Next required syllable index (e.g., 0 for first, 1 for second)
    const isCorrect = item.initialIndex === nextCorrectIndex;

    if (isCorrect) {
      // --- CORRECT HIT FLUX ---
      setTeddyState('correct');
      
      // Update placed list
      const newPlaced = [...placedIndices, item.initialIndex];
      setPlacedIndices(newPlaced);
      
      // Gray/hide button below
      setDisabledButtons((prev) => ({ ...prev, [item.key]: true }));

      // Soft positive chime and speak syllable
      await playAudioPrompt('¡SÍ!', 'correct_generic');

      const syllableLower = item.text.toLowerCase();
      setBubbleText(`¡EXCELENTE!\n\nPUSISTE "${item.text}"`);

      // Fire-and-forget: play long audio in background without waiting
      playAudioPrompt(`Pusiste la sílaba ${syllableLower}. ¡Muy bien!`, `synthesis_success_${item.text}`);

      // Check if word completed
      if (newPlaced.length === activeWord.syllables.length) {
        // --- WORD COMPLETED / FUSION / VICTORY ---
        setIsFused(true);
        setTeddyState('correct');
        setBubbleText(`¡REUNISTE LAS SÍLABAS!\n\n${activeWord.word}`);

        await new Promise((r) => setTimeout(r, 600));

        // Fusion celebration feedback
        const fusionBubble = `¡LO LOGRASTE VALIENTE!\n\nFORMAS CON ÉXITO:\n✨ ${activeWord.word} ✨`;
        setBubbleText(fusionBubble);

        // Word spelling out loud
        let spellingTts = `¡Increíble! Armaste la palabra: ¡${activeWord.clueName}! `;
        // E.g. "co ne jo. ¡conejo!"
        activeWord.syllables.forEach((s) => {
          spellingTts += `${s.toLowerCase()}... `;
        });
        spellingTts += `¡${activeWord.clueName.toLowerCase()}!`;

        // CONNECT AUDIO ASSETS BELOW:
        // You can register custom complete word audios like `synthesis_full_[wordId]` in AudioSettings.tsx
        await playAudioPrompt('¡LO LOGRASTE!', 'victory');
        await playAudioPrompt(spellingTts, `synthesis_complete_${activeWord.id}`);

        await new Promise((r) => setTimeout(r, 800));

        // Show typing challenge instead of advancing immediately
        setShowTypingChallenge(true);
      } else {
        // Prompt for the next syllable (fire-and-forget to allow immediate user interaction)
        const nextSyllableToFind = activeWord.syllables[newPlaced.length];
        setBubbleText(`SÍLABA CORRECTA.\n\n¿QUÉ SÍLABA SIGUE AHORA?`);

        // Fire-and-forget: play prompt in background
        playAudioPrompt(
          `¡Eso suena súper! Ahora, ¿qué sílaba sigue? Busca la sílaba... ${nextSyllableToFind.toLowerCase()}.`,
          `synthesis_next_${nextSyllableToFind}`
        );

        setTeddyState('idle');
        setIsAnswering(false);
      }
    } else {
      // --- INCORRECT HIT FLUX (CERO PENALIZACIÓN) ---
      setTeddyState('incorrect');
      setShakingId(item.key); // Trigger Framer Motion shake keyframes

      const correctSyllable = activeWord.syllables[placedIndices.length];
      const wrongTextText = item.text.toLowerCase();
      const rightTextText = correctSyllable.toLowerCase();

      // Update speech bubble beautifully
      setBubbleText(`¡ESA SÍLABA ES "${item.text}"!\n`);

      // Gentle interactive explanation
      await playAudioPrompt(
        `Esa sílaba dice ${wrongTextText}... pero nosotros queremos colocar la sílaba ${rightTextText} para armar ${activeWord.clueName}. ¡Toca la sílaba ${rightTextText}!`,
        `synthesis_wrong_${item.text}_instead_${correctSyllable}`
      );

      // Reset shake state
      setShakingId(null);
      setTeddyState('idle');
      setIsAnswering(false);
    }
  };

  // Handle completion of typing challenge
  const handleTypingComplete = () => {
    setShowTypingChallenge(false);
    setIsFused(false);
    if (currentWordIndex + 1 < shuffledWords.length) {
      setCurrentWordIndex((prev) => prev + 1);
    } else {
      onLevelComplete();
    }
  };

  // Skip / Manual Next word (useful shortcut or parent helper)
  const handleNextWordSkip = () => {
    if (isAnswering || isFused) return;
    if (currentWordIndex + 1 < shuffledWords.length) {
      setCurrentWordIndex((prev) => prev + 1);
    } else {
      onLevelComplete();
    }
  };

  // Reset current word spelling progress
  const handleResetWord = () => {
    if (isAnswering || isFused) return;
    setPlacedIndices([]);
    setDisabledButtons({});
    setBubbleText(`¡VAMOS OTRA VEZ!\n\n¿QUÉ SÍLABA VA PRIMERO?`);
    playAudioPrompt(
      `Vamos a empezar otra vez a armar ${activeWord.clueName}. Busca la sílaba... ${activeWord.syllables[0].toLowerCase()}.`,
      `synthesis_reset_${activeWord.id}`
    );
  };

  // Show typing challenge when a word is completed
  if (showTypingChallenge) {
    return (
      <WordTypingChallenge
        word={activeWord.word}
        emoji={activeWord.emoji}
        onComplete={handleTypingComplete}
        playAudioPrompt={playAudioPrompt}
        teddyState={teddyState}
        setTeddyState={setTeddyState}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between p-4 md:p-6 w-full max-w-lg mx-auto relative select-none">

      {/* 0. Top Bar Actions */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <button
          onClick={() => {
            if ('speechSynthesis' in window) {
              window.speechSynthesis.cancel();
            }
            onBackToMenu();
          }}
          disabled={isAnswering}
          className="px-3 py-1.5 bg-white/90 hover:bg-white text-slate-600 hover:text-purple-700 font-extrabold text-xs rounded-xl border border-slate-250 transition cursor-pointer flex items-center gap-1 active:scale-95 disabled:opacity-50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>INICIO</span>
        </button>

        <div className="bg-purple-100/85 px-3 py-1.5 rounded-full border border-purple-200">
          <p className="text-2xs font-black text-purple-700 uppercase tracking-widest text-center">
            MODO: SÍNTESIS SILÁBICA 🧩
          </p>
        </div>

        <button
          onClick={() => {
            if ('speechSynthesis' in window) {
              window.speechSynthesis.cancel();
            }
            handleResetWord();
          }}
          disabled={isAnswering || isFused || placedIndices.length === 0}
          className="px-3 py-1.5 bg-white/90 hover:bg-white text-slate-500 hover:text-pink-600 font-extrabold text-xs rounded-xl border border-slate-200 transition cursor-pointer flex items-center gap-1 active:scale-95 disabled:opacity-30"
          title="Reiniciar palabra actual"
        >
          <RotateCcw className="w-3" />
          <span className="hidden sm:inline">REINICIAR</span>
        </button>
      </div>

      {/* 1. Progress Indicators (Stars represent completed words) */}
      <div className="bg-white/90 p-3 rounded-2xl shadow-sm border border-purple-100 flex flex-col items-center gap-1.5">
        <div className="text-2xs text-purple-700 font-extrabold uppercase tracking-widest text-center">
          PALABRA {currentWordIndex + 1} DE {shuffledWords.length} • COMPLETA TODAS PARA BAILAR
        </div>
        <div className="flex items-center justify-center gap-1 w-full flex-wrap px-2">
          {shuffledWords.map((w, idx) => {
            const isCompleted = idx < currentWordIndex;
            const isCurrent = idx === currentWordIndex;
            return (
              <motion.div
                key={w.id}
                initial={{ scale: 0.9 }}
                animate={isCompleted ? { scale: [1, 1.25, 1], rotate: [0, 8, -8, 0] } : isCurrent ? { scale: 1.1 } : {}}
                transition={{ duration: 0.4 }}
                className="relative"
              >
                <span
                  className={`text-lg md:text-xl transition-all drop-shadow-3xs ${
                    isCompleted
                      ? 'text-yellow-400 font-bold opacity-100'
                      : isCurrent
                      ? 'text-pink-500 font-black animate-pulse opacity-100'
                      : 'text-slate-350 opacity-40'
                  }`}
                >
                  ★
                </span>
                {isCompleted && (
                  <span className="absolute inset-x-0 -bottom-1 text-4xs font-black text-yellow-600 text-center uppercase tracking-tighter">
                    {w.emoji}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 2. Central Active Illustration Card */}
      <div className="my-3 md:my-5 flex justify-center">

        {/* Word Clue Banner */}
        <div className="h-full flex flex-col justify-center items-center">
          <motion.div
            key={activeWord.id}
            initial={{ opacity: 0, scale: 0.8, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="w-full bg-white border-2 border-pink-100 rounded-[2rem] p-4 text-center shadow-lg flex flex-col items-center justify-center relative overflow-hidden h-44 md:h-48"
          >
            {/* Background elements decoration */}
            <div className="absolute -top-6 -right-6 w-16 h-16 bg-pink-100/40 rounded-full blur-sm" />
            <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-purple-100/40 rounded-full blur-sm" />

            {/* Glowing active sparkle layout */}
            <AnimatePresence>
              {isFused && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1.3, 1.3, 1] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 bg-yellow-400/10 pointer-events-none flex items-center justify-center"
                >
                  <Sparkles className="w-12 h-12 text-yellow-400 animate-spin" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Huge high-contrast Emoji visualizer */}
            <motion.span
              animate={isFused ? { scale: [1, 1.4, 1.4, 1], rotate: [0, 15, -15, 0] } : { y: [0, -3, 0] }}
              transition={{ repeat: isFused ? 2 : Infinity, duration: isFused ? 1.2 : 4 }}
              className="text-6xl md:text-7xl drop-shadow-lg leading-none"
            >
              {activeWord.emoji}
            </motion.span>
            
            <p className="text-10xs font-black text-slate-400 uppercase tracking-widest mt-1.5">
              CONSTRUYE LA PALABRA
            </p>
            <h2 className="text-lg md:text-xl font-black text-purple-700 tracking-tight leading-tighter">
              {isFused ? <ColorCodedText text={activeWord.word} /> : `?? ${activeWord.word.slice(0, 1)}... ??`}
            </h2>
          </motion.div>
        </div>
      </div>

      {/* 3. Syllable Place Drawers / Empty Cajones (The places to drop syllables into) */}
      <div className="w-full mb-4">
        <div className="flex justify-center gap-3.5 flex-wrap items-center">
          {activeWord.syllables.map((syllable, index) => {
            const isSyllablePlaced = placedIndices.includes(index);

            return (
              <div key={index} className="flex flex-col items-center">
                <motion.div
                  className={`w-20 h-20 sm:w-22 sm:h-22 rounded-2xl flex items-center justify-center relative transition-all ${
                    isSyllablePlaced
                      ? 'bg-white border-3 border-purple-400 shadow-md'
                      : 'border-3 border-dashed border-purple-200 bg-white/40'
                  }`}
                  animate={
                    isFused
                      ? {
                          borderColor: 'rgba(236,72,153,1)',
                          backgroundColor: '#FFF0F5',
                          scale: [1, 1.05, 1],
                          boxShadow: ['0 4px 6px -1px rgba(0,0,0,0.1)', '0 10px 15px -3px rgba(219,39,119,0.3)', '0 4px 6px -1px rgba(0,0,0,0.1)'],
                        }
                      : {}
                  }
                  transition={{ duration: 1, repeat: isFused ? Infinity : 0 }}
                >
                  <AnimatePresence>
                    {isSyllablePlaced && (
                      <motion.span
                        key={syllable}
                        initial={{ y: 90, opacity: 0, scale: 0.3 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ type: 'spring', damping: 11, stiffness: 95 }}
                        className="text-3xl sm:text-4xl font-extrabold font-sans tracking-wide uppercase select-none"
                      >
                        <ColorCodedText text={syllable} />
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Little drawer order numbers */}
                  <span className="absolute bottom-1 right-1.5 text-4xs font-black select-none text-purple-300">
                    {index + 1}
                  </span>
                </motion.div>
                
                {/* Arrow or dot under active next slot */}
                {!isFused && placedIndices.length === index && (
                  <motion.div
                    animate={{ y: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="w-2.5 h-2.5 rounded-full bg-pink-500 mt-1.5 border border-white shadow-sm"
                  />
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* 4. Speech Bubble & Tap-to-Place Syllables Option Buttons */}
      <div className="space-y-4.5 w-full">
        
        {/* Central Speech Dialog bubble with soft borders */}
        <div className="bg-white p-4.5 px-5.5 rounded-[30px] shadow-lg border-2 border-pink-150 relative">
          <div className="absolute -top-3.5 left-1/4 sm:left-1/3 w-7 h-7 bg-white rotate-45 border-l-2 border-t-2 border-pink-150"></div>
          <p className="text-base sm:text-lg font-black tracking-tight text-center text-slate-800 uppercase leading-snug whitespace-pre-line min-h-[50px] flex items-center justify-center">
            {bubbleText}
          </p>
        </div>

        {/* Syllables Choices grid */}
        <div className="flex justify-center gap-4.5 pt-1 flex-wrap">
          <AnimatePresence mode="popLayout">
            {choices.map((item) => {
              const isPlaced = disabledButtons[item.key];
              const isThisShaking = shakingId === item.key;

              return (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 1, scale: 0.95 }}
                  animate={
                    isPlaced
                      ? { opacity: 0.15, scale: 0.75, pointerEvents: 'none', y: -10 }
                      : isThisShaking
                      ? {
                          x: [-12, 12, -10, 10, -6, 6, -3, 3, 0],
                          scale: 0.96,
                          originY: '100%',
                          transition: { duration: 0.45 },
                        }
                      : { opacity: 1, scale: 1, x: 0 }
                  }
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', damping: 12 }}
                  className="w-24 sm:w-28"
                >
                  <button
                    onClick={() => handleSyllableClick(item)}
                    disabled={isPlaced || isAnswering || isFused}
                    className="w-full py-5 sm:py-7 bg-white border-b-[8px] border-slate-250 hover:border-b-[10px] active:border-b-0 active:translate-y-1.5 focus:outline-none rounded-2xl shadow-md sm:shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 group cursor-pointer select-none"
                    style={{
                      fontFamily: '"Fredoka", "Arial Rounded MT Bold", sans-serif',
                    }}
                  >
                    <span className="text-3xl sm:text-4xl font-black font-sans tracking-tight select-none">
                      <ColorCodedText text={item.text} />
                    </span>
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Parental/Assistant Skip Helper line */}
      <div className="mt-5.5 flex justify-center">
        <button
          onClick={() => {
            if ('speechSynthesis' in window) {
              window.speechSynthesis.cancel();
            }
            handleNextWordSkip();
          }}
          disabled={isAnswering || isFused}
          className="text-4xs font-black text-slate-400 hover:text-purple-600 transition tracking-widest uppercase cursor-pointer py-1 px-3 bg-white/20 hover:bg-white/60 rounded-lg"
        >
          Saltar palabra 👉
        </button>
      </div>

    </div>
  );
}
