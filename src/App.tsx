import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Play, Music, Volume2, Sparkles, Heart } from 'lucide-react';
import CastleBackground from './components/CastleBackground';
import ReadingGame from './components/ReadingGame';
import SyllabicSynthesisGame from './components/SyllabicSynthesisGame';
import ArticleGame, { PLURAL_UNLOCK_STREAK } from './components/ArticleGame';
import SentenceTrainGame from './components/SentenceTrainGame';
import SpellLabGame from './components/SpellLabGame';
import FriendsAnimation from './components/FriendsAnimation';
import ColoringGame from './components/ColoringGame';
import AudioSettings from './components/AudioSettings';
import TeddyBear, { TeddyBearState } from './components/TeddyBear';
import { getAllAudios } from './utils/audioDb';

export default function App() {
  const [currentMode, setCurrentMode] = useState<'welcome' | 'playing' | 'reward_dance' | 'coloring'>('welcome');
  const [gameMode, setGameMode] = useState<'reading' | 'synthesis' | 'articles' | 'train' | 'lab'>('reading');
  const [labPhase, setLabPhase] = useState<'trabadas' | 'inversas'>('trabadas');
  // In-session streak of first-try correct answers in the article game; unlocks the plural phase
  const [articleStreak, setArticleStreak] = useState<number>(0);
  const [vowelLevel, setVowelLevel] = useState<'A' | 'E' | 'I' | 'O' | 'U'>('A');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [customVoices, setCustomVoices] = useState<Record<string, string>>({}); // id -> blobUrl
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [ambientMelody, setAmbientMelody] = useState<boolean>(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [teddyState, setTeddyState] = useState<TeddyBearState>('welcoming');

  // Audio elements ref for ambient backup music if requested
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize and load any parent recordings saved in IndexedDB
  useEffect(() => {
    loadParentVoices();

    // Listen to voiceschanged to handle asynchronous SpeechSynthesis loading in Chrome/Safari
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
      };
      // Try loading voices immediately
      updateVoices();

      // Chrome/Safari load voices asynchronously and trigger this event
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      // Clean up previous blob URLs
      Object.values(customVoices).forEach((url) => URL.revokeObjectURL(url as string));
    };
  }, []);

  const loadParentVoices = async () => {
    try {
      const items = await getAllAudios();
      setCustomVoices((prev) => {
        // Clean up old ones to avoid memory leaks
        Object.values(prev).forEach((url) => URL.revokeObjectURL(url as string));

        const updated: Record<string, string> = {};
        items.forEach((item) => {
          const blob = new Blob([item.arrayBuffer], { type: item.mimeType });
          updated[item.id] = URL.createObjectURL(blob);
        });
        return updated;
      });
    } catch (err) {
      console.error('Error fetching parent voice cache:', err);
    }
  };

  // Speaks using custom parent recordings OR friendly Spanish Web Speech Synthesis
  const playAudioPrompt = async (text: string, id: string): Promise<void> => {
    return new Promise<void>((resolve) => {
      const customUrl = customVoices[id];
      if (customUrl) {
        // Stop SpeechSynthesis if speaking
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        const audio = new Audio(customUrl);
        audio.onended = () => resolve();
        audio.onerror = () => {
          speakWithTTS(text).then(resolve);
        };
        audio.play().catch((err) => {
          console.warn('Parent audio play restricted or failed, using system TTS:', err);
          speakWithTTS(text).then(resolve);
        });
      } else {
        speakWithTTS(text).then(resolve);
      }
    });
  };

  const speakWithTTS = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve();
        return;
      }

      // Preprocess text to prevent browser TTS from expanding common Spanish abbreviations
      const processedText = text.replace(/\b([bcdfghjklmnñprstvwxyz])([aeiouáéíóú])\b/gi, (match, c, v) => {
        const isUppercase = match === match.toUpperCase();
        return isUppercase ? `${c}${v}H` : `${c}${v}h`;
      });

      const utterance = new SpeechSynthesisUtterance(processedText);
      utterance.lang = 'es-MX';
      utterance.rate = 0.8;
      utterance.pitch = 1.35;
      utterance.volume = 1;

      let hasStarted = false;
      let hasEnded = false;
      let timeout: NodeJS.Timeout | null = null;

      utterance.onstart = () => {
        hasStarted = true;
        if (timeout) clearTimeout(timeout);
      };

      utterance.onend = () => {
        hasEnded = true;
        if (timeout) clearTimeout(timeout);
        resolve();
      };

      utterance.onerror = (e) => {
        if (timeout) clearTimeout(timeout);
        if (!hasEnded) resolve();
      };

      // Find an elegant Spanish voice model from browser list
      const currentVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
      const esVoice =
        currentVoices.find((v) => v.lang.toLowerCase() === 'es-mx') ||
        currentVoices.find((v) => v.lang.toLowerCase() === 'es-es') ||
        currentVoices.find((v) => v.lang.toLowerCase().startsWith('es'));

      if (esVoice) {
        utterance.voice = esVoice;
      }

      // Pause if speaking, don't cancel completely to avoid blocking
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        setTimeout(() => window.speechSynthesis.resume(), 50);
      }

      window.speechSynthesis.speak(utterance);

      // Fallback: Estimate duration based on text length if callbacks don't work
      const estimatedDuration = Math.max(500, Math.min((processedText.length / 5 / 2.5) * 1000, 5000));

      // If speech doesn't start after 300ms, use fallback timing
      timeout = setTimeout(() => {
        if (!hasStarted) {
          const fallbackTimeout = setTimeout(() => {
            if (!hasEnded) {
              hasEnded = true;
              resolve();
            }
          }, estimatedDuration);
        }
      }, 300);
    });
  };

  // Toggle soft sound synthesizer chime or play general greeting
  const handleStartGame = async () => {
    // Prime SpeechSynthesis inside the direct user click handler to unlock the audio context in Safari/Chrome
    if ('speechSynthesis' in window) {
      const primeUtterance = new SpeechSynthesisUtterance('.');
      primeUtterance.volume = 0;
      primeUtterance.rate = 2;

      try {
        window.speechSynthesis.speak(primeUtterance);
        await new Promise(r => setTimeout(r, 100));
      } catch (e) {
        // Silent error handling
      }
    }
    setTeddyState('welcoming');
    setCurrentMode('playing');
  };

  const handleBackToGame = useCallback(() => {
    // Advance vowel level in a nice loop (A -> E -> I -> O -> U)
    setVowelLevel((prev) => {
      const order: ('A' | 'E' | 'I' | 'O' | 'U')[] = ['A', 'E', 'I', 'O', 'U'];
      const nextIdx = (order.indexOf(prev) + 1) % order.length;
      return order[nextIdx];
    });
    setCurrentMode('welcome');
  }, []);

  const handleLevelComplete = useCallback(() => {
    setCurrentMode('reward_dance');
  }, []);

  const handleBackToMenu = useCallback(() => {
    setCurrentMode('welcome');
  }, []);

  const handleColoring = useCallback(() => {
    setCurrentMode('coloring');
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col font-sans text-slate-800 antialiased overflow-x-hidden selection:bg-pink-200">

      {/* Background stays persistent and smooth */}
      <CastleBackground />

      {/* Main Container Layout */}
      <main className={`flex-1 flex flex-col ${currentMode === 'playing' ? 'items-start justify-start' : 'items-center justify-center'} p-4 min-h-screen relative z-10 w-full`}>

        {/* Render child or welcome screen depending on State */}
        <AnimatePresence mode="wait">
          {currentMode === 'welcome' && (
            <motion.div
              key="welcome-screen"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md bg-white/95 rounded-[40px] p-6 text-center border-4 border-pink-200 shadow-2xl relative"
            >
              <div className="absolute -top-12 inset-x-0 flex justify-center">
                <div className="bg-gradient-to-r from-pink-400 to-rose-400 text-white rounded-full p-4 shadow-lg border-4 border-white animate-bounce-slow">
                  <span className="text-3xl">🏰</span>
                </div>
              </div>

              {/* Title */}
              <div className="mt-6 mb-6 space-y-2">
                <h1 className="text-3xl md:text-4xl font-extrabold text-pink-500 font-sans tracking-tight">
                  EL CASTILLO DE LOS PELUCHES
                </h1>
                <p className="text-xs text-purple-600 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-spin" />
                  JUGUEMOS Y APRENDAMOS A LEER
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-spin" />
                </p>
              </div>

              {/* Adventure/Game Mode selector */}
              <div className="mb-6 space-y-2">
                <p className="text-xs font-black text-purple-700 uppercase tracking-widest text-center">
                  ¿QUÉ AVENTURA JUGAMOS HOY?
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => setGameMode('reading')}
                    className={`p-2.5 flex flex-col items-center justify-center rounded-3xl transition cursor-pointer select-none border-2 active:scale-95 ${gameMode === 'reading'
                      ? 'bg-purple-100/60 border-purple-400 text-purple-950 font-black shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                  >
                    <span className="text-3xl mb-1">🔍</span>
                    <span className="font-extrabold text-2xs uppercase tracking-wide">BUSCAR SÍLABAS</span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase mt-1 leading-snug">TOCA LA SÍLABA QUE PIDE EL CONEJITO</span>
                  </button>
                  <button
                    onClick={() => setGameMode('synthesis')}
                    className={`p-2.5 flex flex-col items-center justify-center rounded-3xl transition cursor-pointer select-none border-2 active:scale-95 ${gameMode === 'synthesis'
                      ? 'bg-purple-100/60 border-purple-400 text-purple-950 font-black shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                  >
                    <span className="text-3xl mb-1">🧩</span>
                    <span className="font-extrabold text-2xs uppercase tracking-wide">ARMAR PALABRAS</span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase mt-1 leading-snug">UNE LAS PEQUEÑAS SÍLABAS PARA FORMAR PALABRAS</span>
                  </button>
                  <button
                    onClick={() => setGameMode('articles')}
                    className={`p-2.5 flex flex-col items-center justify-center rounded-3xl transition cursor-pointer select-none border-2 active:scale-95 ${gameMode === 'articles'
                      ? 'bg-purple-100/60 border-purple-400 text-purple-950 font-black shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                  >
                    <span className="text-3xl mb-1">🪄</span>
                    <span className="font-extrabold text-2xs uppercase tracking-wide">SOCIOS MÁGICOS</span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase mt-1 leading-snug">ELIGE EL O LA PARA CADA AMIGO</span>
                  </button>
                  <button
                    onClick={() => setGameMode('train')}
                    className={`p-2.5 flex flex-col items-center justify-center rounded-3xl transition cursor-pointer select-none border-2 active:scale-95 ${gameMode === 'train'
                      ? 'bg-purple-100/60 border-purple-400 text-purple-950 font-black shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                  >
                    <span className="text-3xl mb-1">🚂</span>
                    <span className="font-extrabold text-2xs uppercase tracking-wide">TREN DE ACCIONES</span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase mt-1 leading-snug">ORDENA LAS PIEZAS Y ARMA LA ORACIÓN</span>
                  </button>
                  <button
                    onClick={() => setGameMode('lab')}
                    className={`p-2.5 col-span-2 flex flex-col items-center justify-center rounded-3xl transition cursor-pointer select-none border-2 active:scale-95 ${gameMode === 'lab'
                      ? 'bg-purple-100/60 border-purple-400 text-purple-950 font-black shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                  >
                    <span className="text-3xl mb-1">🧪</span>
                    <span className="font-extrabold text-2xs uppercase tracking-wide">LABORATORIO DE HECHIZOS</span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase mt-1 leading-snug">ARMÁ PALABRAS CON SÍLABAS MÁGICAS</span>
                  </button>
                </div>
              </div>

              {gameMode === 'reading' ? (
                <>
                  {/* Vowel selection bar */}
                  <div className="bg-purple-50/50 border border-purple-100 rounded-3xl p-4.5 mb-6 space-y-2.5">
                    <p className="text-xs font-black text-purple-700 uppercase tracking-widest text-center">
                      ¿QUÉ VOCAL QUIERES JUGAR HOY?
                    </p>
                    <div className="flex justify-center gap-2">
                      {(['A', 'E', 'I', 'O', 'U'] as const).map((vowel) => {
                        const isSelected = vowelLevel === vowel;
                        return (
                          <button
                            key={vowel}
                            onClick={() => setVowelLevel(vowel)}
                            className={`w-11 h-11 flex items-center justify-center font-black text-lg rounded-2xl transition cursor-pointer select-none active:scale-95 ${isSelected
                              ? 'bg-rose-500 text-white shadow-[0_4px_0_#BE123C] scale-105 border-0'
                              : 'bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200/80 shadow-sm'
                              }`}
                          >
                            {vowel}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Difficulty selection bar */}
                  <div className="bg-purple-50/50 border border-purple-100 rounded-3xl p-4.5 mb-6 space-y-2.5">
                    <p className="text-xs font-black text-purple-700 uppercase tracking-widest text-center">
                      ¿QUÉ NIVEL DE DIFICULTAD?
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {(['easy', 'medium', 'hard'] as const).map((level) => {
                        const isSelected = difficulty === level;
                        const labels = {
                          'easy': { label: 'FÁCIL', icon: '😊', desc: '2 SÍLABAS' },
                          'medium': { label: 'MEDIO', icon: '🎯', desc: '4 SÍLABAS' },
                          'hard': { label: 'DIFÍCIL', icon: '⭐', desc: '8 SÍLABAS' }
                        };
                        const { label, icon, desc } = labels[level];
                        return (
                          <button
                            key={level}
                            onClick={() => setDifficulty(level)}
                            className={`py-3 flex flex-col items-center justify-center rounded-2xl transition cursor-pointer select-none border-2 active:scale-95 ${isSelected
                              ? 'bg-rose-500/20 border-rose-400 text-rose-900 font-black shadow-sm'
                              : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-600'
                              }`}
                          >
                            <span className="text-2xl mb-1">{icon}</span>
                            <span className="text-xs font-black uppercase">{label}</span>
                            <span className="text-[9px] text-slate-500 font-bold mt-0.5">{desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Character Intro Badge */}
                  <div className="bg-pink-50/70 border border-pink-100 rounded-3xl p-5 mb-6 flex items-center gap-4 text-left">
                    <div className="text-4xl">🐰</div>
                    <div>
                      <h3 className="font-extrabold text-purple-900 text-base">SÍLABAS DE LA "{vowelLevel}"</h3>
                      <p className="text-xs text-slate-600 leading-normal">
                        ¡ELIGE LA VOCAL MÁGICA ARRIBA Y TOCA EMPEZAR PARA APRENDER CON EL CONEJITO BAILARÍN!
                      </p>
                    </div>
                  </div>
                </>
              ) : gameMode === 'synthesis' ? (
                <>
                  {/* Game Mode Intro Badge for word synthesis */}
                  <div className="bg-pink-50/70 border border-pink-100 rounded-3xl p-5 mb-6 flex items-center gap-4 text-left">
                    <div className="text-4xl">🧩</div>
                    <div>
                      <h3 className="font-extrabold text-purple-900 text-base">SÍNTESIS SILÁBICA</h3>
                      <p className="text-xs text-slate-600 leading-normal">
                        ¡EXCEPCIONAL! AYUDA AL CONEJITO A JUNTAR LOS BLOQUES DE SÍLABAS PARA DEVELAR LINDOS DIBUJOS DE ESTRELLAS.
                      </p>
                    </div>
                  </div>
                </>
              ) : gameMode === 'articles' ? (
                <>
                  {/* Game Mode Intro Badge for the article game */}
                  <div className="bg-pink-50/70 border border-pink-100 rounded-3xl p-5 mb-6 flex items-center gap-4 text-left">
                    <div className="text-4xl">🪄</div>
                    <div>
                      <h3 className="font-extrabold text-purple-900 text-base">LOS SOCIOS MÁGICOS</h3>
                      <p className="text-xs text-slate-600 leading-normal">
                        ¡MIRA QUIÉN VINO! ELIGE LA FICHA MÁGICA "EL" O "LA" PARA PRESENTAR A CADA AMIGO.
                        {articleStreak >= PLURAL_UNLOCK_STREAK && ' ✨ ¡FASE PLURAL "LOS Y LAS" DESBLOQUEADA!'}
                      </p>
                    </div>
                  </div>
                </>
              ) : gameMode === 'train' ? (
                <>
                  {/* Game Mode Intro Badge for the sentence train game */}
                  <div className="bg-pink-50/70 border border-pink-100 rounded-3xl p-5 mb-6 flex items-center gap-4 text-left">
                    <div className="text-4xl">🚂</div>
                    <div>
                      <h3 className="font-extrabold text-purple-900 text-base">EL TREN DE LAS ACCIONES</h3>
                      <p className="text-xs text-slate-600 leading-normal">
                        ORDENA LAS PIEZAS EN LOS VAGONES PARA ARMAR ORACIONES. ¡LA ÚLTIMA TRAE UNA SORPRESA DE PINTURA!
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Phase selection bar for the spell lab */}
                  <div className="bg-purple-50/50 border border-purple-100 rounded-3xl p-4.5 mb-6 space-y-2.5">
                    <p className="text-xs font-black text-purple-700 uppercase tracking-widest text-center">
                      ¿QUÉ SÍLABAS MÁGICAS PRACTICAMOS?
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {(['trabadas', 'inversas'] as const).map((p) => {
                        const isSelected = labPhase === p;
                        const labels = {
                          trabadas: { label: 'TRABADAS', icon: '🧪', desc: 'CRA, BRA, GLO...' },
                          inversas: { label: 'INVERSAS', icon: '⚗️', desc: 'CAS, CAR, PAS...' },
                        };
                        const { label, icon, desc } = labels[p];
                        return (
                          <button
                            key={p}
                            onClick={() => setLabPhase(p)}
                            className={`py-3 flex flex-col items-center justify-center rounded-2xl transition cursor-pointer select-none border-2 active:scale-95 ${isSelected
                              ? 'bg-rose-500/20 border-rose-400 text-rose-900 font-black shadow-sm'
                              : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-600'
                              }`}
                          >
                            <span className="text-2xl mb-1">{icon}</span>
                            <span className="text-xs font-black uppercase">{label}</span>
                            <span className="text-[9px] text-slate-500 font-bold mt-0.5">{desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Game Mode Intro Badge for the spell lab */}
                  <div className="bg-pink-50/70 border border-pink-100 rounded-3xl p-5 mb-6 flex items-center gap-4 text-left">
                    <div className="text-4xl">🧪</div>
                    <div>
                      <h3 className="font-extrabold text-purple-900 text-base">EL LABORATORIO DE LOS HECHIZOS</h3>
                      <p className="text-xs text-slate-600 leading-normal">
                        ARMÁ PALABRAS CON SÍLABAS MÁGICAS: LAS CONSONANTES EN AZUL Y LAS VOCALES EN ROSA TE AYUDAN A LEERLAS. ¡CADA PALABRA ES UN HECHIZO!
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Action columns */}
              <div className="flex flex-col gap-4">
                <button
                  onClick={handleStartGame}
                  className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white font-black text-lg rounded-2xl shadow-[0_6px_0_#BE123C] hover:scale-[1.01] active:translate-y-1 active:shadow-[0_2px_0_#BE123C] transition-all cursor-pointer flex items-center justify-center gap-3"
                  id="go-play"
                >
                  <Play className="w-5.5 h-5.5 fill-current" />
                  <span>
                    {gameMode === 'reading'
                      ? `¡JUGAR SÍLABAS DE LA ${vowelLevel}!`
                      : gameMode === 'synthesis'
                      ? '¡EMPEZAR A ARMAR PALABRAS!'
                      : gameMode === 'articles'
                      ? '¡JUGAR CON EL Y LA!'
                      : gameMode === 'train'
                      ? '¡SUBIR AL TREN!'
                      : '¡A HACER HECHIZOS!'}
                  </span>
                </button>


                {/* Parent voice recording helper button */}
                <button
                  onClick={() => setShowSettings(true)}
                  className="w-full py-3.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold text-sm rounded-xl border-2 border-purple-200 transition-colors cursor-pointer flex items-center justify-center gap-2"
                  id="go-parent-config"
                >
                  <Settings className="w-4.5 h-4.5 text-purple-500 animate-spin-slow" />
                  <span>CONFIGURACIÓN (VOZ DE MAMÁ Y PAPÁ)</span>
                </button>
              </div>

              {/* Little Footer note */}
              <div className="mt-8 flex items-center justify-center gap-1.5 text-10xs font-bold text-slate-400 tracking-wide">
                <span>HECHO CON AMOR PARA LA PRINCESA DE LA CASA</span>
              </div>
            </motion.div>
          )}

          {currentMode === 'playing' && (
            <motion.div
              key="gameplay-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex items-start justify-center min-h-screen px-4"
            >
              {/* Bunny + Game container as a flex row unit */}
              <div className="flex items-start gap-6 pt-4">
                {/* Bunny guide - left side, sticky */}
                <div className="hidden lg:flex flex-shrink-0 flex-col items-center sticky top-20 self-start">
                  <TeddyBear state={teddyState} />
                  <div className="mt-2 bg-white border-2 border-purple-200 p-2.5 rounded-2xl max-w-[130px] shadow-sm">
                    <p className="text-xs text-center text-purple-800 font-extrabold uppercase">
                      {teddyState === 'correct' ? '¡SÚPER!' : teddyState === 'incorrect' ? 'INTENTA DE NUEVO' : '¿JUGAMOS?'}
                    </p>
                  </div>
                </div>

                {/* Game content - right side */}
                <div className="flex-1 flex justify-center">
                  {gameMode === 'reading' ? (
                    <ReadingGame
                      key={vowelLevel}
                      vowelLevel={vowelLevel}
                      difficulty={difficulty}
                      onChangeVowel={setVowelLevel}
                      customVoices={customVoices}
                      onLevelComplete={handleLevelComplete}
                      playAudioPrompt={playAudioPrompt}
                      onBackToMenu={handleBackToMenu}
                      teddyState={teddyState}
                      setTeddyState={setTeddyState}
                    />
                  ) : gameMode === 'synthesis' ? (
                    <SyllabicSynthesisGame
                      customVoices={customVoices}
                      onLevelComplete={handleLevelComplete}
                      playAudioPrompt={playAudioPrompt}
                      onBackToMenu={handleBackToMenu}
                      teddyState={teddyState}
                      setTeddyState={setTeddyState}
                    />
                  ) : gameMode === 'articles' ? (
                    <ArticleGame
                      customVoices={customVoices}
                      onLevelComplete={handleLevelComplete}
                      playAudioPrompt={playAudioPrompt}
                      onBackToMenu={handleBackToMenu}
                      teddyState={teddyState}
                      setTeddyState={setTeddyState}
                      articleStreak={articleStreak}
                      setArticleStreak={setArticleStreak}
                    />
                  ) : gameMode === 'train' ? (
                    <SentenceTrainGame
                      customVoices={customVoices}
                      onLevelComplete={handleLevelComplete}
                      playAudioPrompt={playAudioPrompt}
                      onBackToMenu={handleBackToMenu}
                      teddyState={teddyState}
                      setTeddyState={setTeddyState}
                      onColoringReward={handleColoring}
                    />
                  ) : (
                    <SpellLabGame
                      key={labPhase}
                      phase={labPhase}
                      customVoices={customVoices}
                      onLevelComplete={handleLevelComplete}
                      playAudioPrompt={playAudioPrompt}
                      onBackToMenu={handleBackToMenu}
                      teddyState={teddyState}
                      setTeddyState={setTeddyState}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {currentMode === 'reward_dance' && (
            <motion.div
              key="dancing-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 w-full h-full"
            >
              <FriendsAnimation
                onAnimationEnd={handleColoring}
                playAudioPrompt={playAudioPrompt}
              />
            </motion.div>
          )}

          {currentMode === 'coloring' && (
            <motion.div
              key="painting-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-y-0 inset-x-0 w-full h-full overflow-y-auto"
            >
              <ColoringGame
                onBackToGame={handleBackToGame}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Parental config button in top-right when playing */}
      {currentMode === 'playing' && (
        <div className="fixed top-4 right-4 z-30">
          <button
            onClick={() => {
              // Pause syntesis before opening setting
              if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
              setShowSettings(true);
            }}
            className="p-3 bg-white/90 hover:bg-white text-slate-700 font-bold border-2 border-slate-200 hover:border-slate-300 rounded-2xl shadow transition cursor-pointer flex items-center gap-1.5 text-xs"
            id="parent-config-trigger"
          >
            <Settings className="w-5 h-5 text-purple-600 animate-spin-slow" />
            <span className="hidden sm:inline">VOZ FAMILIAR</span>
          </button>
        </div>
      )}

      {/* Parental Recording overlay modal */}
      <AnimatePresence>
        {showSettings && (
          <AudioSettings
            onClose={() => setShowSettings(false)}
            onUpdateCache={loadParentVoices}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
