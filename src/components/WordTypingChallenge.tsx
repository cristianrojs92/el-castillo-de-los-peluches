import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface WordTypingChallengeProps {
  word: string;
  emoji: string;
  onComplete: () => void;
  playAudioPrompt: (text: string, id: string) => Promise<void>;
}

export default function WordTypingChallenge({
  word,
  emoji,
  onComplete,
  playAudioPrompt,
}: WordTypingChallengeProps) {
  const [typedLetters, setTypedLetters] = useState<string[]>([]);
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus input to open native keyboard
    inputRef.current?.focus();

    // Play intro audio
    playAudioPrompt(`Ahora escribe la palabra ${word.toLowerCase()}.`, `typing_intro_${word}`);
  }, [word, playAudioPrompt]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lastChar = e.target.value.toUpperCase().slice(-1);

    // Cancel any ongoing speech to prioritize user action
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Reset input for next character
    e.target.value = '';

    if (!lastChar || lastChar === ' ') return;

    const expected = word[typedLetters.length];

    if (lastChar === expected) {
      const nextLetters = [...typedLetters, lastChar];
      setTypedLetters(nextLetters);

      // Check if word is complete
      if (nextLetters.length === word.length) {
        // Word completed — celebrate and trigger onComplete
        playAudioPrompt(
          '¡Perfecto! ¡Escribiste la palabra correctamente!',
          `typing_complete_${word}`
        );
        setTimeout(() => {
          onComplete();
        }, 1400);
      }
    } else {
      // Wrong letter — shake animation
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-4 md:p-6 w-full max-w-lg mx-auto relative select-none">
      {/* Header with emoji and instruction */}
      <div className="flex flex-col items-center gap-4 mb-8">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="text-6xl md:text-7xl"
        >
          {emoji}
        </motion.div>
        <h2 className="text-2xl md:text-3xl font-black text-purple-900 text-center uppercase">
          ¡Escribe la palabra!
        </h2>
      </div>

      {/* Letter boxes */}
      <div className="flex justify-center gap-3 md:gap-4 mb-12">
        {word.split('').map((letter, i) => {
          const isTyped = i < typedLetters.length;
          const isActive = i === typedLetters.length;

          return (
            <motion.div
              key={i}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`
                w-12 h-16 md:w-14 md:h-20 rounded-xl border-4 flex items-center justify-center
                font-black text-3xl md:text-4xl transition-all
                ${isTyped ? 'bg-green-400 border-green-500 text-white shadow-lg' : ''}
                ${isActive && !isShaking ? 'border-rose-500 scale-110 animate-pulse' : ''}
                ${!isTyped && !isActive ? 'bg-white border-slate-200' : ''}
                ${isActive && isShaking ? 'animate-shake border-red-500' : ''}
              `}
            >
              {isTyped ? typedLetters[i] : ''}
            </motion.div>
          );
        })}
      </div>

      {/* Hidden input for keyboard capture */}
      <input
        ref={inputRef}
        type="text"
        onChange={handleInputChange}
        className="absolute -bottom-full opacity-0 pointer-events-none"
        inputMode="text"
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck="false"
      />

      {/* Progress message */}
      <div className="mt-auto text-center">
        <p className="text-sm md:text-base font-bold text-purple-700 uppercase tracking-wide">
          {typedLetters.length === 0
            ? 'Escribe la primera letra'
            : `Llevas ${typedLetters.length} de ${word.length} letras`}
        </p>
      </div>
    </div>
  );
}
