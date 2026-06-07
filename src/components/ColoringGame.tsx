import { useState } from 'react';
import { motion } from 'motion/react';
import { Palette, Trash2, ArrowLeft, CheckCircle, Sparkles, Image as ImageIcon } from 'lucide-react';

interface ColoringGameProps {
  onBackToGame: () => void;
}

interface ImageArea {
  id: string;
  name: string;
  path: string;
}

interface DesignOption {
  id: string;
  title: string;
  description: string;
  areas: ImageArea[];
}

// 3 Cute, high-contrast, segmented child illustrations using custom geometric paths for responsive tap-to-fill
const DESIGNS: DesignOption[] = [
  {
    id: 'princess_bear',
    title: 'LA PRINCESA Y EL CONEJITO',
    description: 'LA PRINCESA Y SU MEJOR AMIGO EL CONEJITO EN EL BOSQUE DE CHOCOLATE.',
    areas: [
      // Background sky
      { id: 'sky', name: 'CIELO', path: 'M 10 10 H 390 V 270 H 10 Z' },
      // Cloud left
      { id: 'cloud_l', name: 'NUBE IZQUIERDA', path: 'M 50 80 A 15 15 0 0 1 80 70 A 25 25 0 0 1 120 80 A 15 15 0 0 1 130 95 H 50 Z' },
      // Cloud right
      { id: 'cloud_r', name: 'NUBE DERECHA', path: 'M 270 60 A 20 20 0 0 1 310 50 A 30 30 0 0 1 360 65 A 15 15 0 0 1 370 80 H 270 Z' },
      // Sun
      { id: 'sun', name: 'SOL', path: 'M 200 40 A 25 25 0 1 1 199.9 40 Z' },
      // Left Hill
      { id: 'hill_l', name: 'LOMA IZQUIERDA', path: 'M 10 270 Q 120 200 240 270 Z' },
      // Right Hill
      { id: 'hill_r', name: 'LOMA DERECHA', path: 'M 160 270 Q 280 180 390 270 Z' },
      
      // Central Princess Throne/Castle Tower
      { id: 'castle_body', name: 'TORRE DEL CASTILLO', path: 'M 160 140 H 240 V 230 H 160 Z' },
      { id: 'castle_roof', name: 'TECHO DEL CASTILLO', path: 'M 150 140 L 200 80 L 250 140 Z' },
      { id: 'castle_door', name: 'PUERTA PRINCIPAL', path: 'M 185 230 A 15 15 0 0 1 215 230 Z' },

      // bunny Left (representing our Bunny companion!)
      { id: 'bear_head', name: 'CABEZA DEL CONEJITO', path: 'M 80 160 A 16 16 0 1 1 79.9 160 Z' },
      { id: 'bear_ear_l', name: 'OREJA IZQUIERDA CONEJITO', path: 'M 62 148 A 6 6 0 1 1 61.9 148 Z' },
      { id: 'bear_ear_r', name: 'OREJA DERECHA CONEJITO', path: 'M 98 148 A 6 6 0 1 1 97.9 148 Z' },
      { id: 'bear_body', name: 'CUERPO DEL CONEJITO', path: 'M 70 176 H 90 L 100 220 H 60 Z' },
      { id: 'bear_belly', name: 'PANCITA DEL CONEJITO', path: 'M 75 185 H 85 L 90 210 H 70 Z' },

      // Princess Right
      { id: 'princess_face', name: 'ROSTRO DE LA PRINCESA', path: 'M 310 165 A 15 15 0 1 1 309.9 165 Z' },
      { id: 'princess_hair', name: 'CABELLO DE LA PRINCESA', path: 'M 290 160 Q 310 135 330 160 Q 310 150 290 160' },
      { id: 'princess_crown', name: 'CORONA REAL', path: 'M 300 150 L 303 138 L 310 144 L 317 138 L 320 150 Z' },
      { id: 'princess_dress', name: 'VESTIDO DE LA PRINCESA', path: 'M 298 178 L 275 224 H 345 L 322 178 Z' },
    ],
  },
  {
    id: 'clouds_castle',
    title: 'EL CASTILLO DE NUBES',
    description: 'UN CASTILLO DE ALGODÓN FLOTANDO ENTRE ESTRELLAS MÁGICAS.',
    areas: [
      // Sky blue backdrop
      { id: 'c_sky', name: 'FONDO DEL ESPACIO', path: 'M 10 10 H 390 V 270 H 10 Z' },
      // Giant Star 1
      { id: 'c_star1', name: 'ESTRELLA DE LA MAÑANA', path: 'M 40 40 L 44 48 L 52 50 L 44 52 L 40 60 L 36 52 L 28 50 L 36 48 Z' },
      // Giant Star 2
      { id: 'c_star2', name: 'ESTRELLA FUGAZ', path: 'M 340 40 L 344 48 L 352 50 L 344 52 L 340 60 L 336 52 L 328 50 L 336 48 Z' },
      
      // Floating Cloud base
      { id: 'c_cloud_b1', name: 'NUBE BASE 1', path: 'M 30 230 A 25 25 0 0 1 70 210 A 35 35 0 0 1 120 210 A 25 25 0 0 1 150 230 H 30 Z' },
      { id: 'c_cloud_b2', name: 'NUBE BASE 2', path: 'M 250 230 A 25 25 0 0 1 290 210 A 35 35 0 0 1 340 210 A 25 25 0 0 1 370 230 H 250 Z' },
      { id: 'c_cloud_main', name: 'GRAN NUBE CENTRAL', path: 'M 100 245 A 30 30 0 0 1 150 220 A 45 45 0 0 1 240 220 A 30 30 0 0 1 300 245 H 100 Z' },

      // Left Spire
      { id: 'c_spire_l', name: 'TORRE IZQUIERDA', path: 'M 120 120 H 155 V 222 H 120 Z' },
      { id: 'c_roof_l', name: 'TEJADO IZQUIERDO', path: 'M 110 120 L 137.5 70 L 165 120 Z' },
      // Right Spire
      { id: 'c_spire_r', name: 'TORRE DERECHA', path: 'M 235 120 H 270 V 222 H 235 Z' },
      { id: 'c_roof_r', name: 'TEJADO DERECHO', path: 'M 225 120 L 252.5 70 L 280 120 Z' },

      // Main Block
      { id: 'c_block_m', name: 'PALACIO PRINCIPAL', path: 'M 155 140 H 235 V 224 H 155 Z' },
      { id: 'c_roof_m', name: 'GRAN DOMO', path: 'M 152 140 Q 195 90 238 140 Z' },
      { id: 'c_door', name: 'PASAJE SECRETO', path: 'M 180 224 A 15 20 0 0 1 210 224 Z' },
    ],
  },
  {
    id: 'unicorn',
    title: 'EL UNICORNIO DE LOS DESEOS',
    description: 'UN DULCE UNICORNIO CON CRINES BRILLANTES BAJO EL ARCOÍRIS.',
    areas: [
      { id: 'u_sky', name: 'FONDO DEL ARCOÍRIS', path: 'M 10 10 H 390 V 270 H 10 Z' },
      // Rainbow lines
      { id: 'u_rb1', name: 'ARCOÍRIS CORAL', path: 'M 30 200 A 150 150 0 0 1 370 200 H 340 A 120 120 0 0 0 60 200 Z' },
      { id: 'u_rb2', name: 'ARCOÍRIS AMARILLO', path: 'M 60 200 A 120 120 0 0 1 340 200 H 310 A 90 90 0 0 0 90 200 Z' },
      { id: 'u_rb3', name: 'ARCOÍRIS CELESTE', path: 'M 90 200 A 90 90 0 0 1 310 200 H 280 A 60 60 0 0 0 120 200 Z' },

      // Unicorn Body
      { id: 'u_body', name: 'CUERPO UNICORNIO', path: 'M 120 170 Q 150 130 190 170 Q 170 205 130 205 Z' },
      { id: 'u_neck', name: 'CUELLO UNICORNIO', path: 'M 165 160 L 190 110 L 210 125 L 185 165 Z' },
      { id: 'u_head', name: 'ROSTRO UNICORNIO', path: 'M 185 110 L 215 80 L 235 95 L 205 125 Z' },
      { id: 'u_horn', name: 'CUERNO MÁGICO', path: 'M 215 80 L 232 50 L 225 78 Z' },
      { id: 'u_legs_f', name: 'PATITAS DELANTERAS', path: 'M 140 195 L 140 240 H 152 L 152 195 Z' },
      { id: 'u_legs_b', name: 'PATITAS TRASERAS', path: 'M 175 195 L 175 240 H 187 L 187 195 Z' },
      { id: 'u_mane', name: 'CRINES DE FANTASÍA', path: 'M 165 115 Q 150 125 158 140 Q 148 150 162 165 Z' },
    ],
  },
];

