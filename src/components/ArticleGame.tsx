import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { TeddyBearState } from './TeddyBear';
import { WORDS_DATABASE, WordData } from '../data/words';
import ColorCodedText from './ColorCodedText';

interface ArticleGameProps {
  customVoices: Record<string, string>;
  onLevelComplete: () => void;
  playAudioPrompt: (text: string, id: string) => Promise<void>;
  onBackToMenu: () => void;
  teddyState: TeddyBearState;
  setTeddyState: (state: TeddyBearState) => void;
  articleStreak: number;
  setArticleStreak: React.Dispatch<React.SetStateAction<number>>;
}

const WORDS_PER_ROUND = 6;
export const PLURAL_UNLOCK_STREAK = 8;

// Pick a balanced round: 3 masculine + 3 feminine words, shuffled together
const pickRoundWords = (): WordData[] => {
  const pickRandom = (arr: WordData[], n: number) =>
    [...arr].sort(() => Math.random() - 0.5).slice(0, n);

  const masculine = pickRandom(WORDS_DATABASE.filter((w) => w.gender === 'M'), WORDS_PER_ROUND / 2);
  const feminine = pickRandom(WORDS_DATABASE.filter((w) => w.gender === 'F'), WORDS_PER_ROUND / 2);

  return [...masculine, ...feminine].sort(() => Math.random() - 0.5);
};

