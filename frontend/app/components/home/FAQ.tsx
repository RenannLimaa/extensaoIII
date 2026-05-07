'use client';

import { motion } from 'framer-motion';

const qa = [
  {
    q: 'É grátis pra usar?',
    a: 'Sim — enquanto o protótipo estiver público. O plano é manter um tier gratuito bem generoso mesmo depois do lançamento.',
  },
  {
    q: 'Preciso criar conta?',
    a: 'Não. Você pode começar uma sessão direto, sem cadastro. Conta entra em cena quando você quiser salvar progresso entre dispositivos.',
  },
  {
    q: 'As questões são reais do ENEM?',
    a: 'No protótipo, usamos um banco mockado com questões inspiradas em provas recentes. Na versão final, misturamos banco oficial + questões geradas pela IA na hora.',
  },
  {
    q: 'O ENEMBot substitui um cursinho?',
    a: 'Não substitui professor de verdade. Mas acelera revisão, cria planos personalizados e explica com paciência infinita — que cursinho nenhum tem.',
  },
  {
    q: 'Funciona no celular?',
    a: 'A interface é responsiva e pensada para uso mobile. Estudar no ônibus é parte do caso de uso — paleta de comandos também funciona no toque.',
  },
  {
    q: 'Meus dados vão pra IA treinar?',
    a: 'Nada do que você responde é usado para treinar modelos externos. Respostas ficam isoladas no seu histórico.',
  },
];

export function FAQ() {
  return (
    <section className="section" id="faq">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="eyebrow">
            <span className="eyebrow-dot" /> Perguntas frequentes
          </span>
          <h2 className="section-title">
            Dúvidas rápidas, <em style={{ fontStyle: 'italic' }}>respostas diretas.</em>
          </h2>
        </motion.div>

        <div className="faq-list">
          {qa.map((item, i) => (
            <motion.details
              key={i}
              className="faq-item"
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
            >
              <summary>{item.q}</summary>
              <div className="faq-body">{item.a}</div>
            </motion.details>
          ))}
        </div>
      </div>
    </section>
  );
}
