'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

interface PushToTalkProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

type RecordingState = 'idle' | 'recording' | 'processing' | 'error';

// Web Speech API types
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

/**
 * Push-to-Talk Button - WhatsApp-style voice input
 *
 * Features:
 * - Hold to record, release to send
 * - Juicy 60fps animations
 * - Visual feedback with sound waves
 * - Gamified feedback (XP particles on success)
 */
export function PushToTalk({ onTranscript, disabled = false, className = '' }: PushToTalkProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [interimText, setInterimText] = useState('');
  const [amplitude, setAmplitude] = useState(0);
  const [showXP, setShowXP] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const buttonControls = useAnimation();
  const waveControls = useAnimation();

  // Check for Web Speech API support
  const isSupported = typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  // Analyze audio for visual feedback
  const startAudioAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      const updateAmplitude = () => {
        if (analyserRef.current && state === 'recording') {
          analyserRef.current.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setAmplitude(avg / 255);
          animationFrameRef.current = requestAnimationFrame(updateAmplitude);
        }
      };

      updateAmplitude();
    } catch (error) {
      console.error('Audio analysis error:', error);
    }
  }, [state]);

  // Stop audio analysis
  const stopAudioAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setAmplitude(0);
  }, []);

  // Initialize speech recognition
  const initRecognition = useCallback(() => {
    if (!isSupported) return null;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setInterimText(interimTranscript || finalTranscript);

      if (finalTranscript) {
        onTranscript(finalTranscript.trim());
        // Show XP animation on successful transcription
        setShowXP(true);
        setTimeout(() => setShowXP(false), 1000);
      }
    };

    recognition.onerror = (event: { error: string }) => {
      console.error('Speech recognition error:', event.error);
      setState('error');
      stopAudioAnalysis();
      setTimeout(() => setState('idle'), 2000);
    };

    recognition.onend = () => {
      if (state === 'recording') {
        setState('processing');
        setTimeout(() => setState('idle'), 500);
      }
      stopAudioAnalysis();
    };

    return recognition;
  }, [isSupported, onTranscript, state, stopAudioAnalysis]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (disabled || !isSupported) return;

    setState('recording');
    setInterimText('');

    // Juicy button animation
    buttonControls.start({
      scale: 1.15,
      transition: { type: 'spring', stiffness: 400, damping: 15 }
    });

    // Wave animation
    waveControls.start({
      scale: [1, 1.2, 1],
      opacity: [0.5, 0.8, 0.5],
      transition: { repeat: Infinity, duration: 0.8 }
    });

    // Start speech recognition
    recognitionRef.current = initRecognition();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        await startAudioAnalysis();
      } catch (error) {
        console.error('Failed to start recording:', error);
        setState('error');
      }
    }
  }, [disabled, isSupported, buttonControls, waveControls, initRecognition, startAudioAnalysis]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (state !== 'recording') return;

    setState('processing');

    // Juicy button animation back
    buttonControls.start({
      scale: 1,
      transition: { type: 'spring', stiffness: 400, damping: 20 }
    });

    waveControls.stop();

    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    stopAudioAnalysis();

    setTimeout(() => setState('idle'), 500);
  }, [state, buttonControls, waveControls, stopAudioAnalysis]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      stopAudioAnalysis();
    };
  }, [stopAudioAnalysis]);

  if (!isSupported) {
    return null; // Don't render if not supported
  }

  return (
    <div className={`ptt-container ${className}`}>
      {/* Interim text display */}
      <AnimatePresence>
        {interimText && state === 'recording' && (
          <motion.div
            className="ptt-interim"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {interimText}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main button container */}
      <div className="ptt-button-container">
        {/* Sound waves background */}
        <AnimatePresence>
          {state === 'recording' && (
            <>
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="ptt-wave"
                  initial={{ scale: 1, opacity: 0 }}
                  animate={{
                    scale: 1 + amplitude * (1 + i * 0.3),
                    opacity: 0.3 - i * 0.08,
                  }}
                  exit={{ scale: 1, opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: '2px solid var(--color-primary)',
                    pointerEvents: 'none',
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Main button */}
        <motion.button
          className={`ptt-button ${state}`}
          animate={buttonControls}
          onPointerDown={startRecording}
          onPointerUp={stopRecording}
          onPointerLeave={stopRecording}
          disabled={disabled}
          whileTap={{ scale: 0.95 }}
          aria-label={state === 'recording' ? 'Solte para enviar' : 'Segure para falar'}
        >
          {/* Mic icon */}
          <motion.svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{
              scale: state === 'recording' ? [1, 1.1, 1] : 1,
            }}
            transition={{
              repeat: state === 'recording' ? Infinity : 0,
              duration: 0.5,
            }}
          >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </motion.svg>

          {/* Processing spinner */}
          <AnimatePresence>
            {state === 'processing' && (
              <motion.div
                className="ptt-spinner"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, rotate: 360 }}
                exit={{ opacity: 0 }}
                transition={{ rotate: { repeat: Infinity, duration: 1, ease: 'linear' } }}
              />
            )}
          </AnimatePresence>
        </motion.button>

        {/* XP Particles */}
        <AnimatePresence>
          {showXP && (
            <motion.div
              className="ptt-xp"
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: 1, y: -40, scale: 1 }}
              exit={{ opacity: 0, y: -60 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              +10 XP
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status label */}
      <motion.span
        className="ptt-label"
        animate={{
          opacity: state === 'idle' ? 0.6 : 1,
          color: state === 'recording' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        }}
      >
        {state === 'idle' && 'Segure para falar'}
        {state === 'recording' && 'Ouvindo...'}
        {state === 'processing' && 'Processando...'}
        {state === 'error' && 'Erro - tente novamente'}
      </motion.span>

      <style jsx>{`
        .ptt-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .ptt-interim {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: 12px;
          padding: 8px 16px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          font-size: 14px;
          color: var(--color-text);
          max-width: 300px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ptt-button-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
        }

        .ptt-button {
          position: relative;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark, #0066cc));
          color: white;
          box-shadow:
            0 4px 12px rgba(var(--color-primary-rgb, 0, 102, 204), 0.3),
            0 2px 4px rgba(0, 0, 0, 0.1);
          transition: background 0.2s ease;
          z-index: 1;
        }

        .ptt-button:hover:not(:disabled) {
          background: linear-gradient(135deg, var(--color-primary-dark, #0066cc), var(--color-primary));
        }

        .ptt-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ptt-button.recording {
          background: linear-gradient(135deg, #ff4444, #cc0000);
          box-shadow:
            0 4px 20px rgba(255, 68, 68, 0.4),
            0 0 40px rgba(255, 68, 68, 0.2);
        }

        .ptt-button.error {
          background: linear-gradient(135deg, #ff6b6b, #cc4444);
        }

        .ptt-spinner {
          position: absolute;
          width: 48px;
          height: 48px;
          border: 3px solid transparent;
          border-top-color: white;
          border-radius: 50%;
        }

        .ptt-xp {
          position: absolute;
          top: -20px;
          font-size: 14px;
          font-weight: 700;
          color: var(--color-success, #22c55e);
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          pointer-events: none;
        }

        .ptt-label {
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      `}</style>
    </div>
  );
}

export default PushToTalk;
