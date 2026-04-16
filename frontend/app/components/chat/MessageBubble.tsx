'use client';

import type { AlternativeLetter, ChatMessage } from '../../lib/types';
import { QuestionCard } from './QuestionCard';

type Props = {
  message: ChatMessage;
  locked: boolean;
  onChoose?: (letter: AlternativeLetter) => void;
};

export function MessageBubble({ message, locked, onChoose }: Props) {
  const isUser = message.role === 'user';
  const avatar = isUser ? '🧑' : '🤖';
  const author = isUser ? 'Voce' : 'ENEMBot';

  return (
    <div className={`msg ${isUser ? 'user' : 'assistant'}`}>
      {!isUser && (
        <div className="msg-avatar is-assistant" aria-hidden>
          {avatar}
        </div>
      )}
      <div className="msg-body">
        {!isUser && <span className="msg-author">{author}</span>}
        {message.content && <div className="msg-text">{message.content}</div>}
        {message.question && (
          <QuestionCard
            question={message.question}
            chosen={message.chosen}
            feedback={message.feedback}
            locked={locked || Boolean(message.feedback)}
            onChoose={(l) => onChoose?.(l)}
          />
        )}
      </div>
      {isUser && (
        <div className="msg-avatar" aria-hidden>
          {avatar}
        </div>
      )}
    </div>
  );
}
