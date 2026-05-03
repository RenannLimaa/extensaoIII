export type BuildItem = {
  id: string;
  icon: string;
  title: string;
  badge: string;
  description: string;
};

export type SubjectItem = {
  id: string;
  icon: string;
  title: string;
  description: string;
  gradient: string;
};

export const homeContent = {
  brand: 'ENEMBot',
  hero: {
    titleTop: 'Escolha uma área e',
    titleHighlight: 'comece a estudar',
    description:
      'Cada bot traz questões no estilo ENEM. Responda, receba feedback instantâneo e aprenda no seu ritmo.',
  },
  buildSection: {
    icon: '🎮',
    title: 'Escolha seu Build de Estudo',
    subtitle: 'Seu build se adapta ao treino no seu estilo de jogo',
    items: [
      {
        id: 'estrategista',
        icon: '⏱',
        title: 'Estrategista',
        badge: 'Melhora tempo',
        description:
          'Foco em velocidade e gestão de tempo. Treine com cronômetro para resolver mais rápido.',
      },
      {
        id: 'teorico',
        icon: '📚',
        title: 'Teórico',
        badge: 'Melhora base',
        description:
          'Foco em compreensão profunda. Receba dicas extras e explicações detalhadas.',
      },
      {
        id: 'sniper',
        icon: '🎯',
        title: 'Sniper',
        badge: 'Acerto em difíceis',
        description:
          'Foco em questões difíceis. Priorize desafios de alto nível para maximizar acertos.',
      },
    ] as BuildItem[],
  },
  subjectsSection: {
    items: [
      {
        id: 'matematica',
        icon: '📐',
        title: 'Matemática',
        description: 'Funções, geometria, estatística e resolução de problemas.',
        gradient: 'subject-green',
      },
      {
        id: 'linguagens',
        icon: '📖',
        title: 'Linguagens',
        description: 'Interpretação, literatura, gramática e texto argumentativo.',
        gradient: 'subject-blue',
      },
      {
        id: 'natureza',
        icon: '🧪',
        title: 'Ciências da Natureza',
        description: 'Biologia, química e física com foco em aplicação prática.',
        gradient: 'subject-violet',
      },
      {
        id: 'humanas',
        icon: '🌍',
        title: 'Ciências Humanas',
        description: 'História, geografia, filosofia e sociologia.',
        gradient: 'subject-orange',
      },
      {
        id: 'redacao',
        icon: '✍️',
        title: 'Redação',
        description: 'Dicas e prática para redação dissertativa-argumentativa.',
        gradient: 'subject-pink',
      },
    ] as SubjectItem[],
  },
};
