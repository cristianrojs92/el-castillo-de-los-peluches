# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**El Castillo de los Peluches** ("The Teddy Bears' Castle") is an interactive educational web app designed to teach Spanish-speaking children to read through syllabic games and animations. The app emphasizes playfulness with child-friendly UI, character animations, and reward mechanics.

## Common Commands

- **`npm run dev`** — Start development server on port 3000 with full hot module reloading
- **`npm run build`** — Build production bundle to `dist/`
- **`npm run preview`** — Preview production build locally
- **`npm run lint`** — Type-check the entire codebase (TypeScript no-emit mode)
- **`npm run clean`** — Remove `dist/` and build artifacts

## Architecture Overview

### Core Application Flow

The app is a state machine centered around **App.tsx** with four main modes:

1. **Welcome Screen** — Menu where users select game mode (Reading or Syllabic Synthesis) and vowel level
2. **Playing** — Active game state, renders either `ReadingGame` or `SyllabicSynthesisGame`
3. **Reward Dance** — Celebration animation (`FriendsAnimation`) after completing a level
4. **Coloring** — Post-game reward coloring activity (`ColoringGame`)

The app passes audio playback control down through the component tree via `playAudioPrompt()` callback, which intelligently falls back from custom parent recordings (stored in IndexedDB) to Web Speech Synthesis TTS.

### Key Components

- **ReadingGame** — Syllable recognition: child taps the correct syllable (e.g., "BA") matching a spoken sound with two choices (target + distractor)
- **SyllabicSynthesisGame** — Word assembly: child drags syllable blocks to form complete words
- **FriendsAnimation** — Reward dance scene with animated plush characters
- **ColoringGame** — SVG-based interactive coloring page
- **AudioSettings** — Modal for parents to record custom voice instructions (stored in IndexedDB via `audioDb.ts`)
- **CastleBackground** — Persistent decorative background (parallax/fixed)
- **TeddyBear** — Reusable animated bear character

### Audio & Localization

- **Audio System** — Dual-layer approach:
  - Prefer custom parent recordings (IndexedDB → blob URLs)
  - Fallback to Web Speech Synthesis API with Spanish locale (es-MX > es-ES > any es-*)
  - Text preprocessing adds silent "h" to single-syllable words to prevent TTS abbreviation expansion (e.g., "BA" → "BAh")
  - Speech synthesis primed in direct click handlers to unlock audio context in Safari/Chrome

- **Language** — All UI text and game logic is Spanish; hardcoded syllable lists for each vowel (A, E, I, O, U) in ReadingGame.tsx

### Styling & Animation

- **Tailwind CSS** (with Vite plugin) for utility-first styling
- **Motion (motion/react)** for React component animations (entrance/exit, transitions)
- Custom CSS for complex animations (e.g., `ChibiBunny.css`)
- Soft, playful palette: pinks, purples, rose tones; rounded buttons and large touch targets (child-friendly design)

### Data Storage

- **IndexedDB** (via `src/utils/audioDb.ts`) — Parent voice recordings persisted in browser
- **React State** — Game progress, current level, custom voices (loaded on mount)
- No backend API calls for core gameplay

## Key Development Notes

### Text-to-Speech Quirks

The app implements a workaround for browser TTS systems mis-expanding common Spanish abbreviations. Single consonant-vowel pairs (e.g., "BA", "MI") are appended with a silent "h" ("BAh", "MIh") at synthesis time. This preserves correct syllable sounds while bypassing abbreviation dictionaries. See the `processedText` regex in App.tsx lines 105–108.

### Speech Synthesis Timing

After calling `window.speechSynthesis.cancel()`, there's a 100ms delay before the next `speak()` call. This prevents a race condition in Chrome where immediate calls remain silent.

### Component Props Flow

Audio playback (`customVoices` object, `playAudioPrompt()` callback) is passed through the component tree:
- **App.tsx** (manages state, loads from IndexedDB)
  - → **ReadingGame** / **SyllabicSynthesisGame** (game logic)
  - → **TeddyBear** (character dialog/narration)
  - → **FriendsAnimation** (reward sequence)

### Vowel System

Each vowel (A, E, I, O, U) has a predefined 21-syllable list generated from all consonants + vowel combinations. The ReadingGame cycles through levels within a vowel. Advancing to the next vowel rotates through the list (A → E → I → O → U → A).

### Accessibility Notes

- Large, high-contrast buttons designed for small fingers
- No hover states critical to gameplay (touch-first design)
- Custom voice fallback ensures content remains accessible if system TTS is unavailable
- SVG-based coloring game with path-by-path hit detection

## Environment Variables

- **GEMINI_API_KEY** — Required for any Google Generative AI integration (check `.env.example`; not currently used in core gameplay but set up in README)
- **DISABLE_HMR** — Vite setting used in AI Studio; disables hot module reloading during agent edits

## Build & Deployment

- Built with **Vite** for fast dev iteration and optimized production bundles
- Output to `dist/` (can be served statically)
- No backend required; app is client-side only
- IndexedDB and Web Audio APIs are browser-only, not available in SSR contexts
