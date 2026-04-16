'use client';

import { useState } from 'react';
import { AppHeader } from './components/home/AppHeader';
import { BuildCard } from './components/home/BuildCard';
import { SectionIntro } from './components/home/SectionIntro';
import { SubjectCard } from './components/home/SubjectCard';
import { BUILDS, SUBJECTS } from './lib/catalog';

export default function HomePage() {
  const [activeBuildId, setActiveBuildId] = useState<string>(BUILDS[0].id);

  return (
    <div className="page-shell">
      <AppHeader brand="ENEMBot" />

      <main className="main-content container">
        <section className="hero-block">
          <span className="hero-eyebrow">Tutor ENEM personalizado</span>
          <h1 className="hero-title">
            Estude ENEM do seu jeito,
            <span>com um tutor que se adapta</span>
          </h1>
          <p className="hero-subtitle">
            Escolha sua build, escolha a materia e resolva questoes estilo ENEM com
            feedback instantaneo. Cada build muda como o tutor explica e quais questoes
            ele escolhe.
          </p>
        </section>

        <section className="cards-section">
          <SectionIntro
            icon="🎮"
            title="Escolha seu build de estudo"
            subtitle="Muda o ritmo, a dificuldade e o nivel de explicacao"
          />

          <div className="build-grid">
            {BUILDS.map((item) => (
              <BuildCard
                key={item.id}
                item={item}
                isActive={item.id === activeBuildId}
                onSelect={setActiveBuildId}
              />
            ))}
          </div>
        </section>

        <section className="cards-section">
          <SectionIntro
            icon="📚"
            title="Qual materia voce quer treinar hoje?"
            subtitle="Clique em um card para comecar a sessao com o tutor"
          />

          <div className="subject-grid">
            {SUBJECTS.map((subject) => (
              <SubjectCard key={subject.id} subject={subject} buildId={activeBuildId} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
