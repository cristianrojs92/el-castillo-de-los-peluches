# Análisis Funcional: El Castillo de los Peluches

## 1. Descripción General
"El Castillo de los Peluches" es una aplicación web interactiva educativa diseñada para iniciar a los niños pequeños en la lectoescritura a través del juego, la gamificación y el refuerzo positivo. Está construida con React, TypeScript, Vite y Tailwind CSS, y utiliza animaciones fluidas con Framer Motion. La aplicación destaca por su capacidad de personalizar la experiencia de aprendizaje incorporando las voces de los padres o familiares para guiar al niño, lo cual reduce la ansiedad y mejora la asimilación del conocimiento.

## 2. Arquitectura de Estados (Flujo del Usuario)
La aplicación (gestionada centralmente en `App.tsx`) se comporta como una máquina de estados con las siguientes fases principales:

- **`welcome` (Pantalla de Inicio):** Presenta el título del juego y permite elegir entre dos modos de aventura ("Buscar Sílabas" o "Armar Palabras"). También permite seleccionar la vocal con la que se quiere jugar (A, E, I, O, U) y acceder a la configuración para padres.
- **`playing` (Juego Activo):** Ejecuta el modo de juego seleccionado (`ReadingGame` o `SyllabicSynthesisGame`).
- **`reward_dance` (Baile de Recompensa):** Una vez superado el nivel, se muestra una animación de celebración (`FriendsAnimation`) donde los personajes del juego bailan.
- **`coloring` (Juego de Pintar):** Como premio final, la usuaria puede acceder a un lienzo interactivo (`ColoringGame`) para colorear dibujos predefinidos.

## 3. Módulos y Componentes Principales

### 3.1. Modo de Juego 1: Búsqueda de Sílabas (`ReadingGame.tsx`)
- **Objetivo:** El niño debe identificar una sílaba específica (ej. "BA") entre varias opciones presentadas.
- **Funcionamiento:** Se generan iteraciones donde una opción es correcta y la otra es un distractor aleatorio. Utiliza botones grandes con alto contraste. Incluye retroalimentación por voz y visual a través del componente mascota `TeddyBear`, que cambia de estado animado ('talking', 'correct', 'incorrect').
- **Progresión:** Utiliza un sistema de estrellas que se van llenando conforme el niño acierta. No hay penalización por fallar, solo un refuerzo positivo para que lo intente de nuevo.

### 3.2. Modo de Juego 2: Síntesis Silábica (`SyllabicSynthesisGame.tsx`)
- **Objetivo:** El niño debe ordenar sílabas desordenadas para formar una palabra completa (ej. CO - NE - JO).
- **Funcionamiento:** Muestra un emoji gigante como pista visual (ej. 🐰 para conejo) y "cajones" vacíos donde deben ir las sílabas. El niño selecciona las sílabas en el orden correcto. Al completar la palabra, hay una animación de "fusión" y celebración visual y auditiva.
- **Base de datos:** Contiene un diccionario interno predefinido de 30 palabras amigables, infantiles y completamente fonéticas.

### 3.3. Configuración Parental y Grabación de Voz (`AudioSettings.tsx` y `audioDb.ts`)
- **Objetivo:** Permitir a los padres grabar sus propias voces para reemplazar las guías sintéticas del juego.
- **Funcionamiento:** Presenta una interfaz de "Diccionario de Audios" dividida por categorías (Bienvenida, Festejos, Explicaciones de Error, y cada una de las Sílabas). Utiliza la API `MediaRecorder` del navegador para capturar el audio directamente desde el micrófono del dispositivo.
- **Almacenamiento Local (`audioDb.ts`):** Los audios se guardan localmente en el navegador utilizando `IndexedDB`. Esto asegura privacidad total (los audios de los niños y padres no se suben a ningún servidor externo) y permite persistencia entre sesiones.
- **Fallback (Respaldo):** Si no hay un audio personalizado grabado para una acción específica, el sistema utiliza `window.speechSynthesis` (Text-to-Speech nativo del navegador) con una configuración ajustada (pitch y rate) para sonar como una voz amigable en acento "es-MX".

### 3.4. Recompensas: Animación y Coloreo (`FriendsAnimation.tsx` y `ColoringGame.tsx`)
- **`FriendsAnimation`:** Un componente que utiliza SVGs animados creados internamente (un conejito y un unicornio) combinados con la mascota principal, bailando bajo luces dinámicas y confeti. Sirve como clímax del refuerzo positivo.
- **`ColoringGame`:** Un mini-juego de coloreo tipo "tap-to-fill". Ofrece 3 diseños SVG integrados ("La Princesa y el Conejito", "El Castillo de Nubes", "El Unicornio"). Contiene una paleta de colores curada y una herramienta de borrador. Utiliza la Web Audio API para emitir un sonido orgánico de "pop" cada vez que se pinta una sección.

### 3.5. Componentes Visuales y Decorativos
- **`CastleBackground.tsx`:** Mantiene un fondo inmersivo, suave y constante con temática de castillo de cuento de hadas detrás de toda la aplicación.
- **`TeddyBear.tsx`:** Es el guía y mascota interactiva del juego. Reacciona en tiempo real a las acciones del usuario.

## 4. Detalles Técnicos y Stack Tecnológico
- **Core:** React 19 + TypeScript + Vite.
- **Estilos:** Tailwind CSS v4 para diseño responsivo, priorizando el alto contraste, tipografías robustas, bordes redondeados y colores vibrantes (paletas pink, purple, rose, amber).
- **Animaciones:** `motion/react` (Framer Motion) implementado para micro-interacciones, físicas de rebote, transiciones de salida/entrada y keyframes complejos (ej. cuando una sílaba es incorrecta, el botón tiembla).
- **Almacenamiento Local:** IndexedDB nativo (sin dependencias externas).
- **APIs Web Nativas:** 
  - `SpeechSynthesis` (Text-to-Speech)
  - `MediaRecorder` (Micrófono local)
  - `Web Audio API` (Generación de ondas de sonido por oscilador)

## 5. Conclusión del Análisis
El proyecto está excelentemente estructurado desde el punto de vista psicopedagógico y técnico. Utiliza el refuerzo positivo constante y carece de penalizaciones estrictas (si hay error, la sílaba incorrecta simplemente se atenúa, vibra suavemente y se repite la instrucción de forma positiva). 
El aspecto más innovador de su arquitectura es el sistema de **Voz Familiar**, que descentraliza el contenido de audio, elimina dependencias de APIs en la nube de pago, asegura la privacidad de la familia y permite un grado de personalización emocional crucial para el aprendizaje temprano.
