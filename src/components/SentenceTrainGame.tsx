import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { TeddyBearState } from './TeddyBear';
import { SENTENCES_DATABASE, SentenceData } from '../data/sentences';
import ColorCodedText from './ColorCodedText';

interface SentenceTrainGameProps {
  customVoices: Record<string, string>;
  onLevelComplete: () => void;
  playAudioPrompt: (text: string, id: string) => Promise<void>;
  onBackToMenu: () => void;
  teddyState: TeddyBearState;
  setTeddyState: (state: TeddyBearState) => void;
  onColoringReward: () => void;
}

const SENTENCES_PER_ROUND = 5;

interface PieceItem {
  text: string;
  initialIndex: number; // Correct position in the sentence (0=article, 1=noun, 2=verb)
  key: number;
}

// Round: random regular sentences + the princess sentence closing the round
const pickRoundSentences = (): SentenceData[] => {
  const special = SENTENCES_DATABASE.find((s) => s.reward === 'coloring');
  const regular = SENTENCES_DATABASE.filter((s) => !s.reward)
    .sort(() => Math.random() - 0.5)
    .slice(0, SENTENCES_PER_ROUND - 1);
  return special ? [...regular, special] : regular;
};

const scramblePieces = (sentence: SentenceData): PieceItem[] => {
  const ordered = [sentence.article, sentence.noun, sentence.verb];
  const mapped = ordered.map((text, idx) => ({
    text,
    initialIndex: idx,
    key: Math.random(),
  }));

  // Shuffle until the scrambled version differs from the original order
  let attempts = 0;
  while (attempts < 10) {
    mapped.sort(() => Math.random() - 0.5);
    if (!mapped.every((item, i) => item.initialIndex === i)) break;
    attempts++;
  }
  return mapped;
};