const COLORS_PALETTE = [
  { hex: '#F87171', name: 'CORAL', desc: 'ROJO SUAVE' },
  { hex: '#60A5FA', name: 'CELESTE', desc: 'CIELO CLARO' },
  { hex: '#34D399', name: 'MENTA', desc: 'VERDE FRESQUITO' },
  { hex: '#FBBF24', name: 'SOL', desc: 'AMARILLO FELIZ' },
  { hex: '#F472B6', name: 'CHICLE', desc: 'ROSA DIVERTIDO' },
  { hex: '#C084FC', name: 'MÁGICO', desc: 'MORADO FANTASÍA' },
  { hex: '#FFFBEB', name: 'CREMA', desc: 'TIZA / BORRADOR' },
];

export default function ColoringGame({ onBackToGame }: ColoringGameProps) {
  const [selectedDesign, setSelectedDesign] = useState<DesignOption>(DESIGNS[0]);
  const [activeColor, setActiveColor] = useState<string>(COLORS_PALETTE[0].hex);
  const [paintedAreas, setPaintedAreas] = useState<Record<string, Record<string, string>>>({
    princess_bear: {},
    clouds_castle: {},
    unicorn: {},
  });

  // Synthesizes a soft organic musical "pop" sound when children paint
  const triggerPopSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // High quick sweep up for sound effects
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (err) {
      console.warn('AudioContext failed:', err);
    }
  };

  const handleAreaClick = (areaId: string) => {
    triggerPopSound();
    setPaintedAreas((prev) => ({
      ...prev,
      [selectedDesign.id]: {
        ...prev[selectedDesign.id],
        [areaId]: activeColor,
      },
    }));
  };

  const handleReset = () => {
    setPaintedAreas((prev) => ({
      ...prev,
      [selectedDesign.id]: {},
    }));
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 relative p-4 md:p-6 select-none" id="coloring-game">
      {/* Top Header Controls */}
      <div className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <button
          onClick={onBackToGame}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-2xl transition shadow-sm cursor-pointer hover:bg-slate-50 uppercase"
          id="back-to-home"
        >
          <ArrowLeft className="w-5 h-5 text-purple-600" />
          <span>VOLVER A JUGAR VOCALES</span>
        </button>

        <div className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-2xl px-5 py-2.5 shadow-sm">
          <Palette className="w-5 h-5 text-yellow-200 animate-bounce" />
          <span className="font-sans font-extrabold text-base tracking-tight uppercase">EL CASTILLO DE COLORES</span>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 border-2 border-rose-100 text-rose-600 font-bold rounded-2xl hover:bg-rose-100 transition cursor-pointer uppercase"
          id="clear-canvas"
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-sm">BORRAR TODO</span>
        </button>
      </div>

      {/* Main Grid: Selection bar on top and layout below */}
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        
        {/* Left column (4 levels/cards selection) */}
        <div className="md:col-span-3 flex md:flex-col gap-3 overflow-x-auto md:overflow-x-visible pb-3 md:pb-0">
          <h3 className="hidden md:block font-bold text-slate-500 text-xs uppercase tracking-wide px-1 mb-1">
            ELIGE UN DIBUJO PARA PINTAR
          </h3>
          {DESIGNS.map((design) => {
            const isSelected = selectedDesign.id === design.id;
            return (
              <button
                key={design.id}
                onClick={() => setSelectedDesign(design)}
                className={`flex-shrink-0 flex md:flex-col items-center md:items-start text-left gap-3 p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-purple-100 border-purple-500 shadow-sm'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className={`p-2 rounded-xl ${isSelected ? 'bg-purple-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm uppercase">{design.title}</h4>
                  <p className="hidden md:block text-slate-500 text-2xs leading-snug mt-0.5 uppercase">
                    {design.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Center: The Coloring canvas (6 columns) */}
        <div className="md:col-span-6 bg-white border-4 border-white shadow-lg rounded-3xl p-4 flex flex-col items-center justify-center relative min-h-[350px]">
          {/* Subtle instructions for little girl */}
          <div className="absolute top-3 left-4 text-xs font-bold text-purple-400 bg-purple-50/50 px-3 py-1 rounded-full flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 inline text-amber-400 animate-spin" />
            <span className="uppercase">¡TOCA UNA PARTE PARA PINTARLA!</span>
          </div>

          <svg
            viewBox="0 0 400 280"
            className="w-full max-w-md h-auto aspect-[4/3] drop-shadow-sm select-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {selectedDesign.areas.map((area) => {
              const customFill = paintedAreas[selectedDesign.id]?.[area.id] || 'transparent';
              return (
                <path
                  key={area.id}
                  d={area.path}
                  fill={customFill}
                  stroke="#1E293B" // Slate 800 (chubby dark organic lines)
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-colors duration-200 cursor-pointer hover:opacity-90 hover:stroke-purple-700"
                  onClick={() => handleAreaClick(area.id)}
                  title={area.name}
                />
              );
            })}
          </svg>
        </div>

        {/* Right column: The crayons/palette (3 columns) */}
        <div className="md:col-span-3 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-sm tracking-tight border-b pb-2 flex items-center gap-1 uppercase">
              <span>🖍️</span> ELIGE UN CRAYÓN
            </h3>

            {/* Crayons Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-2 gap-3.5">
              {COLORS_PALETTE.map((color) => {
                const isSelected = activeColor === color.hex;
                const isEraser = color.hex === '#FFFBEB';
                return (
                  <button
                    key={color.hex}
                    onClick={() => setActiveColor(color.hex)}
                    className="flex flex-col items-center gap-1.5 p-1 transition-transform active:scale-95 cursor-pointer relative"
                    title={color.desc}
                  >
                    <motion.div
                      animate={isSelected ? { scale: 1.1 } : { scale: 1 }}
                      style={{ backgroundColor: color.hex }}
                      className={`w-12 h-12 rounded-full shadow-inner border-4 transition-all ${
                        isSelected ? 'border-purple-600 scale-105' : 'border-slate-100 hover:border-slate-300'
                      }`}
                    >
                      {/* Crayon tip accent */}
                      <div className="w-full h-1/3 bg-black/10 rounded-t-full" />
                    </motion.div>
                    <span className="text-2xs font-extrabold text-slate-700 text-center truncate w-full uppercase">
                      {isEraser ? 'BORRADOR' : color.name}
                    </span>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 bg-purple-600 text-white rounded-full p-0.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <p className="text-3xs text-slate-500 font-semibold leading-relaxed uppercase">
              * EL "BORRADOR DE TIZA" TE PERMITE QUITARLE EL COLOR A UNA ZONA PARA PINTARLA DE NUEVO.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
