'use client';

import { useRef } from 'react';

type Props = {
  disabled?: boolean;
  onSend: (text: string) => void;
  placeholder?: string;
};

export function Composer({ disabled, onSend, placeholder }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function submit() {
    const el = ref.current;
    if (!el) return;
    const v = el.value.trim();
    if (!v) return;
    onSend(v);
    el.value = '';
    resize(el);
  }

  function resize(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 180) + 'px';
  }

  return (
    <div className="composer">
      <div className="composer-inner">
        <textarea
          ref={ref}
          className="composer-input"
          rows={1}
          placeholder={placeholder ?? 'Pergunte algo, ou digite "proxima" para avancar...'}
          onInput={(e) => resize(e.currentTarget)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (!disabled) submit();
            }
          }}
        />
        <button
          type="button"
          className="composer-send"
          onClick={submit}
          disabled={disabled}
          aria-label="Enviar mensagem"
          title="Enviar (Enter)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </button>
      </div>
      <span className="composer-hint">
        Enter envia · Shift+Enter quebra linha · As respostas sao mockadas nesta fase
      </span>
    </div>
  );
}
