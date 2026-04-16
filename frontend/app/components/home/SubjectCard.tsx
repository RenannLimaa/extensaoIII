'use client';

import { useRouter } from 'next/navigation';
import type { Subject } from '../../lib/types';

type SubjectCardProps = {
  subject: Subject;
  buildId?: string;
};

export function SubjectCard({ subject, buildId }: SubjectCardProps) {
  const router = useRouter();
  const params = buildId ? `?build=${encodeURIComponent(buildId)}` : '';

  function go() {
    router.push(`/chat/${subject.id}${params}`);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      go();
    }
  }

  return (
    <article
      className="card subject-card"
      role="button"
      tabIndex={0}
      onClick={go}
      onKeyDown={onKey}
      aria-label={`Iniciar chat de ${subject.title}`}
    >
      <div className={`subject-icon ${subject.gradient}`} aria-hidden>
        {subject.icon}
      </div>
      <h3 className="card-title">{subject.title}</h3>
      <p className="card-description">{subject.description}</p>
    </article>
  );
}
