export interface ComplexWordData {
  id: string; // Base for audio identification, e.g., 'lab_cofre'
  word: string; // 'COFRE'
  syllables: string[]; // ['CO', 'FRE']
  emoji: string; // '🧰'
  clueName: string; // Friendly lowercase name for voice feedback: 'cofre'
  phase: 'trabadas' | 'inversas';
}

// Advanced syllable vocabulary for "El Laboratorio de los Hechizos".
// Fase TRABADAS: consonant clusters (CCV). Fase INVERSAS: closed/mixed syllables (VC/CVC).
export const COMPLEX_WORDS_DATABASE: ComplexWordData[] = [
  // --- Fase TRABADAS ---
  { id: 'lab_cofre', word: 'COFRE', syllables: ['CO', 'FRE'], emoji: '🧰', clueName: 'cofre', phase: 'trabadas' },
  { id: 'lab_tigre', word: 'TIGRE', syllables: ['TI', 'GRE'], emoji: '🐯', clueName: 'tigre', phase: 'trabadas' },
  { id: 'lab_cabra', word: 'CABRA', syllables: ['CA', 'BRA'], emoji: '🐐', clueName: 'cabra', phase: 'trabadas' },
  { id: 'lab_libro', word: 'LIBRO', syllables: ['LI', 'BRO'], emoji: '📖', clueName: 'libro', phase: 'trabadas' },
  { id: 'lab_globo', word: 'GLOBO', syllables: ['GLO', 'BO'], emoji: '🎈', clueName: 'globo', phase: 'trabadas' },
  { id: 'lab_plato', word: 'PLATO', syllables: ['PLA', 'TO'], emoji: '🍽️', clueName: 'plato', phase: 'trabadas' },
  { id: 'lab_bruja', word: 'BRUJA', syllables: ['BRU', 'JA'], emoji: '🧙‍♀️', clueName: 'bruja', phase: 'trabadas' },
  { id: 'lab_frutilla', word: 'FRUTILLA', syllables: ['FRU', 'TI', 'LLA'], emoji: '🍓', clueName: 'frutilla', phase: 'trabadas' },
  { id: 'lab_pluma', word: 'PLUMA', syllables: ['PLU', 'MA'], emoji: '🪶', clueName: 'pluma', phase: 'trabadas' },
  { id: 'lab_brazo', word: 'BRAZO', syllables: ['BRA', 'ZO'], emoji: '💪', clueName: 'brazo', phase: 'trabadas' },
  { id: 'lab_grillo', word: 'GRILLO', syllables: ['GRI', 'LLO'], emoji: '🦗', clueName: 'grillo', phase: 'trabadas' },
  { id: 'lab_flecha', word: 'FLECHA', syllables: ['FLE', 'CHA'], emoji: '🏹', clueName: 'flecha', phase: 'trabadas' },

  // --- Fase INVERSAS / MIXTAS ---
  { id: 'lab_castillo', word: 'CASTILLO', syllables: ['CAS', 'TI', 'LLO'], emoji: '🏰', clueName: 'castillo', phase: 'inversas' },
  { id: 'lab_carta', word: 'CARTA', syllables: ['CAR', 'TA'], emoji: '💌', clueName: 'carta', phase: 'inversas' },
  { id: 'lab_pastel', word: 'PASTEL', syllables: ['PAS', 'TEL'], emoji: '🍰', clueName: 'pastel', phase: 'inversas' },
  { id: 'lab_barco', word: 'BARCO', syllables: ['BAR', 'CO'], emoji: '⛵', clueName: 'barco', phase: 'inversas' },
  { id: 'lab_tortuga', word: 'TORTUGA', syllables: ['TOR', 'TU', 'GA'], emoji: '🐢', clueName: 'tortuga', phase: 'inversas' },
  { id: 'lab_delfin', word: 'DELFÍN', syllables: ['DEL', 'FÍN'], emoji: '🐬', clueName: 'delfín', phase: 'inversas' },
  { id: 'lab_arbol', word: 'ÁRBOL', syllables: ['ÁR', 'BOL'], emoji: '🌳', clueName: 'árbol', phase: 'inversas' },
  { id: 'lab_ventana', word: 'VENTANA', syllables: ['VEN', 'TA', 'NA'], emoji: '🪟', clueName: 'ventana', phase: 'inversas' },
  { id: 'lab_campana', word: 'CAMPANA', syllables: ['CAM', 'PA', 'NA'], emoji: '🔔', clueName: 'campana', phase: 'inversas' },
  { id: 'lab_bosque', word: 'BOSQUE', syllables: ['BOS', 'QUE'], emoji: '🌲', clueName: 'bosque', phase: 'inversas' },
  { id: 'lab_jardin', word: 'JARDÍN', syllables: ['JAR', 'DÍN'], emoji: '🌷', clueName: 'jardín', phase: 'inversas' },
  { id: 'lab_estrella', word: 'ESTRELLA', syllables: ['ES', 'TRE', 'LLA'], emoji: '⭐', clueName: 'estrella', phase: 'inversas' },
];

const SIMPLE_CV = /^[BCDFGHJKLMNÑPQRSTVWXYZ][AEIOUÁÉÍÓÚ]$/;

// Unique non-simple syllables used by the vocabulary (trabadas + inversas),
// used to generate the recordable "SÍLABAS MÁGICAS" tracks in AudioSettings.
export const getComplexSyllables = (): string[] => {
  const seen = new Set<string>();
  COMPLEX_WORDS_DATABASE.forEach((w) => {
    w.syllables.forEach((s) => {
      if (!SIMPLE_CV.test(s)) seen.add(s);
    });
  });
  return [...seen].sort();
};
