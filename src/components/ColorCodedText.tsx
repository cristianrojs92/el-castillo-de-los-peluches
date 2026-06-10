import { motion } from 'motion/react';

const VOWEL_RE = /[AEIOUÁÉÍÓÚ]/;

// Visual scaffolding shared by all games: consonants in blue, vowels in pink,
// letter by letter. With `hug`, the two leading consonants of a sílaba trabada
// slide together ("abrazo") on mount — used only by the spell lab.
export default function ColorCodedText({ text, hug = false }: { text: string; hug?: boolean }) {
  const letters = text.split('');
  const isTrabada = letters.length >= 2 && !VOWEL_RE.test(letters[0]) && !VOWEL_RE.test(letters[1]);

  return (
    <span className="inline-flex items-baseline whitespace-pre">
      {letters.map((letter, i) => {
        if (letter === ' ') {
          return <span key={i}> </span>;
        }
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
