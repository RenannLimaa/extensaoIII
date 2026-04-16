'use client';

import { useState } from 'react';
import { AppHeader } from './components/home/AppHeader';
import { BuildCard } from './components/home/BuildCard';
import { SectionIntro } from './components/home/SectionIntro';
import { SubjectCard } from './components/home/SubjectCard';
import { homeContent } from './mocks/homeContent';

export default function HomePage() {
  const [activeBuildId, setActiveBuildId] = useState(homeContent.buildSection.items[0]?.id ?? '');

  return (
    <div className="page-shell">
      <AppHeader brand={homeContent.brand} />

      <main className="main-content container">
        <section className="hero-block">
          <h1 className="hero-title">
            {homeContent.hero.titleTop}
            <span>{homeContent.hero.titleHighlight}</span>
          </h1>

          <p className="hero-subtitle">{homeContent.hero.description}</p>
        </section>

        <section className="cards-section">
          <SectionIntro
            icon={homeContent.buildSection.icon}
            title={homeContent.buildSection.title}
            subtitle={homeContent.buildSection.subtitle}
          />

          <div className="build-grid">
            {homeContent.buildSection.items.map((item) => (
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
          <div className="subject-grid">
            {homeContent.subjectsSection.items.map((item) => (
              <SubjectCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}