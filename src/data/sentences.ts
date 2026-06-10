export interface SentenceData {
  id: string; // Base for audio identification, e.g., 'sentence_conejo_baila'
  article: 'EL' | 'LA';
  noun: string; // 'CONEJO'
  verb: string; // 'BAILA'
  emoji: string; // Subject pictogram: '🐰'
  verbEmoji: string; // Action visual support: '🕺'
  clue: string; // Lowercase full sentence for TTS: 'el conejo baila'
  reward?: 'coloring'; // Special reward: assembling it jumps straight into ColoringGame
}

// Curated simple sentences (article + subject + everyday action)
export const SENTENCES_DATABASE: SentenceData[] = [
  {
    id: 'sentence_conejo_baila',
    article: 'EL',
    noun: 'CONEJO',
    verb: 'BAILA',
    emoji: '🐰',
    verbEmoji: '🕺',
    clue: 'el conejo baila',
  },
  {
    id: 'sentence_princesa_pinta',
    article: 'LA',
    noun: 'PRINCESA',
    verb: 'PINTA',
    emoji: '👸',
    verbEmoji: '🎨',
    clue: 'la princesa pinta',
    reward: 'coloring',
  },
  {
    id: 'sentence_gatito_duerme',
    article: 'EL',
    noun: 'GATITO',
    verb: 'DUERME',
    emoji: '🐱',
    verbEmoji: '😴',
    clue: 'el gatito duerme',
  },
  {
    id: 'sentence_perrito_salta',
    article: 'EL',
    noun: 'PERRITO',
    verb: 'SALTA',
    emoji: '🐶',
    verbEmoji: '⬆️',
    clue: 'el perrito salta',
  },
  {
    id: 'sentence_muneca_canta',
    article: 'LA',
    noun: 'MUÑECA',
    verb: 'CANTA',
    emoji: '👧',
    verbEmoji: '🎤',
    clue: 'la muñeca canta',
  },
  {
    id: 'sentence_monito_come',
    article: 'EL',
    noun: 'MONITO',
    verb: 'COME',
    emoji: '🐵',
    verbEmoji: '🍌',
    clue: 'el monito come',
  },
  {
    id: 'sentence_sirena_nada',
    article: 'LA',
    noun: 'SIRENA',
    verb: 'NADA',
    emoji: '🧜‍♀️',
    verbEmoji: '🌊',
    clue: 'la sirena nada',
  },
  {
    id: 'sentence_pollito_corre',
    article: 'EL',
    noun: 'POLLITO',
    verb: 'CORRE',
    emoji: '🐥',
    verbEmoji: '💨',
    clue: 'el pollito corre',
  },
  {
    id: 'sentence_paloma_vuela',
    article: 'LA',
    noun: 'PALOMA',
    verb: 'VUELA',
    emoji: '🕊️',
    verbEmoji: '☁️',
    clue: 'la paloma vuela',
  },
  {
    id: 'sentence_caballo_salta',
    article: 'EL',
    noun: 'CABALLO',
    verb: 'SALTA',
    emoji: '🐴',
    verbEmoji: '⬆️',
    clue: 'el caballo salta',
  },
  {
    id: 'sentence_oveja_duerme',
    article: 'LA',
    noun: 'OVEJA',
    verb: 'DUERME',
    emoji: '🐑',
    verbEmoji: '😴',
    clue: 'la oveja duerme',
  },
  {
    id: 'sentence_payaso_rie',
    article: 'EL',
    noun: 'PAYASO',
    verb: 'RÍE',
    emoji: '🤡',
    verbEmoji: '😂',
    clue: 'el payaso ríe',
  },
  {
    id: 'sentence_jirafa_come',
    article: 'LA',
    noun: 'JIRAFA',
    verb: 'COME',
    emoji: '🦒',
    verbEmoji: '🍃',
    clue: 'la jirafa come',
  },
  {
    id: 'sentence_ballena_nada',
    article: 'LA',
    noun: 'BALLENA',
    verb: 'NADA',
    emoji: '🐳',
    verbEmoji: '🌊',
    clue: 'la ballena nada',
  },
];
