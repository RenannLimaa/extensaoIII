'use client';

import { Builds } from './components/home/Builds';
import { FAQ } from './components/home/FAQ';
import { Features } from './components/home/Features';
import { FinalCTA } from './components/home/FinalCTA';
import { Footer } from './components/home/Footer';
import { Hero } from './components/home/Hero';
import { LandingNav } from './components/home/LandingNav';
import { LogosStrip } from './components/home/LogosStrip';
import { SubjectsShowcase } from './components/home/SubjectsShowcase';
import { Testimonials } from './components/home/Testimonials';
import { Workflow } from './components/home/Workflow';

export default function HomePage() {
  return (
    <div className="landing">
      <LandingNav />
      <Hero />
      <LogosStrip />
      <Features />
      <Builds />
      <SubjectsShowcase buildId="teorico" />
      <Workflow />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
