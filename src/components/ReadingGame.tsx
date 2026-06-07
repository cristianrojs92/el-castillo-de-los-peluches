import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowLeft } from 'lucide-react';
import TeddyBear from './TeddyBear';
import { Syllable } from '../types';

interface ReadingGameProps {
  key?: string | number;
  vowelLevel: 'A' | 'E' | 'I' | 'O' | 'U';
  difficulty?: 'easy' | 'medium' | 'hard';
  onChangeVowel: (vowel: 'A' | 'E' | 'I' | 'O' | 'U') => void;
  customVoices: Record<string, string>;
  onLevelComplete: () => void;
  onBackToMenu?: () => void;
  playAudioPrompt: (text: string, id: string) => Promise<void>;
}

const LISTA_SILABAS_A: Syllable[] = [
  'BA', 'CA', 'DA', 'FA', 'GA', 'HA', 'JA', 'KA', 'LA', 'MA',
  'NA', 'ÑA', 'PA', 'RA', 'SA', 'TA', 'VA', 'WA', 'XA', 'YA', 'ZA'
];

const LISTA_SILABAS_E: Syllable[] = [
  'BE', 'CE', 'DE', 'FE', 'GE', 'HE', 'JE', 'KE', 'LE', 'ME',
  'NE', 'ÑE', 'PE', 'RE', 'SE', 'TE', 'VE', 'WE', 'XE', 'YE', 'ZE'
];

const LISTA_SILABAS_I: Syllable[] = [
  'BI', 'CI', 'DI', 'FI', 'GI', 'HI', 'JI', 'KI', 'LI', 'MI',
  'NI', 'ÑI', 'PI', 'RI', 'SI', 'TI', 'VI', 'WI', 'XI', 'YI', 'ZI'
];

const LISTA_SILABAS_O: Syllable[] = [
  'BO', 'CO', 'DO', 'FO', 'GO', 'HO', 'JO', 'KO', 'LO', 'MO',
  'NO', 'ÑO', 'PO', 'RO', 'SO', 'TO', 'VO', 'WO', 'XO', 'YO', 'ZO'
];

const LISTA_SILABAS_U: Syllable[] = [
  'BU', 'CU', 'DU', 'FU', 'GU', 'HU', 'JU', 'KU', 'LU', 'MU',
  'NU', 'ÑU', 'PU', 'RU', 'SU', 'TU', 'VU', 'WU', 'XU', 'YU', 'ZU'
];

const SILLABAS_POR_NIVEL: Record<string, Syllable[]> = {
  'A': LISTA_SILABAS_A,
  'E': LISTA_SILABAS_E,
  'I': LISTA_SILABAS_I,
  'O': LISTA_SILABAS_O,
  'U': LISTA_SILABAS_U
};

const CONSONANT_NAMES_UI: Record<string, string> = {
  'B': '"B"', 'C': '"C"', 'D': '"D"', 'F': '"F"', 'G': '"G"',
  'H': '"HACHE"', 'J': '"JOTA"', 'K': '"K"', 'L': '"L"', 'M': '"M"',
  'N': '"N"', 'Ñ': '"Ñ"', 'P': '"P"', 'R': '"R"', 'S': '"S"',
  'T': '"T"', 'V': '"V"', 'W': '"W"', 'X': '"X"', 'Y': '"Y"', 'Z': '"Z"'
};

const CONSONANT_NAMES_TTS: Record<string, string> = {
  'B': 'be', 'C': 'ce', 'D': 'de', 'F': 'efe', 'G': 'ge',
  'H': 'hache', 'J': 'jota', 'K': 'ka', 'L': 'ele', 'M': 'eme',
  'N': 'ene', 'Ñ': 'eñe', 'P': 'pe', 'R': 'erre', 'S': 'ese',
  'T': 'te', 'V': 've', 'W': 'doble ve', 'X': 'equis', 'Y': 'ye', 'Z': 'zeta'
};

