import { useCallback, useEffect, useRef, useState } from 'react';

export type MicStatus = 'idle' | 'requesting' | 'ready' | 'denied' | 'unavailable';

/**
 * Acceso al micrófono con medición de volumen (RMS 0..1) para el Puente de
 * Cartas Estelares. No graba ni guarda audio: solo analiza la amplitud en
 * tiempo real con un AnalyserNode.
 */
export function useMicrophoneVolume() {
  const [status, setStatus] = useState<MicStatus>('idle');

  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bufferRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  const releaseMic = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => {
      track.onended = null;
      track.stop();
    });
    streamRef.current = null;
    if (contextRef.current && contextRef.current.state !== 'closed') {
      contextRef.current.close().catch(() => {});
    }
    contextRef.current = null;
    analyserRef.current = null;
    bufferRef.current = null;
  }, []);

  // Pide permiso y arma la cadena de análisis. Debe llamarse desde un gesto
  // del usuario (tap). Devuelve el estado resultante para poder ramificar
  // sin esperar al re-render.
  const requestPermission = useCallback(async (): Promise<MicStatus> => {
    // mediaDevices es undefined en orígenes inseguros (IP de LAN por http):
    // el micrófono solo funciona en localhost o https
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unavailable');
      return 'unavailable';
    }
    if (streamRef.current && analyserRef.current) {
      setStatus('ready');
      return 'ready';
    }

    setStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        // Sin supresión de ruido: las vocales sostenidas (PAAAA) parecen ruido
        // estacionario y los supresores las atenúan. El AGC normaliza voces
        // infantiles suaves.
        audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: true },
      });

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const context: AudioContext = new AudioCtx();
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.6;
      context.createMediaStreamSource(stream).connect(analyser);

      // Mic desenchufado o permiso revocado por el sistema a mitad de sesión
      stream.getTracks().forEach((track) => {
        track.onended = () => {
          releaseMic();
          setStatus('idle');
        };
      });

      streamRef.current = stream;
      contextRef.current = context;
      analyserRef.current = analyser;
      bufferRef.current = new Uint8Array(analyser.fftSize);
      setStatus('ready');
      return 'ready';
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      const result: MicStatus =
        name === 'NotFoundError' || name === 'OverconstrainedError' ? 'unavailable' : 'denied';
      setStatus(result);
      return result;
    }
  }, [releaseMic]);

  // iOS Safari suspende el AudioContext hasta un gesto: llamar en cada pointerdown
  const resumeContext = useCallback(() => {
    const ctx = contextRef.current;
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }, []);

  // Volumen instantáneo (RMS 0..1). Pensado para leerse dentro de un rAF.
  const getVolume = useCallback((): number => {
    const analyser = analyserRef.current;
    const buffer = bufferRef.current;
    if (!analyser || !buffer) return 0;
    analyser.getByteTimeDomainData(buffer);
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      const v = (buffer[i] - 128) / 128;
      sum += v * v;
    }
    return Math.sqrt(sum / buffer.length);
  }, []);

  // Al desmontar, apagar el mic (el indicador de la pestaña debe apagarse)
  useEffect(() => releaseMic, [releaseMic]);

  return { status, requestPermission, resumeContext, getVolume, releaseMic };
}