export default function SentenceTrainGame({
  customVoices,
  onLevelComplete,
  playAudioPrompt,
  onBackToMenu,
  teddyState,
  setTeddyState,
  onColoringReward,
}: SentenceTrainGameProps) {
  const [roundSentences] = useState<SentenceData[]>(pickRoundSentences);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [pieces, setPieces] = useState<PieceItem[]>([]);
  const [placedCount, setPlacedCount] = useState<number>(0);
  const [disabledPieces, setDisabledPieces] = useState<Record<number, boolean>>({});
  const [shakingKey, setShakingKey] = useState<number | null>(null);
  const [isAnswering, setIsAnswering] = useState<boolean>(false);
  const [isFused, setIsFused] = useState<boolean>(false);
  const [bubbleText, setBubbleText] = useState<string>('');

  const introFired = useRef<boolean>(false);
  // Guards initiateSentence's async continuation if the child answers while the
  // intro/prompt audio is still playing (same pattern as ArticleGame)
  const answeredRef = useRef<boolean>(false);

  const activeSentence = roundSentences[currentIndex] || roundSentences[0];
  const orderedPieces = [activeSentence.article, activeSentence.noun, activeSentence.verb];
  const fullSentence = orderedPieces.join(' ');

  useEffect(() => {
    initiateSentence();
  }, [currentIndex]);

  const initiateSentence = async () => {
    setIsAnswering(false);
    setIsFused(false);
    setPlacedCount(0);
    setDisabledPieces({});
    setShakingKey(null);
    answeredRef.current = false;

    setPieces(scramblePieces(roundSentences[currentIndex]));
    setTeddyState('talking');

    if (!introFired.current && currentIndex === 0) {
      introFired.current = true;
      setBubbleText('¡SUBE AL TREN!\n\n¡VAMOS A ARMAR ORACIONES!');
      await playAudioPrompt('¡SUBE AL TREN DE LAS ACCIONES! VAMOS A ARMAR ORACIONES.', 'train_intro');
      await new Promise((r) => setTimeout(r, 300));
    }

    if (answeredRef.current) return;
    setBubbleText(`ESCUCHA Y ARMA EL TREN:\n\n¿QUÉ PIEZA VA PRIMERO?`);

    await playAudioPrompt(
      `¡Mira! Vamos a contar algo: ${activeSentence.clue}. Arma la oración con las piezas. ¿Qué pieza va primero en el tren?`,
      `train_prompt_${activeSentence.id}`
    );

    if (answeredRef.current) return;
    setTeddyState('idle');
  };

  const handlePieceClick = async (item: PieceItem) => {
    if (isAnswering || isFused) return;

    // Cancel any ongoing speech to prioritize user action
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setIsAnswering(true);
    answeredRef.current = true;

    if (item.initialIndex === placedCount) {
      // --- CORRECT PIECE: it boards its wagon ---
      setTeddyState('correct');
      const newPlaced = placedCount + 1;
      setPlacedCount(newPlaced);
      setDisabledPieces((prev) => ({ ...prev, [item.key]: true }));

      await playAudioPrompt('¡SÍ!', 'correct_generic');

      if (newPlaced === orderedPieces.length) {
        // --- SENTENCE COMPLETED: wagons fuse into one sentence ---
        setIsFused(true);
        setTeddyState('correct');
        setBubbleText(`¡LO LOGRASTE!\n\n✨ ${fullSentence} ✨`);

        await playAudioPrompt('¡MUY BIEN!', 'correct_generic');
        await playAudioPrompt(activeSentence.clue, `train_complete_${activeSentence.id}`);

        if (activeSentence.reward === 'coloring') {
          // Magical transition straight into the coloring reward
          setBubbleText('¡LA PRINCESA QUIERE PINTAR!\n\n🎨 ¡VAMOS CON ELLA! ✨');
          await playAudioPrompt(
            '¡LA PRINCESA QUIERE PINTAR! ¡VAMOS A PINTAR CON ELLA!',
            'train_princess'
          );
          await new Promise((r) => setTimeout(r, 800));
          onColoringReward();
          return;
        }

        await new Promise((r) => setTimeout(r, 1500));

        if (currentIndex + 1 < roundSentences.length) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          onLevelComplete();
        }
      } else {
        setBubbleText(`¡PIEZA CORRECTA!\n\n¿CUÁL SIGUE EN EL TREN?`);
        // Fire-and-forget so the next tap is immediate
        playAudioPrompt(
          `¡Eso es! Pusiste ${item.text.toLowerCase()}. ¿Qué pieza sigue?`,
          `train_next_${activeSentence.id}_${item.initialIndex}`
        );
        setTeddyState('idle');
        setIsAnswering(false);
      }
    } else {
      // --- WRONG PIECE (CERO PENALIZACIÓN): shake + phonetic hint ---
      setTeddyState('incorrect');
      setShakingKey(item.key);
      setBubbleText(`MMM...\n\n¿LA ORACIÓN ${placedCount === 0 ? 'EMPIEZA' : 'SIGUE'} CON "${item.text}"?`);

      await playAudioPrompt(
        `Mmm... ¿la oración ${placedCount === 0 ? 'empieza' : 'sigue'} con ${item.text.toLowerCase()}? Escuchá: ${activeSentence.clue}.`,
        `train_wrong_${activeSentence.id}_${item.initialIndex}`
      );
      await playAudioPrompt('ESA PIEZA NO VA EN ESE VAGÓN. PROBEMOS CON OTRA.', 'train_hint_retry');

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
            EL TREN DE LAS ACCIONES 🚂
          </p>
        </div>

        <div className="w-16" />
      </div>

      {/* 1. Progress Indicators */}
      <div className="bg-white/90 p-3 rounded-2xl shadow-sm border border-purple-100 flex flex-col items-center gap-1.5">
        <div className="text-2xs text-purple-700 font-extrabold uppercase tracking-widest text-center">
          ORACIÓN {currentIndex + 1} DE {roundSentences.length} • LA ÚLTIMA TRAE UNA SORPRESA
        </div>
        <div className="flex items-center justify-center gap-1.5 w-full flex-wrap px-2">
          {roundSentences.map((s, idx) => {
            const isCompleted = idx < currentIndex || (idx === currentIndex && isFused);
            const isCurrent = idx === currentIndex;
            return (
              <motion.span
                key={s.id}
                animate={isCompleted ? { scale: [1, 1.25, 1], rotate: [0, 8, -8, 0] } : isCurrent ? { scale: 1.1 } : {}}
                transition={{ duration: 0.4 }}
                className={`text-lg md:text-xl transition-all ${
                  isCompleted
                    ? 'text-yellow-400 opacity-100'
                    : isCurrent
                    ? 'text-pink-500 animate-pulse opacity-100'
                    : 'text-slate-350 opacity-40'
                }`}
              >
                {s.reward === 'coloring' ? '🎨' : '★'}
              </motion.span>
            );
          })}
        </div>
      </div>

      {/* 2. Central Card: clue emojis + train wagons */}
      <div className="my-3 md:my-5 flex justify-center">
        <motion.div
          key={activeSentence.id}
          initial={{ opacity: 0, scale: 0.8, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="w-full bg-white border-2 border-pink-100 rounded-[2rem] p-5 text-center shadow-lg flex flex-col items-center justify-center gap-4 relative overflow-hidden"
        >
          {/* Background elements decoration */}
          <div className="absolute -top-6 -right-6 w-16 h-16 bg-pink-100/40 rounded-full blur-sm" />
          <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-purple-100/40 rounded-full blur-sm" />

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

          {/* Visual clue: subject + action */}
          <div className="flex items-center justify-center gap-3">
            <motion.span
              animate={isFused ? { scale: [1, 1.3, 1], rotate: [0, 12, -12, 0] } : { y: [0, -3, 0] }}
              transition={isFused ? { duration: 1 } : { repeat: Infinity, duration: 4 }}
              className="text-5xl md:text-6xl drop-shadow-lg leading-none"
            >
              {activeSentence.emoji}
            </motion.span>
            <span className="text-3xl text-purple-300 font-black">+</span>
            <motion.span
              animate={isFused ? { scale: [1, 1.3, 1], rotate: [0, -12, 12, 0] } : { y: [0, -3, 0] }}
              transition={isFused ? { duration: 1 } : { repeat: Infinity, duration: 4, delay: 0.5 }}
              className="text-5xl md:text-6xl drop-shadow-lg leading-none"
            >
              {activeSentence.verbEmoji}
            </motion.span>
          </div>

          {/* Train: locomotive + 3 wagons OR fused sentence banner */}
          <div className="w-full flex justify-center items-center min-h-[5.5rem]">
            <AnimatePresence mode="wait">
              {isFused ? (
                <motion.div
                  key="fused-banner"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: [0.6, 1.1, 1] }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.6 }}
                  className="bg-white border-3 border-purple-400 px-6 py-4 rounded-3xl shadow-lg"
                >
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-wide uppercase select-none whitespace-nowrap">
                    <ColorCodedText text={fullSentence} />
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="wagons"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center justify-center gap-2"
                >
                  <span className="text-4xl sm:text-5xl drop-shadow-md select-none">🚂</span>
                  {orderedPieces.map((pieceText, index) => {
                    const isPlaced = index < placedCount;
                    return (
                      <div key={index} className="flex flex-col items-center">
                        <div
                          className={`min-w-[4.2rem] sm:min-w-[5rem] h-16 sm:h-18 px-2 rounded-2xl flex items-center justify-center relative transition-all ${
                            isPlaced
                              ? 'bg-white border-3 border-purple-400 shadow-md'
                              : 'border-3 border-dashed border-purple-200 bg-white/40'
                          }`}
                        >
                          <AnimatePresence>
                            {isPlaced && (
                              <motion.span
                                key={pieceText}
                                initial={{ y: 90, opacity: 0, scale: 0.3 }}
                                animate={{ y: 0, opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                transition={{ type: 'spring', damping: 11, stiffness: 95 }}
                                className="text-lg sm:text-2xl font-extrabold font-sans tracking-wide uppercase select-none"
                              >
                                <ColorCodedText text={pieceText} />
                              </motion.span>
                            )}
                          </AnimatePresence>

                          <span className="absolute bottom-0.5 right-1.5 text-4xs font-black select-none text-purple-300">
                            {index + 1}
                          </span>
                        </div>

                        {/* Dot under the next expected wagon */}
                        {placedCount === index && (
                          <motion.div
                            animate={{ y: [0, 4, 0] }}
                            transition={{ repeat: Infinity, duration: 1.2 }}
                            className="w-2.5 h-2.5 rounded-full bg-pink-500 mt-1.5 border border-white shadow-sm"
                          />
                        )}
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* 3. Speech Bubble */}
      <div className="space-y-4.5 w-full">
        <div className="bg-white p-4.5 px-5.5 rounded-[30px] shadow-lg border-2 border-pink-150 relative">
          <div className="absolute -top-3.5 left-1/4 sm:left-1/3 w-7 h-7 bg-white rotate-45 border-l-2 border-t-2 border-pink-150"></div>
          <p className="text-base sm:text-lg font-black tracking-tight text-center text-slate-800 uppercase leading-snug whitespace-pre-line min-h-[50px] flex items-center justify-center">
            {bubbleText}
          </p>
        </div>

        {/* 4. Scrambled piece buttons (tap-to-place) */}
        <div className="flex justify-center gap-4.5 pt-1 flex-wrap">
          <AnimatePresence mode="popLayout">
            {pieces.map((item) => {
              const isPlaced = disabledPieces[item.key];
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
                  className="min-w-[6rem] sm:min-w-[7rem]"
                >
                  <button
                    onClick={() => handlePieceClick(item)}
                    disabled={isPlaced || isAnswering || isFused}
                    className="w-full py-5 sm:py-6 px-4 bg-white border-b-[8px] border-slate-250 hover:border-b-[10px] active:border-b-0 active:translate-y-1.5 focus:outline-none rounded-2xl shadow-md sm:shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 group cursor-pointer select-none"
                    style={{
                      fontFamily: '"Fredoka", "Arial Rounded MT Bold", sans-serif',
                    }}
                  >
                    <span className="text-2xl sm:text-3xl font-black font-sans tracking-tight select-none">
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
            if (isAnswering || isFused) return;
            if (currentIndex + 1 < roundSentences.length) {
              setCurrentIndex((prev) => prev + 1);
            } else {
              onLevelComplete();
            }
          }}
          disabled={isAnswering || isFused}
          className="text-4xs font-black text-slate-400 hover:text-purple-600 transition tracking-widest uppercase cursor-pointer py-1 px-3 bg-white/20 hover:bg-white/60 rounded-lg"
        >
          Saltar oración 👉
        </button>
      </div>

    </div>
  );
}
