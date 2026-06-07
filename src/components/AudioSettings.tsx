import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Square, Play, Trash2, X, Volume2, Save, VolumeX, CheckCircle, RefreshCw } from 'lucide-react';
import { saveAudio, deleteAudio, getAllAudios } from '../utils/audioDb';

interface AudioSettingsProps {
  onClose: () => void;
  onUpdateCache: () => void;
}

interface AudioTrackItem {
  id: string;
  label: string;
  defaultText: string;
  category: 'vocal' | 'gameplay' | 'feedback';
}

const VOWELS = ['A', 'E', 'I', 'O', 'U'] as const;
const CONSONANTS = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'Ñ', 'P', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'];

const BASE_TRACKS: AudioTrackItem[] = [
  { id: 'welcome', label: 'BIENVENIDA', defaultText: '¡HOLA PRINCESA! VAMOS A JUGAR.', category: 'gameplay' },
  { id: 'find_prefix', label: 'PREGUNTA', defaultText: 'TOCA LA SÍLABA...', category: 'gameplay' },
  { id: 'correct_generic', label: 'FESTEJO DE ACIERTO', defaultText: '¡MUY BIEN!', category: 'feedback' },
  { id: 'incorrect_is', label: 'EXPLICACIÓN DE ERROR (PARTE 1)', defaultText: 'ESA SÍLABA QUE TOCASTE ES...', category: 'feedback' },
  { id: 'incorrect_find', label: 'EXPLICACIÓN DE ERROR (PARTE 2)', defaultText: '...PERO ESTAMOS BUSCANDO LA SÍLABA...', category: 'feedback' },
  { id: 'victory', label: 'PREMIO DE PINTURA', defaultText: '¡LO LOGRASTE! COMO PREMIO, ¡VAMOS A PINTAR!', category: 'gameplay' },
];

const generateAllTracks = (): AudioTrackItem[] => {
  const tracks = [...BASE_TRACKS];
  VOWELS.forEach((vowel) => {
    CONSONANTS.forEach((consonant) => {
      const s = consonant + vowel;
      tracks.push({
        id: s,
        label: `SÍLABA ${s}`,
        defaultText: s,
        category: 'vocal',
      });
    });
  });
  return tracks;
};

const AUDIO_TRACKS = generateAllTracks();

