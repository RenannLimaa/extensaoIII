'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SLASH_COMMANDS } from '../../lib/commandActions';
import type { CommandActionId } from '../../lib/llm/llmClient';
import { VoiceButton } from './VoiceButton';

type Props = {
  disabled?: boolean;
  onSend: (text: string, habilidade: string) => void;
  habilidade: string;

  /** quando o usuario dispara um comando slash, o parent roda via runCommand */
  onCommand: (id: CommandActionId, habilidade: string) => void;
  placeholder?: string;
};

export function Composer({ disabled, onSend, onCommand, placeholder, habilidade }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState('');
  const [slashIndex, setSlashIndex] = useState(0);

  const slashOpen = value.startsWith('/') && !value.includes(' ');

  const slashFiltered = useMemo(() => {
    if (!slashOpen) return [];
    const q = value.slice(1).toLowerCase();
    return SLASH_COMMANDS.filter((c) => c.token.slice(1).toLowerCase().includes(q)).slice(0, 6);
  }, [slashOpen, value]);

  useEffect(() => {
    setSlashIndex(0);
  }, [value]);

  function resize(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 220) + 'px';
  }

  function runSlash(action: CommandActionId) {
    setValue('');
    if (ref.current) {
      ref.current.value = '';
      resize(ref.current);
    }
    onCommand(action, habilidade);
  }

  function submit() {
    const el = ref.current;
    if (!el) return;
    const v = el.value.trim();
    if (!v) return;
    // se for exatamente um slash conhecido → runCommand, senao → send
    const cmd = SLASH_COMMANDS.find((c) => c.token === v.toLowerCase());
    if (cmd) {
      runSlash(cmd.action);
      return;
    }
    onSend(v, habilidade);
    el.value = '';
    setValue('');
    resize(el);
  }

  return (
    <div className="composer-wrap">
      <AnimatePresence>
        {slashFiltered.length > 0 && (
          <motion.div
            className="slash-menu"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
          >
            {slashFiltered.map((c, idx) => (
              <div
                key={c.token}
                className={`slash-item ${idx === slashIndex ? 'is-focused' : ''}`}
                onMouseEnter={() => setSlashIndex(idx)}
                onClick={() => runSlash(c.action)}
              >
                <span className="ic" aria-hidden>
                  {c.icon}
                </span>
                <span className="text">
                  <div className="title">{c.description}</div>
                  <div className="desc">
                    Digite <span className="cmd">{c.token}</span> e Enter
                  </div>
                </span>
                <span className="kbd">↵</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="composer">
        <textarea
          ref={ref}
          rows={1}
          className="composer-input"
          placeholder={placeholder ?? 'Pergunte algo, digite "/" para comandos, Cmd+K para paleta…'}
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

        <button
          type="button"
          className="composer-btn"
          onClick={submit}
          disabled={disabled}
          aria-label="Enviar mensagem"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </button>
      </div>

      <div className="composer-hint">
        <span>
          <span className="kbd">↵</span> enviar
        </span>
        <span className="sep">·</span>
        <span>
          <span className="kbd">⇧</span>+<span className="kbd">↵</span> quebrar linha
        </span>
        <span className="sep">·</span>
        <span>
          <span className="kbd">/</span> comandos
        </span>
        <span className="sep">·</span>
        <span>
          <span className="kbd">⌘</span>+<span className="kbd">K</span> paleta
        </span>
      </div>
    </div>
  );
}
