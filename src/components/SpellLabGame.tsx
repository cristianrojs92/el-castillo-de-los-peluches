import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { TeddyBearState } from './TeddyBear';
import { COMPLEX_WORDS_DATABASE, ComplexWordData } from '../data/complexWords';
import { scrambleSyllables } from '../utils/scramble';

interface SpellLabGameProps {
  customVoices: Record<string, string>;
  onLevelComplete: () => void;
  playAudioPrompt: (text: string, id: string) => Promise<void>;
  onBackToMenu: () => void;
  teddyState: TeddyBearState;
  setTeddyState: (state: TeddyBearState) => void;
  phase: 'trabadas' | 'inversas';
}

const WORDS_PER_ROUND = 6;
const VOWEL_RE = /[AEIOUÁÉÍÓÚ]/;

interface ChoiceItem {
  text: string;
  initialIndex: number;
  key: number;
}

const pickRoundWords = (phase: 'trabadas' | 'inversas'): ComplexWordData[] =>
  COMPLEX_WORDS_DATABASE.filter((w) => w.phase === phase)
    .sort(() => Math.random() - 0.5)
    .slice(0, WORDS_PER_ROUND);

// Visual scaffolding (HU 2.1 + 2.3): consonants in blue, vowels in pink.
// When a sílaba trabada appears, its two leading consonants "hug" (slide together).
function ColorCodedSyllable({ syllable, hug = false }: { syllable: string; hug?: boolean }) {
  const letters = syllable.split('');
  const isTrabada = letters.length >= 2 && !VOWEL_RE.test(letters[0]) && !VOWEL_RE.test(letters[1]);

  return (
    <span className="inline-flex items-baseline">
      {letters.map((letter, i) => {
        const isVowel = VOWEL_RE.test(letter);
        const doesHug = hug && isTrabada && i < 2;
        return (
          <motion.span
            key={i}
            initial={doesHug ? { x: i === 0 ? -10 : 10 } : false}
            animate={doesHug ? { x: 0, scale: [1, 1.2, 1] } : undefined}
            transition={
              doesHug
                ? {
                    x: { type: 'spring', damping: 9, stiffness: 110, delay: 0.2 },
                    scale: { delay: 0.55, duration: 0.35 },
                  }
                : undefined
            }
            className={`${isVowel ? 'text-pink-500' : 'text-blue-600'} select-none`}
          >
            {letter}
          </motion.span>
        );
      })}
    </span>
  );
}

