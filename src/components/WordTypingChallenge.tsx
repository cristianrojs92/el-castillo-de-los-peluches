import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { TeddyBearState } from './TeddyBear';

interface WordTypingChallengeProps {
  word: string;
  emoji: string;
  onComplete: () => void;
  playAudioPrompt: (text: string, id: string) => Promise<void>;
  teddyState?: TeddyBearState;
  setTeddyState?: (state: TeddyBearState) => void;
}

export default function WordTypingChallenge({
  word,
  emoji,
  onComplete,
  playAudioPrompt,
  teddyState,
  setTeddyState,
}: WordTypingChallengeProps) {
  const [typedLetters, setTypedLetters] = useState<string[]>([]);
  const [isShaking, setIsShaking] = useState(false);
  const [wrongLetter, setWrongLetter] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingNRef = useRef(false);
  const pendingNTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wrongLetterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const introFiredRef = useRef(false);

  useEffect(() => {
    // Auto-focus input to open native keyboard
    inputRef.current?.focus();

    // Play intro audio only once
    if (!introFiredRef.current) {
      introFiredRef.current = true;
      playAudioPrompt(`Ahora escribe la palabra ${word.toLowerCase()}.`, `typing_intro_${word}`);
    }

    // Cleanup timeouts on unmount
    return () => {
      if (pendingNTimeoutRef.current) {
        clearTimeout(pendingNTimeoutRef.current);
      }
      if (wrongLetterTimeoutRef.current) {
        clearTimeout(wrongLetterTimeoutRef.current);
      }
    };
  }, [word, playAudioPrompt]);

  const handleLetterPress = (charToAdd: string) => {
    setTypedLetters((prevLetters) => {
      const expected = word[prevLetters.length];

      if (charToAdd === expected) {
        const nextLetters = [...prevLetters, charToAdd];
        setWrongLetter(null);
        setIsShaking(false);
        setTeddyState?.('correct');
        if (wrongLetterTimeoutRef.current) {
          clearTimeout(wrongLetterTimeoutRef.current);
        }

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

        return nextLetters;
      } else {
        // Wrong letter — show in red for 700ms then disappear
        setWrongLetter(charToAdd);
        setIsShaking(true);
        setTeddyState?.('incorrect');
        if (wrongLetterTimeoutRef.current) {
          clearTimeout(wrongLetterTimeoutRef.current);
        }
        wrongLetterTimeoutRef.current = setTimeout(() => {
          setWrongLetter(null);
          setIsShaking(false);
        }, 700);
        return prevLetters; // Don't add the wrong letter
      }
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lastChar = e.target.value.toUpperCase().slice(-1);

    // Cancel any ongoing speech to prioritize user action
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Reset input for next character
    e.target.value = '';

    if (!lastChar || lastChar === ' ') return;

    // Handle double-N to Ñ conversion
    if (lastChar === 'N') {
      if (pendingNRef.current) {
        // Second N pressed within timeout window — convert to Ñ
        if (pendingNTimeoutRef.current) {
          clearTimeout(pendingNTimeoutRef.current);
        }
        pendingNRef.current = false;
        handleLetterPress('Ñ');
      } else {
        // First N pressed — wait for potential second N
        pendingNRef.current = true;
        if (pendingNTimeoutRef.current) {
          clearTimeout(pendingNTimeoutRef.current);
        }
        // 300ms window to press N again, otherwise confirm the first N
        pendingNTimeoutRef.current = setTimeout(() => {
          if (pendingNRef.current) {
            handleLetterPress('N');
            pendingNRef.current = false;
          }
        }, 300);
      }
      return;
    }

    // If there was a pending N and a different letter is pressed, confirm the N first
    if (pendingNRef.current) {
      if (pendingNTimeoutRef.current) {
        clearTimeout(pendingNTimeoutRef.current);
      }
      handleLetterPress('N');
      pendingNRef.current = false;
    }

    handleLetterPress(lastChar);
  };

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 w-full max-w-2xl relative select-none">
      {/* Header with emoji and instruction */}
      <div className="flex flex-col items-center gap-6">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="text-8xl md:text-9xl"
        >
          {emoji}
        </motion.div>
        <h2 className="text-3xl md:text-4xl font-black text-purple-900 text-center uppercase">
          ¡Escribe la palabra!
        </h2>
      </div>

      {/* Letter boxes */}
      <div className="flex justify-center gap-4 md:gap-5 flex-wrap">
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
                w-16 h-24 md:w-20 md:h-28 rounded-xl border-4 flex items-center justify-center
                font-black text-4xl md:text-5xl transition-all
                ${isTyped ? 'bg-green-400 border-green-500 text-white shadow-lg' : ''}
                ${isActive && wrongLetter ? 'bg-red-100 border-red-500 text-red-600' : ''}
                ${isActive && !wrongLetter && !isShaking ? 'border-rose-500 scale-110 animate-pulse' : ''}
                ${!isTyped && !isActive ? 'bg-white border-slate-200' : ''}
                ${isActive && isShaking && !wrongLetter ? 'animate-shake border-red-500' : ''}
              `}
            >
              {isTyped ? typedLetters[i] : isActive && wrongLetter ? wrongLetter : ''}
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
      <div className="text-center">
        <p className="text-base md:text-lg font-bold text-purple-700 uppercase tracking-wide">
          {typedLetters.length === 0
            ? 'Escribe la primera letra'
            : `Llevas ${typedLetters.length} de ${word.length} letras`}
        </p>
      </div>
    </div>
  );
}
