# Funcionalidades del Proyecto: El Castillo de los Peluches

"El Castillo de los Peluches" es una aplicación web educativa e interactiva diseñada para la iniciación en la lectoescritura de niños pequeños. La plataforma hace uso extensivo de la gamificación, animaciones fluidas y refuerzo positivo para mantener al usuario (niños en edad preescolar/primeros años) enganchado en el proceso de aprendizaje.

A continuación, se detalla la lista completa de las funcionalidades integradas en la aplicación:

## 1. Modos de Juego Educativos

La aplicación cuenta con 4 "aventuras" o modos de juego principales que cubren distintos aspectos y niveles del desarrollo de la lectoescritura:

### 1.1. Buscar Sílabas (`ReadingGame.tsx`)
- **Objetivo:** Reconocimiento visual y auditivo de sílabas.
- **Mecánica:** El juego pide al niño que encuentre una sílaba específica (ej. "MA", "PE") entre un grupo de opciones que incluyen distractores.
- **Funcionalidades extra:** Permite al usuario seleccionar qué vocal quiere practicar (A, E, I, O, U) antes de iniciar y ajustar el nivel de dificultad (Fácil, Medio, Difícil), lo cual aumenta o disminuye la cantidad de distractores en pantalla.

### 1.2. Armar Palabras - Síntesis Silábica (`SyllabicSynthesisGame.tsx`)
- **Objetivo:** Comprender cómo la unión de sílabas forma palabras completas.
- **Mecánica:** Se presenta un dibujo o emoji (ej. 🐰 para conejo) y una serie de bloques desordenados que contienen sílabas. El niño debe tocar las sílabas en el orden correcto para ubicarlas en "cajones" y formar la palabra.

### 1.3. Socios Mágicos - Artículos (`ArticleGame.tsx`)
- **Objetivo:** Aprendizaje de los artículos definidos y su concordancia de género y número.
- **Mecánica:** Se muestra una palabra o personaje y el niño debe decidir cuál artículo ("EL" o "LA") le corresponde correctamente.
- **Progresión:** Cuenta con un sistema de racha (*streak*). Al encadenar varias respuestas correctas consecutivas sin equivocarse, se desbloquea una fase avanzada donde entran en juego los artículos plurales ("LOS" y "LAS").

### 1.4. El Tren de las Acciones - Formación de Oraciones (`SentenceTrainGame.tsx`)
- **Objetivo:** Estructuración sintáctica y formación de oraciones simples (Sujeto + Verbo + Predicado).
- **Mecánica:** Presenta una serie de vagones de tren vacíos y piezas que contienen fragmentos de una oración mezclados. El niño debe arrastrar o tocar las piezas en el orden lógico correcto para formar una oración coherente y hacer que el tren avance.

## 2. Sistema de Recompensas y Motivación

Para mantener la atención y promover la motivación, el proyecto evita la penalización por errores y se centra en un robusto sistema de recompensas:

### 2.1. Refuerzo Positivo Constante y Guía Animada (`TeddyBear.tsx`)
- La aplicación cuenta con una mascota (un osito) que acompaña en todo momento. Este cambia su estado animado reaccionando en tiempo real: habla para dar instrucciones, celebra cuando se acierta ("correct"), y anima a intentar de nuevo si el niño se equivoca ("incorrect").

### 2.2. Baile de Recompensa (`FriendsAnimation.tsx`)
- Al completar un nivel de cualquier juego, se dispara una pantalla de celebración temporal donde los personajes del juego bailan bajo luces y confeti, generando un refuerzo audiovisual muy estimulante.

### 2.3. Juego de Pintar (`ColoringGame.tsx`)
- Como gran premio tras una sesión exitosa de juegos, se desbloquea el modo de colorear. El niño puede utilizar un lienzo interactivo para pintar con una paleta predefinida dibujos en formato SVG ("La Princesa", "El Castillo", etc.). Cada toque al pintar genera un suave sonido de *pop* (usando la Web Audio API).

## 3. Accesibilidad, Configuración y Personalización

### 3.1. Sistema de "Voz Familiar" (`AudioSettings.tsx` y `audioDb.ts`)
- **Mecánica Innovadora:** La funcionalidad estrella a nivel técnico. Permite a los padres o familiares usar el micrófono del dispositivo para **grabar su propia voz** leyendo las distintas sílabas, palabras de felicitación e instrucciones.
- **Privacidad y Persistencia:** Las grabaciones se guardan exclusivamente de manera local en el navegador del usuario utilizando `IndexedDB`. No hay uso de servidores externos.
- **Respaldo (Fallback):** Si no hay audios grabados, la aplicación recurre a un sistema de Texto-a-Voz (Text-to-Speech nativo del navegador) adaptado para sonar natural y amigable (acentos locales como `es-MX`).

## 4. Elementos Transversales

- **Gestión Centralizada de Estado (`App.tsx`):** Controla la navegación fluida a través de las distintas "pantallas" (`welcome`, `playing`, `reward_dance`, `coloring`) permitiendo transiciones orgánicas sin recargas de página.
- **Entorno Inmersivo (`CastleBackground.tsx`):** Un fondo dinámico y constante que ambienta la aplicación en un entorno de castillo mágico, ayudando a la concentración y dando contexto estético y lúdico al aprendizaje.
- **Animaciones Fluidas:** Uso exhaustivo de `framer-motion` para darle vida a los componentes (micro-interacciones en los botones, animaciones de entrada/salida y vibraciones al equivocarse).