export default function AudioSettings({ onClose, onUpdateCache }: AudioSettingsProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'general' | 'A' | 'E' | 'I' | 'O' | 'U'>('general');
  const [recordings, setRecordings] = useState<Record<string, string>>({}); // id -> blobUrl

  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [isPlayingId, setIsPlayingId] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Load existing parent custom recordings from IndexedDB on initiation
  useEffect(() => {
    loadSavedRecordings();
    return () => {
      // Clean up object URLs to prevent memory leaks
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
    };
  }, []);

  const loadSavedRecordings = async () => {
    try {
      const items = await getAllAudios();
      const updated: Record<string, string> = {};
      items.forEach((item) => {
        const blob = new Blob([item.arrayBuffer], { type: item.mimeType });
        updated[item.id] = URL.createObjectURL(blob);
      });
      setRecordings(updated);
    } catch (err) {
      console.error('Error reading indexdb audios:', err);
    }
  };

  const startRecording = async (id: string) => {
    setPermissionError(null);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        const arrayBuffer = await audioBlob.arrayBuffer();

        // Save to Database
        await saveAudio(id, audioBlob.type, arrayBuffer);

        // Update Component State blob URL
        const prevUrl = recordings[id];
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl);
        }
        const newUrl = URL.createObjectURL(audioBlob);
        setRecordings((prev) => ({ ...prev, [id]: newUrl }));
        setRecordingId(null);

        // Close stream tracks
        stream.getTracks().forEach((track) => track.stop());

        // Notify parent components to update their lookup caches
        onUpdateCache();
      };

      setRecordingId(id);
      mediaRecorder.start();
    } catch (err) {
      console.error('Could not request micro permissions:', err);
      setPermissionError('NO PUDIMOS ACCEDER AL MICRÓFONO. POR FAVOR PERMITE LOS PERMISOS.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingId) {
      mediaRecorderRef.current.stop();
    }
  };

  const playRecordedTrack = (id: string, url: string) => {
    // Stop any currently playing audio
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      if (isPlayingId === id) {
        setIsPlayingId(null);
        return;
      }
    }

    const audio = new Audio(url);
    activeAudioRef.current = audio;
    setIsPlayingId(id);

    audio.onended = () => {
      setIsPlayingId(null);
    };

    audio.play().catch((err) => {
      console.error('Error playing recorded track', err);
      setIsPlayingId(null);
    });
  };

  const deleteRecordedTrack = async (id: string) => {
    try {
      const url = recordings[id];
      if (url) {
        URL.revokeObjectURL(url);
      }
      await deleteAudio(id);
      setRecordings((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      onUpdateCache();
    } catch (err) {
      console.error('Error deleting audio:', err);
    }
  };

  // Speaks using fallback text speech synthesis
  const previewTTS = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();

    // Delay speech execution slightly to prevent race conditions in Chrome
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-MX';
      utterance.rate = 0.8;
      utterance.pitch = 1.35;
      
      // Find an elegant Spanish voice model from browser list
      const availableVoices = window.speechSynthesis.getVoices();
      const esVoice =
        availableVoices.find((v) => v.lang.toLowerCase() === 'es-mx') ||
        availableVoices.find((v) => v.lang.toLowerCase() === 'es-es') ||
        availableVoices.find((v) => v.lang.toLowerCase().startsWith('es'));

      if (esVoice) {
        utterance.voice = esVoice;
      }

      window.speechSynthesis.speak(utterance);
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border-4 border-pink-200"
        id="audio-settings-modal"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-400 to-rose-400 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Mic className="w-8 h-8 text-white drop-shadow-md animate-pulse" />
            <div>
              <h2 className="text-2xl font-bold font-sans tracking-tight uppercase">VOZ FAMILIAR DE MAMÁ Y PAPÁ</h2>
              <p className="text-xs text-rose-50/90 font-medium uppercase">GRABA TU PROPIA VOZ PARA MOTIVAR Y ENSEÑAR A TU PRINCESA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/20 active:bg-white/30 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            id="close-audio-settings"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contents */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {permissionError && (
            <div className="bg-rose-50 text-rose-700 p-4 rounded-2xl border border-rose-200 text-sm flex items-center gap-2 uppercase">
              <span className="text-lg">⚠️</span> {permissionError}
            </div>
          )}

          <div className="bg-amber-50 rounded-2xl p-4 text-emerald-950 text-sm border-2 border-amber-200/50 space-y-2 uppercase">
            <h4 className="font-bold flex items-center gap-2">
              <span className="text-lg">✨</span> ¿CÓMO FUNCIONA ESTO?
            </h4>
            <p className="text-xs text-amber-900 leading-relaxed font-bold">
              LOS EXPERTOS PSICOPEDAGÓGICOS CONFIRMAN QUE LA VOZ DE MAMÁ O PAPÁ REDUCE LA ANSIEDAD Y ACELERA EL APRENDIZAJE.
              ¡GRABA CADA FRASE TOCANDO EL BOTÓN ROJO! SI NO GRABAS ALGUNA, USAREMOS UNA LINDA VOZ SINTÉTICA EN ESPAÑOL AUTOMÁTICAMENTE.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
              <h3 className="font-black text-gray-800 text-sm tracking-wide uppercase">DICCIONARIO DE AUDIOS</h3>
              <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-2xl">
                {(['general', 'A', 'E', 'I', 'O', 'U'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 font-extrabold text-xs rounded-xl uppercase transition cursor-pointer ${
                      activeTab === tab
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    {tab === 'general' ? 'GUÍAS' : `VOCAL ${tab}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 overflow-hidden rounded-2xl border border-slate-100">
              {AUDIO_TRACKS.filter((track) => {
                if (activeTab === 'general') {
                  return track.category !== 'vocal';
                }
                return track.category === 'vocal' && track.id.endsWith(activeTab);
              }).map((track) => {
                const isCustom = !!recordings[track.id];
                const isThisRecording = recordingId === track.id;
                const isThisPlaying = isPlayingId === track.id;

                return (
                  <div
                    key={track.id}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 transition-all ${
                      isThisRecording ? 'bg-rose-50/80 animate-pulse' : 'bg-white hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold py-0.5 px-2.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                          {track.category === 'vocal' ? 'SÍLABAS' : track.category === 'gameplay' ? 'GUÍA' : 'FESTEJOS'}
                        </span>
                        {isCustom ? (
                          <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 rounded-full uppercase">
                            <CheckCircle className="w-3.5 h-3.5" /> GRABADO
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-400 text-xs bg-slate-50 px-2 rounded-full uppercase">
                            <Volume2 className="w-3.5 h-3.5" /> VOZ SINTÉTICA
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-gray-800 text-base uppercase">{track.label}</h4>
                      <p className="text-xs text-slate-500 italic block uppercase font-bold">
                        TEXTO GUÍA: "{track.defaultText}"
                      </p>
                    </div>

                    {/* Tools */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* TTS system audio preview */}
                      {!isCustom && !isThisRecording && (
                        <button
                          onClick={() => previewTTS(track.defaultText)}
                          className="flex items-center gap-1 text-xs py-1.5 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition shadow-sm cursor-pointer uppercase font-bold"
                          title="PROBAR AUDIO DEL SISTEMA"
                        >
                          <Volume2 className="w-4 h-4" /> PROBAR
                        </button>
                      )}

                      {/* Playback for user recordings */}
                      {isCustom && !isThisRecording && (
                        <button
                          onClick={() => playRecordedTrack(track.id, recordings[track.id])}
                          className={`flex items-center gap-1 text-xs py-1.5 px-3 rounded-xl font-bold transition shadow-sm cursor-pointer uppercase ${
                            isThisPlaying
                              ? 'bg-rose-500 text-white hover:bg-rose-600'
                              : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          }`}
                        >
                          <Play className={`w-4 h-4 ${isThisPlaying ? 'animate-spin' : ''}`} />
                          {isThisPlaying ? 'SONANDO...' : 'ESCUCHAR'}
                        </button>
                      )}

                      {/* Microphone handler */}
                      {isThisRecording ? (
                        <button
                          onClick={stopRecording}
                          className="flex items-center gap-1.5 bg-red-600 text-white font-bold py-1.5 px-4 rounded-xl shadow-md hover:bg-red-700 transition cursor-pointer uppercase"
                        >
                          <Square className="w-4 h-4 animate-scale-loop" fill="currentColor" />
                          <span>GUARDAR</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => startRecording(track.id)}
                          className="flex items-center gap-1 border-2 border-rose-500 text-rose-600 font-bold hover:bg-rose-50 py-1.5 px-3 rounded-xl transition shadow-sm cursor-pointer uppercase"
                        >
                          <Mic className="w-4 h-4" />
                          <span>{isCustom ? 'REGRABAR' : 'GRABAR'}</span>
                        </button>
                      )}

                      {/* Delete controller */}
                      {isCustom && !isThisRecording && (
                        <button
                          onClick={() => deleteRecordedTrack(track.id)}
                          className="p-1 px-1.5 border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer"
                          title="ELIMINAR"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-5 flex justify-end gap-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold rounded-2xl shadow transition cursor-pointer uppercase"
          >
            LISTO, SALIR
          </button>
        </div>
      </motion.div>
    </div>
  );
}
