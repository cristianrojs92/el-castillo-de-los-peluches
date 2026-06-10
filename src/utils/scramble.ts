// Reusable shuffle helper for scrambling syllables/pieces while keeping
// track of each item's correct position
export const scrambleSyllables = (syllables: string[]): { text: string; initialIndex: number; key: number }[] => {
  const mapped = syllables.map((s, idx) => ({
    text: s,
    initialIndex: idx,
    key: Math.random(),
  }));

  // Shuffle until the scrambled version is different from the original (if syllables.length > 1)
  let attempts = 0;
  while (attempts < 10) {
    mapped.sort(() => Math.random() - 0.5);
    const isOriginalOrdered = mapped.every((item, i) => item.initialIndex === i);
    if (!isOriginalOrdered || syllables.length <= 1) {
      break;
    }
    attempts++;
  }
  return mapped;
};
