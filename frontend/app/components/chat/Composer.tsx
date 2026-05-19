'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SLASH_COMMANDS } from '../../lib/commandActions';
import type { CommandActionId } from '../../lib/llm/llmClient';
import { VoiceButton } from './VoiceButton';

type Props = {
  disabled?: boolean;
  onSend: (text: string) => void;
  onCommand: (id: CommandActionId) => void;
  placeholder?: string;
};

/**
 * Composer simplificado - 2026 UX
 *
 * - Input de texto
 * - 3 slash commands apenas (/proxima, /dica, /pular)
 * - Voice button WhatsApp-style
 * - Sem command palette complexa
 */
export function Composer({ disabled, onSend, onCommand, placeholder }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState('');
  const [slashIndex, setSlashIndex] = useState(0);

  const slashOpen = value.startsWith('/') && !value.includes(' ');

  const slashFiltered = useMemo(() => {
    if (!slashOpen) return [];
    const q = value.slice(1).toLowerCase();
    return SLASH_COMMANDS.filter((c) => c.token.slice(1).toLowerCase().includes(q));
  }, [slashOpen, value]);

  useEffect(() => {
    setSlashIndex(0);
  }, [value]);

  function resize(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  function runSlash(action: CommandActionId) {
    setValue('');
    if (ref.current) {
      ref.current.value = '';
      resize(ref.current);
    }
    onCommand(action);
  }

  function submit() {
    const el = ref.current;
    if (!el) return;
    const v = el.value.trim();
    if (!v) return;

    // Se for slash command conhecido
    const cmd = SLASH_COMMANDS.find((c) => c.token === v.toLowerCase());
    if (cmd) {
      runSlash(cmd.action);
      return;
    }

    onSend(v);
    el.value = '';
    setValue('');
    resize(el);
  }

  return (
    <div className="composer-wrap">
      {/* Slash menu */}
      <AnimatePresence>
        {slashFiltered.length > 0 && (
          <motion.div
            className="slash-menu"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
          >
            {slashFiltered.map((c, idx) => (
              <div
                key={c.token}
                className={`slash-item ${idx === slashIndex ? 'is-focused' : ''}`}
                onMouseEnter={() => setSlashIndex(idx)}
                onClick={() => runSlash(c.action)}
              >
                <span className="ic">{c.icon}</span>
                <span className="text">
                  <span className="title">{c.description}</span>
                  <span className="cmd">{c.token}</span>
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="composer">
        <textarea
          ref={ref}
          rows={1}
          className="composer-input"
          placeholder={placeholder ?? 'Digite sua dúvida ou "/" para comandos...'}
          onChange={(e) => {
            setValue(e.currentTarget.value);
            resize(e.currentTarget);
          }}
          onKeyDown={(e) => {
            if (slashFiltered.length > 0) {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSlashIndex((i) => Math.min(slashFiltered.length - 1, i + 1));
                return;
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSlashIndex((i) => Math.max(0, i - 1));
                return;
              }
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                runSlash(slashFiltered[slashIndex].action);
                return;
              }
              if (e.key === 'Escape') {
                setValue('');
                if (ref.current) {
                  ref.current.value = '';
                  resize(ref.current);
                }
                return;
              }
            }
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (!disabled) submit();
            }
          }}
        />

        {/* Voice button - WhatsApp style */}
        <VoiceButton
          onTranscript={(text) => {
            if (text.trim()) onSend(text.trim());
          }}
          disabled={disabled}
        />

        {/* Send button */}
        <button
          type="button"
          className="composer-btn"
          onClick={submit}
          disabled={disabled}
          aria-label="Enviar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
        </button>
      </div>

      {/* Hint simplificado */}
      <div className="composer-hint">
        <span><kbd>/</kbd> comandos</span>
        <span className="sep">·</span>
        <span><kbd>Enter</kbd> enviar</span>
      </div>
    </div>
  );
}
