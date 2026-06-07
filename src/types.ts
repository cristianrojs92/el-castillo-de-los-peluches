export interface GameState {
  currentLevelIndex: number;
  completedLevels: string[];
  starsCount: number;
  currentMode: 'welcome' | 'playing' | 'reward_dance' | 'coloring';
}

export type Syllable = string;

export interface LevelStep {
  syllable: Syllable;
  distractor: string;
}

export interface ParentRecording {
  id: string; // e.g. "syllable_BA", "welcome", "incorrect_TA", "reward"
  label: string; // Friendly name
  blobUrl: string; // Temporary URL for play
  arrayBuffer: ArrayBuffer; // For storage in IndexedDB
}

export interface ColoringPage {
  id: string;
  title: string;
  paths: {
    id: string;
    d: string;
    name: string;
  }[];
}
