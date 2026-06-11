Este documento detalla la arquitectura, las historias de usuario y la lógica de programación para implementar el nuevo módulo de lectura continua guiada por voz. El diseño integra una estética de anime mágico (tipo magical girl) para maximizar el enganche visual y utiliza la detección de volumen del micrófono para entrenar la memoria de trabajo fonológica.

1. Resumen Funcional
El objetivo pedagógico de este módulo es obligar a la usuaria a sostener el sonido de las letras de forma continua (técnica del gusanito), evitando la fragmentación silábica ("la P con la A").

Para lograrlo, la interfaz presenta una "Carta Estelar" cubierta por niebla oscura. La usuaria debe mantener presionado un botón central y emitir un sonido constante con su voz. El volumen capturado por el micrófono actúa como un "viento mágico" que desliza la niebla de izquierda a derecha, revelando la palabra paulatinamente. Si la usuaria hace silencio, la niebla se detiene, previniendo visualmente el salto o corte de la palabra.

2. Historias de Usuario (User Stories)
Epic 1: Preparación y Permisos
HU 1.1: Permiso de Micrófono

Como tutor/padre,
quiero que al ingresar a esta sección la aplicación me solicite permiso para usar el micrófono del dispositivo con un mensaje claro,
para garantizar que la mecánica de voz funcione correctamente y de forma segura en el navegador local.

Epic 2: Mecánica de Voz y Revelación (Core Gameplay)
HU 2.1: Interfaz de Carta Oculta

Como usuaria infantil,
quiero ver en el centro de la pantalla una Carta Mágica con bordes dorados cubierta por una estela de niebla,
para no asustarme viendo toda la palabra junta y concentrarme en la magia.

HU 2.2: Activación del Hechizo (Micrófono)

Como usuaria infantil,
quiero poder tocar y mantener presionado un botón brillante con forma de báculo/varita mágica,
para que el juego empiece a escuchar mi voz.

HU 2.3: Barrido de Niebla por Voz Continua

Como usuaria infantil,
quiero que mientras mantengo el botón apretado y hago un sonido largo ("PAAAAAA"), la niebla se mueva suavemente hacia la derecha revelando las letras,
para sentir que mi voz tiene poderes mágicos y destraba el nivel.

HU 2.4: Pausa de Niebla (Cero Penalización)

Como usuaria infantil,
quiero que si me quedo callada o tomo aire, la niebla simplemente se detenga donde está (sin retroceder ni hacer sonidos de error),
para poder seguir intentándolo sin frustrarme.

Epic 3: Feedback y Recompensa Visual
HU 3.1: Celebración Anime al Descubrir

Como usuaria infantil,
quiero que al barrer el 100% de la niebla, la palabra brille con destellos de luz neón y aparezca el dibujo correspondiente,
para confirmar que leí la palabra correctamente.

HU 3.2: Guía del Conejo Mágico

Como usuaria infantil,
quiero que el Conejo azul, vestido con una capa estelar, me aliente diciendo frases como "¡Mantené el sonido, la magia está funcionando!",
para saber qué hacer si me quedo trabada.