export default function ArticleGame({
  customVoices,
  onLevelComplete,
  playAudioPrompt,
  onBackToMenu,
  teddyState,
  setTeddyState,
  articleStreak,
  setArticleStreak,
}: ArticleGameProps) {
  // Phase is fixed at mount: plural unlocks once the in-session streak is reached
  const [phase] = useState<'singular' | 'plural'>(() =>
    articleStreak >= PLURAL_UNLOCK_STREAK ? 'plural' : 'singular'
  );
  const [roundWords] = useState<WordData[]>(pickRoundWords);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [placedArticle, setPlacedArticle] = useState<string | null>(null);
  const [wrongTried, setWrongTried] = useState<boolean>(false);
  const [shakingArticle, setShakingArticle] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState<boolean>(false);
  const [bubbleText, setBubbleText] = useState<string>('');

  const introFired = useRef<boolean>(false);
  // Guards initiateWord's async continuation: if the child answers while the
  // intro/prompt audio is still playing, don't overwrite the feedback bubble
  const answeredRef = useRef<boolean>(false);

  const activeWord = roundWords[currentIndex] || roundWords[0];
  const articles = phase === 'singular' ? (['EL', 'LA'] as const) : (['LOS', 'LAS'] as const);
  const correctArticle =
    activeWord.gender === 'M' ? articles[0] : articles[1];
  // All words in the database end in a vowel, so the plural is always word + S
  const displayWord = phase === 'plural' ? `${activeWord.word}S` : activeWord.word;
  const displayClue = phase === 'plural' ? `${activeWord.clueName}s` : activeWord.clueName;
  const emojiCount = phase === 'plural' ? 3 : 1;

  useEffect(() => {
    initiateWord();
  }, [currentIndex]);

  const initiateWord = async () => {
    setIsAnswering(false);
    setPlacedArticle(null);
    setWrongTried(false);
    setShakingArticle(null);
    answeredRef.current = false;

    setTeddyState('talking');

    if (!introFired.current && currentIndex === 0) {
      introFired.current = true;
      if (phase === 'singular') {
        setBubbleText('¡MIREN QUIÉN VINO!\n\n¡VAMOS A PRESENTARLO!');
        await playAudioPrompt('¡MIREN QUIÉN VINO! VAMOS A PRESENTARLO.', 'article_intro');
      } else {
        setBubbleText('¡AHORA SON MUCHOS!\n\n¡VAMOS A PRESENTARLOS!');
        await playAudioPrompt('¡AHORA SON MUCHOS! VAMOS A PRESENTARLOS.', 'article_plural_intro');
      }
      await new Promise((r) => setTimeout(r, 300));
    }

    if (answeredRef.current) return;
    setBubbleText(`¿QUÉ FICHA VA EN EL CAJÓN?\n\n¿${articles[0]} O ${articles[1]}?`);

    await playAudioPrompt(
      `¿Qué ficha va en el cajón? ¿${articles[0].toLowerCase()} o ${articles[1].toLowerCase()}... ${displayClue}?`,
      `article_prompt_${activeWord.id}${phase === 'plural' ? '_plural' : ''}`
    );

    if (answeredRef.current) return;
    setTeddyState('idle');
  };

  const handleArticleClick = async (article: string) => {
    if (isAnswering || placedArticle) return;

    // Cancel any ongoing speech to prioritize user action
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setIsAnswering(true);
    answeredRef.current = true;

    if (article === correctArticle) {
      // --- CORRECT: token flies up into the drawer with a sparkle flash ---
      setPlacedArticle(article);
      setTeddyState('correct');
      setBubbleText(`¡MUY BIEN!\n\n${article} ${displayWord}`);

      if (!wrongTried) {
        setArticleStreak((s) => s + 1);
      }

      await playAudioPrompt('¡MUY BIEN!', 'correct_generic');
      await playAudioPrompt(
        `${article} ${displayClue}`,
        `article_full_${activeWord.id}${phase === 'plural' ? '_plural' : ''}`
      );

      await new Promise((r) => setTimeout(r, 1200));

      if (currentIndex + 1 < roundWords.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        onLevelComplete();
      }
    } else {
      // --- INCORRECT (CERO PENALIZACIÓN): token shakes + phonetic hint ---
      setTeddyState('incorrect');
      setShakingArticle(article);
      setWrongTried(true);
      setArticleStreak(0);
      setBubbleText(`MMM...\n\n¿DECIMOS ${article} ${displayWord}?`);

      await playAudioPrompt(
        `Mmm... ¿decimos ${article.toLowerCase()} ${displayClue}?`,
        `article_wrong_${activeWord.id}_${article}`
      );
      await playAudioPrompt('ESCUCHÁ CÓMO SUENA. PROBEMOS CON EL OTRO.', 'article_hint_retry');

      setShakingArticle(null);
      setTeddyState('idle');
      setIsAnswering(false);
    }
  };

  const justUnlockedPlural = phase === 'singular' && articleStreak >= PLURAL_UNLOCK_STREAK;

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
            {phase === 'singular' ? 'LOS SOCIOS MÁGICOS 🪄' : 'SOCIOS MÁGICOS: ¡MUCHOS! 🪄✨'}
          </p>
        </div>

        <div className="w-16" />
      </div>

      {/* 1. Progress Indicators */}
      <div className="bg-white/90 p-3 rounded-2xl shadow-sm border border-purple-100 flex flex-col items-center gap-1.5">
        <div className="text-2xs text-purple-700 font-extrabold uppercase tracking-widest text-center">
          PALABRA {currentIndex + 1} DE {roundWords.length} • COMPLETA TODAS PARA BAILAR
        </div>
        <div className="flex items-center justify-center gap-1.5 w-full flex-wrap px-2">
          {roundWords.map((w, idx) => {
            const isCompleted = idx < currentIndex || (idx === currentIndex && !!placedArticle);
            const isCurrent = idx === currentIndex;
            return (
              <motion.span
                key={w.id}
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
                ★
              </motion.span>
            );
          })}
        </div>

        {/* Streak pill towards plural unlock */}
        {phase === 'singular' && (
          <div className={`px-3 py-1 rounded-full text-4xs font-black uppercase tracking-widest ${
            justUnlockedPlural
              ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
              : 'bg-purple-50 text-purple-500 border border-purple-100'
          }`}>
            {justUnlockedPlural
              ? '✨ ¡DESBLOQUEASTE LOS Y LAS PARA LA PRÓXIMA RONDA! ✨'
              : `RACHA MÁGICA: ${Math.min(articleStreak, PLURAL_UNLOCK_STREAK)} DE ${PLURAL_UNLOCK_STREAK}`}
          </div>
        )}
      </div>

      {/* 2. Central Card: drawer + word + pictogram */}
      <div className="my-3 md:my-5 flex justify-center">
        <motion.div
          key={`${activeWord.id}-${phase}`}
          initial={{ opacity: 0, scale: 0.8, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="w-full bg-white border-2 border-pink-100 rounded-[2rem] p-5 text-center shadow-lg flex flex-col items-center justify-center gap-3 relative overflow-hidden"
        >
          {/* Background elements decoration */}
          <div className="absolute -top-6 -right-6 w-16 h-16 bg-pink-100/40 rounded-full blur-sm" />
          <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-purple-100/40 rounded-full blur-sm" />

          {/* Sparkle flash when the article is placed */}
          <AnimatePresence>
            {placedArticle && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1.3, 1.3, 1] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5 }}
                className="absolute inset-0 bg-yellow-400/10 pointer-events-none flex items-center justify-center"
              >
                <Sparkles className="w-12 h-12 text-yellow-400 animate-spin" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pictogram(s): repeated in plural phase to associate the final S with quantity */}
          <div className="flex items-center justify-center gap-1">
            {Array.from({ length: emojiCount }).map((_, i) => (
              <motion.span
                key={i}
                animate={placedArticle ? { scale: [1, 1.3, 1], rotate: [0, 12, -12, 0] } : { y: [0, -3, 0] }}
                transition={placedArticle ? { duration: 1 } : { repeat: Infinity, duration: 4, delay: i * 0.4 }}
                className="text-5xl md:text-6xl drop-shadow-lg leading-none"
              >
                {activeWord.emoji}
              </motion.span>
            ))}
          </div>

          {/* Drawer + word row */}
          <div className="flex items-center justify-center gap-3">
            <div
              className={`w-20 h-16 sm:w-24 sm:h-18 rounded-2xl flex items-center justify-center relative transition-all ${
                placedArticle
                  ? 'bg-white border-3 border-purple-400 shadow-md'
                  : 'border-3 border-dashed border-purple-200 bg-white/40'
              }`}
            >
              <AnimatePresence>
                {placedArticle && (
                  <motion.span
                    key={placedArticle}
                    initial={{ y: 90, opacity: 0, scale: 0.3 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ type: 'spring', damping: 11, stiffness: 95 }}
                    className="text-2xl sm:text-3xl font-extrabold font-sans tracking-wide uppercase select-none"
                  >
                    <ColorCodedText text={placedArticle} />
                  </motion.span>
                )}
              </AnimatePresence>
              {!placedArticle && (
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-2xl text-purple-300 font-black select-none"
                >
                  ?
                </motion.span>
              )}
            </div>

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tighter">
              <ColorCodedText text={displayWord} />
            </h2>
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

        {/* 4. Article token buttons (tap-to-place) */}
        <div className="flex justify-center gap-4.5 pt-1">
          {articles.map((article) => {
            const isPlaced = placedArticle === article;
            const isThisShaking = shakingArticle === article;

            return (
              <motion.div
                key={article}
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
                transition={{ type: 'spring', damping: 12 }}
                className="w-28 sm:w-32"
              >
                <button
                  onClick={() => handleArticleClick(article)}
                  disabled={isAnswering || !!placedArticle}
                  className="w-full py-5 sm:py-7 bg-white border-b-[8px] border-slate-250 hover:border-b-[10px] active:border-b-0 active:translate-y-1.5 focus:outline-none rounded-2xl shadow-md sm:shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 group cursor-pointer select-none"
                  style={{
                    fontFamily: '"Fredoka", "Arial Rounded MT Bold", sans-serif',
                  }}
                >
                  <span className="text-3xl sm:text-4xl font-black font-sans tracking-tight select-none">
                    <ColorCodedText text={article} />
                  </span>
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Parental/Assistant Skip Helper line */}
      <div className="mt-5.5 flex justify-center">
        <button
          onClick={() => {
            if ('speechSynthesis' in window) {
              window.speechSynthesis.cancel();
            }
            if (isAnswering) return;
            if (currentIndex + 1 < roundWords.length) {
              setCurrentIndex((prev) => prev + 1);
            } else {
              onLevelComplete();
            }
          }}
          disabled={isAnswering}
          className="text-4xs font-black text-slate-400 hover:text-purple-600 transition tracking-widest uppercase cursor-pointer py-1 px-3 bg-white/20 hover:bg-white/60 rounded-lg"
        >
          Saltar palabra 👉
        </button>
      </div>

    </div>
  );
}