export default function ReadingGame({ vowelLevel, difficulty = 'easy', onChangeVowel, customVoices, onLevelComplete, onBackToMenu, playAudioPrompt }: ReadingGameProps) {
  const listaSilabasActive = SILLABAS_POR_NIVEL[vowelLevel] || LISTA_SILABAS_A;
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [choices, setChoices] = useState<{ text: string; isCorrect: boolean; key: number }[]>([]);
  const [teddyState, setTeddyState] = useState<'idle' | 'talking' | 'correct' | 'incorrect' | 'welcoming'>('welcoming');
  const [disabledButtons, setDisabledButtons] = useState<Record<string, boolean>>({});
  const [isAnswering, setIsAnswering] = useState<boolean>(false);
  const [bubbleText, setBubbleText] = useState<string>('¡HOLA PRINCESA!\n¡VAMOS A JUGAR!');

  const welcomeFired = useRef<boolean>(false);

  const getNumDistracters = (): number => {
    switch (difficulty) {
      case 'easy': return 1;
      case 'medium': return 3;
      case 'hard': return 7;
      default: return 1;
    }
  };

  const getGridColsClass = (): string => {
    switch (difficulty) {
      case 'easy': return 'grid-cols-2';
      case 'medium': return 'grid-cols-2';
      case 'hard': return 'grid-cols-4';
      default: return 'grid-cols-2';
    }
  };

  const getTextSizeClass = (): string => {
    switch (difficulty) {
      case 'easy': return 'text-6xl sm:text-7xl md:text-8xl';
      case 'medium': return 'text-5xl sm:text-6xl md:text-7xl';
      case 'hard': return 'text-4xl sm:text-5xl md:text-6xl';
      default: return 'text-6xl sm:text-7xl md:text-8xl';
    }
  };

  // Initiate a new turn when currentStep changes
  useEffect(() => {
    if (currentStep < listaSilabasActive.length) {
      initiateTurn(currentStep);
    } else {
      onLevelComplete();
    }
  }, [currentStep, vowelLevel]);

  const getSyllableConjugation = (syllable: string): string => {
    const c = syllable[0];
    const v = syllable[1];
    if (c === 'H') {
      return `LA "HACHE" CON LA "${v}" SUENA "${v}"`;
    }
    const cName = CONSONANT_NAMES_UI[c] || `"${c}"`;
    return `LA ${cName} CON LA "${v}" SUENA "${syllable}"`;
  };

  const getSyllableConjugationForTTS = (syllable: string): string => {
    const c = syllable[0];
    const v = syllable[1];
    const vLower = v.toLowerCase();
    const sLower = syllable.toLowerCase();
    if (c === 'H') {
      return `la hache con la ${vLower} suena ${vLower}. ¡${vLower}!`;
    }
    const cTts = CONSONANT_NAMES_TTS[c] || c.toLowerCase();
    return `la ${cTts} con la ${vLower} suena ${sLower}. ¡${sLower}!`;
  };

  const initiateTurn = async (stepIndex: number) => {
    setIsAnswering(false);
    setDisabledButtons({});

    const correctSyllable = listaSilabasActive[stepIndex];
    const numDistracters = getNumDistracters();

    // Generate distractors
    const options = listaSilabasActive;
    const candidates = options.filter(s => s !== correctSyllable);
    const distractors: Syllable[] = [];
    const selectedSet = new Set<Syllable>([correctSyllable]);

    for (let i = 0; i < numDistracters && candidates.length > selectedSet.size - 1; i++) {
      let distractor = candidates[Math.floor(Math.random() * candidates.length)];
      while (selectedSet.has(distractor)) {
        distractor = candidates[Math.floor(Math.random() * candidates.length)];
      }
      distractors.push(distractor);
      selectedSet.add(distractor);
    }

    // Shuffle choices
    const items = [
      { text: correctSyllable, isCorrect: true, key: Math.random() },
      ...distractors.map(d => ({ text: d, isCorrect: false, key: Math.random() })),
    ];
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    setChoices(items);

    // Play Voice Guidance
    setTeddyState('talking');
    if (!welcomeFired.current && stepIndex === 0) {
      welcomeFired.current = true;
      setBubbleText('¡HOLA PRINCESA!\n¡VAMOS A JUGAR!');
      // General Greeting: Welcome Princess
      await playAudioPrompt('¡HOLA PRINCESA! VAMOS A JUGAR.', 'welcome');
      await new Promise(r => setTimeout(r, 450));
    }

    // Set bubble text first
    setBubbleText(`¡HOLA PRINCESA!\n\nBUSCA LA SÍLABA:\n`);

    // Just prompt the sound of the syllable and ask to find it
    const promptText = `Busca la sílaba... ${correctSyllable.toLowerCase()}.`;
    await playAudioPrompt(promptText, `¡${correctSyllable}!`);
    setTeddyState('idle');
  };

  const handleSyllableClick = async (choiceText: string, isCorrect: boolean) => {
    if (isAnswering) return; // Prevent double taps during audio feedback

    // Cancel any ongoing speech to prioritize user action
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setIsAnswering(true);

    if (isCorrect) {
      // CORRECT ACIERTO MOVES
      setTeddyState('correct');
      
      const successText = `¡Muy bien! ${getSyllableConjugationForTTS(choiceText)}`;
      setBubbleText(`¡MUY BIEN!\n\n${getSyllableConjugation(choiceText)}`);

      await playAudioPrompt('¡MUY BIEN!', 'correct_generic');
      await playAudioPrompt(successText, `success_${choiceText}`);

      // Slide gracefully to the next step
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, 1500);
    } else {
      // INCORRECT CERO PENALIZACIÓN MOVES
      setTeddyState('incorrect');
      
      // Hide the wrong button smoothly by disabling/shadowing
      setDisabledButtons((prev) => ({ ...prev, [choiceText]: true }));

      const correctSyllable = listaSilabasActive[currentStep];
      
      const wrongText = `Esa sílaba es ${choiceText.toLowerCase()}... ${getSyllableConjugationForTTS(choiceText)}.`;
      const rightText = `Pero nosotros estamos buscando la sílaba ${correctSyllable.toLowerCase()}. ¡Busca la sílaba ${correctSyllable.toLowerCase()}!`;

      // Show wrong syllable conjugation first
      setBubbleText(`¡ESA SÍLABA ES ${choiceText}!\n\n${getSyllableConjugation(choiceText)}`);

      await playAudioPrompt(wrongText, `wrong_${choiceText}`);
      await new Promise(r => setTimeout(r, 400));

      // Show reminder for what we are looking for
      setBubbleText(`PERO BUSCAMOS:\n\n${correctSyllable}`);
      await playAudioPrompt(rightText, correctSyllable);

      setTeddyState('idle');
      setIsAnswering(false);
    }
  };

  const correctSyllable = listaSilabasActive[currentStep] || 'BA';

  return (
    <div className="flex-1 flex flex-col justify-between p-4 md:p-6 w-full max-w-lg mx-auto relative select-none">

      {/* Back to Menu Button */}
      {onBackToMenu && (
        <button
          onClick={() => {
            if ('speechSynthesis' in window) {
              window.speechSynthesis.cancel();
            }
            onBackToMenu();
          }}
          className="absolute top-4 left-4 p-2.5 bg-white/90 hover:bg-white text-slate-700 font-bold border-2 border-slate-200 hover:border-slate-300 rounded-xl shadow transition cursor-pointer flex items-center gap-1.5 text-xs z-20"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">INICIO</span>
        </button>
      )}

      {/* 0. Vocal Level Switcher Tabs */}
      <div className="flex gap-1.5 justify-center mb-3 flex-wrap">
        {(['A', 'E', 'I', 'O', 'U'] as const).map((vowel) => {
          const isActive = vowel === vowelLevel;
          return (
            <button
              key={vowel}
              onClick={() => {
                if (!isAnswering) {
                  if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                  }
                  onChangeVowel(vowel);
                }
              }}
              disabled={isAnswering}
              className={`px-3 py-1.5 text-xs font-black rounded-xl transition cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-md scale-105 border-0'
                  : 'bg-white/80 hover:bg-white text-slate-500 border border-slate-200'
              }`}
            >
              VOCAL {vowel}
            </button>
          );
        })}
      </div>

      {/* 1. Header Progress Bar (Dynamic Stars) */}
      <div className="bg-white/85 p-3 rounded-2xl shadow-sm border border-pink-100 flex flex-col items-center gap-1.5">
        <div className="text-2xs text-purple-700 font-extrabold uppercase tracking-widest text-center">
          SÍLABA {currentStep + 1} DE {listaSilabasActive.length} • ESTRELLAS DE LA VOCAL {vowelLevel}
        </div>
        <div className="flex items-center justify-center gap-1 w-full flex-wrap px-2">
          {Array.from({ length: listaSilabasActive.length }).map((_, i) => {
            const isEarned = i < currentStep;
            return (
              <motion.div
                key={i}
                initial={{ scale: 0.8 }}
                animate={isEarned ? { scale: [1, 1.3, 1], rotate: [0, 15, 0] } : {}}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                {/* Visual rendering of high contrasts stars */}
                <span
                  className={`text-lg md:text-xl transition-colors drop-shadow-sm ${
                    isEarned ? 'text-amber-400 font-bold' : 'text-slate-300'
                  }`}
                >
                  ★
                </span>
                {isEarned && (
                  <motion.div
                    className="absolute inset-0 text-amber-500 scale-125 opacity-20 blur-xs animate-spin-slow"
                  >
                    ★
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 2. Teddy Bear (Bunny) Area */}
      <div className="my-2 md:my-4 flex flex-col items-center justify-center relative">
        <TeddyBear state={teddyState} />
        
        {/* Subtle cloud feedback dialog bubble */}
        <div className="absolute top-0 right-0 sm:right-6 bg-white border-2 border-purple-200 p-2.5 rounded-2xl max-w-[130px] shadow-sm transform translate-y-4 scale-90 sm:scale-100">
          <p className="text-3xs text-center leading-normal text-purple-800 font-extrabold uppercase">
            {teddyState === 'correct' ? '¡SÚPER!' : teddyState === 'incorrect' ? 'INTENTA DE NUEVO' : '¿JUGAMOS?'}
          </p>
        </div>
      </div>

      {/* 3. Speech Bubble & Bold Buttons Interface */}
      <div className="space-y-6 w-full mt-2">
        {/* High-contrast Speech Bubble from the Bold Typography Theme */}
        <div className="bg-white p-5 px-6 rounded-[35px] shadow-lg border-2 border-pink-100 relative">
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rotate-45 border-r-2 border-b-2 border-pink-100"></div>
          <p className="text-xl md:text-2xl font-black tracking-tight text-center text-slate-800 uppercase leading-snug whitespace-pre-line">
            {bubbleText}
          </p>
        </div>

        <div className={`grid ${getGridColsClass()} gap-5 pt-3`}>
          <AnimatePresence mode="popLayout">
            {choices.map((choice) => {
              const isDisabled = disabledButtons[choice.text];
              return (
                <motion.div
                  key={choice.key}
                  initial={{ opacity: 1, scale: 0.95 }}
                  animate={
                    isDisabled
                      ? { opacity: 0.25, scale: 0.85, pointerEvents: 'none' }
                      : { opacity: 1, scale: 1 }
                  }
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', damping: 12 }}
                  className="w-full relative"
                >
                  <button
                    onClick={() => handleSyllableClick(choice.text, choice.isCorrect)}
                    disabled={isDisabled || isAnswering}
                    className="w-full py-8 md:py-12 bg-white border-b-[12px] border-slate-200 hover:border-b-[14px] rounded-[2.5rem] md:rounded-[3rem] shadow-xl flex items-center justify-center transition-all hover:scale-105 active:border-b-0 active:translate-y-2 group cursor-pointer select-none"
                    style={{
                      fontFamily: '"Fredoka", "Arial Rounded MT Bold", sans-serif',
                    }}
                  >
                    <span className={`${getTextSizeClass()} font-black font-sans text-slate-900 group-hover:text-pink-500 transition-colors tracking-tight`}>
                      {choice.text}
                    </span>
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