export default function SpellLabGame({
  customVoices,
  onLevelComplete,
  playAudioPrompt,
  onBackToMenu,
  teddyState,
  setTeddyState,
  phase,
}: SpellLabGameProps) {
  const [roundWords] = useState<ComplexWordData[]>(() => pickRoundWords(phase));
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [choices, setChoices] = useState<ChoiceItem[]>([]);
  const [placedCount, setPlacedCount] = useState<number>(0);
  const [disabledChoices, setDisabledChoices] = useState<Record<number, boolean>>({});
  const [shakingKey, setShakingKey] = useState<number | null>(null);
  const [isAnswering, setIsAnswering] = useState<boolean>(false);
  const [isFused, setIsFused] = useState<boolean>(false);
  const [bubbleText, setBubbleText] = useState<string>('');

  const introFired = useRef<boolean>(false);
  // Guards initiateWord's async continuation if the child answers while the
  // intro/prompt audio is still playing (same pattern as ArticleGame)
  const answeredRef = useRef<boolean>(false);

  const activeWord = roundWords[currentIndex] || roundWords[0];

  useEffect(() => {
    initiateWord();
  }, [currentIndex]);

  const initiateWord = async () => {
    setIsAnswering(false);
    setIsFused(false);
    setPlacedCount(0);
    setDisabledChoices({});
    setShakingKey(null);
    answeredRef.current = false;

    const targetWord = roundWords[currentIndex];
    setChoices(scrambleSyllables(targetWord.syllables));
    setTeddyState('talking');

    if (!introFired.current && currentIndex === 0) {
      introFired.current = true;
      setBubbleText('¡BIENVENIDA AL LABORATORIO!\n\n¡VAMOS A ARMAR PALABRAS MÁGICAS!');
      await playAudioPrompt(
        '¡BIENVENIDA AL LABORATORIO DE LOS HECHIZOS! VAMOS A ARMAR PALABRAS MÁGICAS.',
        'lab_intro'
      );
      await new Promise((r) => setTimeout(r, 300));
    }

    if (answeredRef.current) return;
    setBubbleText('¡MIRÁ EL DIBUJO!\n\n¿QUÉ SÍLABA VA PRIMERO?');

    await playAudioPrompt(
      `¡Mirá el dibujo! Es ${targetWord.clueName}. Vamos a armar la palabra ${targetWord.clueName}. ¿Qué sílaba va primero? Tocá la sílaba... ${targetWord.syllables[0].toLowerCase()}.`,
      `lab_prompt_${targetWord.id}`
    );

    if (answeredRef.current) return;
    setTeddyState('idle');
  };

  const handleSyllableClick = async (item: ChoiceItem) => {
    if (isAnswering || isFused) return;

    // Cancel any ongoing speech to prioritize user action
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setIsAnswering(true);
    answeredRef.current = true;

    if (item.initialIndex === placedCount) {
      // --- CORRECT: the syllable flies into its drawer ---
      setTeddyState('correct');
      const newPlaced = placedCount + 1;
      setPlacedCount(newPlaced);
      setDisabledChoices((prev) => ({ ...prev, [item.key]: true }));

      await playAudioPrompt('¡SÍ!', 'correct_generic');
      // Play the syllable alone: uses the parent's dragged-sound recording when available
      playAudioPrompt(item.text, item.text);

      if (newPlaced === activeWord.syllables.length) {
        // --- SPELL COMPLETED (HU 3.3): drawers shine and fuse ---
        setIsFused(true);
        setTeddyState('correct');
        setBubbleText(`¡HECHIZO LOGRADO!\n\n✨ ${activeWord.word} ✨`);

        await playAudioPrompt('¡HECHIZO LOGRADO! ¡SOS UNA MAGA DE LAS PALABRAS!', 'lab_spell_done');

        let spellingTts = `¡Armaste la palabra ${activeWord.clueName}! `;
        activeWord.syllables.forEach((s) => {
          spellingTts += `${s.toLowerCase()}... `;
        });
        spellingTts += `¡${activeWord.clueName}!`;
        await playAudioPrompt(spellingTts, `lab_complete_${activeWord.id}`);

        await new Promise((r) => setTimeout(r, 1200));

        if (currentIndex + 1 < roundWords.length) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          onLevelComplete();
        }
      } else {
        const nextSyllable = activeWord.syllables[newPlaced];
        setBubbleText('¡SÍLABA CORRECTA!\n\n¿CUÁL SIGUE AHORA?');
        // Fire-and-forget so the next tap is immediate
        playAudioPrompt(
          `¡Eso es! Ahora fijate, ¿qué sílaba sigue? Tocá la sílaba... ${nextSyllable.toLowerCase()}.`,
          `lab_next_${activeWord.id}_${newPlaced}`
        );
        setTeddyState('idle');
        setIsAnswering(false);
      }
    } else {
      // --- WRONG (HU 3.1/3.2, CERO PENALIZACIÓN): gentle shake + corrective hint ---
      setTeddyState('incorrect');
      setShakingKey(item.key);
      const rightSyllable = activeWord.syllables[placedCount];
      setBubbleText(`ESA SÍLABA ES "${item.text}"...\n\n¡FIJATE BIEN!`);

      await playAudioPrompt(
        `Esa sílaba es ${item.text.toLowerCase()}... pero estamos buscando la sílaba ${rightSyllable.toLowerCase()}.`,
        `lab_wrong_${item.text}_instead_${rightSyllable}`
      );
      await playAudioPrompt('FIJATE BIEN Y PROBÁ CON OTRA SÍLABA.', 'lab_hint_retry');
      // Replay the target syllable, using the parent's recording when available
      await playAudioPrompt(rightSyllable, rightSyllable);

      setShakingKey(null);
      setTeddyState('idle');
      setIsAnswering(false);
    }
  };

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
            LABORATORIO DE HECHIZOS 🧪 {phase === 'trabadas' ? '· TRABADAS' : '· INVERSAS'}
          </p>
        </div>

        <div className="w-16" />
      </div>

      {/* 1. Progress Indicators */}
      <div className="bg-white/90 p-3 rounded-2xl shadow-sm border border-purple-100 flex flex-col items-center gap-1.5">
        <div className="text-2xs text-purple-700 font-extrabold uppercase tracking-widest text-center">
          HECHIZO {currentIndex + 1} DE {roundWords.length} • COMPLETÁ TODOS PARA BAILAR
        </div>
        <div className="flex items-center justify-center gap-1.5 w-full flex-wrap px-2">
          {roundWords.map((w, idx) => {
            const isCompleted = idx < currentIndex || (idx === currentIndex && isFused);
            const isCurrent = idx === currentIndex;
            return (
              <motion.span
                key={w.id}
                animate={isCompleted ? { scale: [1, 1.25, 1], rotate: [0, 8, -8, 0] } : isCurrent ? { scale: 1.1 } : {}}
                transition={{ duration: 0.4 }}
                className={`text-lg md:text-xl transition-all ${
                  isCompleted ? 'opacity-100' : isCurrent ? 'opacity-100 animate-pulse' : 'opacity-30 grayscale'
                }`}
              >
                🧪
              </motion.span>
            );
          })}
        </div>
      </div>

      {/* 2. Central Spell Card: emoji + drawers */}
      <div className="my-3 md:my-5 flex justify-center">
        <motion.div
          key={activeWord.id}
          initial={{ opacity: 0, scale: 0.8, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="w-full bg-white border-2 border-purple-150 rounded-[2rem] p-5 text-center shadow-lg flex flex-col items-center justify-center gap-3 relative overflow-hidden"
        >
          {/* Background elements decoration */}
          <div className="absolute -top-6 -right-6 w-16 h-16 bg-violet-100/50 rounded-full blur-sm" />
          <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-blue-100/50 rounded-full blur-sm" />

          {/* Sparkle flash on fusion */}
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

          {/* Animated picture of the word (grows and bounces when the spell is done) */}
          <motion.span
            animate={isFused ? { scale: [1, 1.4, 1.4, 1], rotate: [0, 15, -15, 0] } : { y: [0, -3, 0] }}
            transition={{ repeat: isFused ? 2 : Infinity, duration: isFused ? 1.2 : 4 }}
            className="text-6xl md:text-7xl drop-shadow-lg leading-none"
          >
            {activeWord.emoji}
          </motion.span>

          <h2 className="text-lg md:text-xl font-black text-purple-700 tracking-tight leading-tighter">
            {isFused ? `✨ ${activeWord.word} ✨` : `?? ${activeWord.word.slice(0, 1)}... ??`}
          </h2>

          {/* Syllable drawers: white background keeps the letter color-coding visible */}
          <div className="flex justify-center gap-3 flex-wrap items-center">
            {activeWord.syllables.map((syllable, index) => {
              const isSyllablePlaced = index < placedCount;
              return (
                <div key={index} className="flex flex-col items-center">
                  <motion.div
                    className={`min-w-[4.5rem] h-16 sm:h-18 px-2 rounded-2xl flex items-center justify-center relative transition-all ${
                      isSyllablePlaced
                        ? 'bg-white border-3 border-purple-400 shadow-md'
                        : 'border-3 border-dashed border-purple-200 bg-white/40'
                    }`}
                    animate={
                      isFused
                        ? {
                            scale: [1, 1.06, 1],
                            boxShadow: [
                              '0 4px 6px -1px rgba(0,0,0,0.1)',
                              '0 10px 15px -3px rgba(139,92,246,0.4)',
                              '0 4px 6px -1px rgba(0,0,0,0.1)',
                            ],
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
                          className="text-2xl sm:text-3xl font-extrabold font-sans tracking-wide uppercase select-none"
                        >
                          <ColorCodedSyllable syllable={syllable} />
                        </motion.span>
                      )}
                    </AnimatePresence>

                    <span className={`absolute bottom-0.5 right-1.5 text-4xs font-black select-none text-purple-300`}>
                      {index + 1}
                    </span>
                  </motion.div>

                  {/* Dot under the next expected drawer */}
                  {!isFused && placedCount === index && (
                    <motion.div
                      animate={{ y: [0, 4, 0] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                      className="w-2.5 h-2.5 rounded-full bg-violet-500 mt-1.5 border border-white shadow-sm"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* 3. Speech Bubble */}
      <div className="space-y-4.5 w-full">
        <div className="bg-white p-4.5 px-5.5 rounded-[30px] shadow-lg border-2 border-purple-150 relative">
          <div className="absolute -top-3.5 left-1/4 sm:left-1/3 w-7 h-7 bg-white rotate-45 border-l-2 border-t-2 border-purple-150"></div>
          <p className="text-base sm:text-lg font-black tracking-tight text-center text-slate-800 uppercase leading-snug whitespace-pre-line min-h-[50px] flex items-center justify-center">
            {bubbleText}
          </p>
        </div>

        {/* 4. Color-coded syllable tiles (tap-to-place) */}
        <div className="flex justify-center gap-4.5 pt-1 flex-wrap">
          <AnimatePresence mode="popLayout">
            {choices.map((item) => {
              const isPlaced = disabledChoices[item.key];
              const isThisShaking = shakingKey === item.key;

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
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
                  transition={{ type: 'spring', damping: 12 }}
                  className="min-w-[5.5rem] sm:min-w-[6.5rem]"
                >
                  <button
                    onClick={() => handleSyllableClick(item)}
                    disabled={isPlaced || isAnswering || isFused}
                    className="w-full py-5 sm:py-6 px-3 bg-white border-b-[8px] border-slate-250 hover:border-b-[10px] active:border-b-0 active:translate-y-1.5 focus:outline-none rounded-2xl shadow-md sm:shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer select-none"
                    style={{
                      fontFamily: '"Fredoka", "Arial Rounded MT Bold", sans-serif',
                    }}
                  >
                    <span className="text-3xl sm:text-4xl font-black font-sans tracking-tight select-none">
                      <ColorCodedSyllable syllable={item.text} hug />
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
            if (isAnswering || isFused) return;
            if (currentIndex + 1 < roundWords.length) {
              setCurrentIndex((prev) => prev + 1);
            } else {
              onLevelComplete();
            }
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
