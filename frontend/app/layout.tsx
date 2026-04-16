import type { ReactNode } from 'react';
import { Inter, Nunito } from 'next/font/google';
import './globals.css';

const fontMain = Inter({
  subsets: ['latin'],
  variable: '--font-main',
  display: 'swap',
});

const fontTitle = Nunito({
  subsets: ['latin'],
  variable: '--font-title',
  weight: ['700', '800', '900'],
  display: 'swap',
});

export const metadata = {
  title: 'ENEMBot - Tutor ENEM adaptativo',
  description:
    'Estude para o ENEM com um tutor que se adapta ao seu ritmo: escolha uma build, escolha a materia e resolva questoes com feedback instantaneo.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${fontMain.variable} ${fontTitle.variable}`}>{children}</body>
    </html>
  );
}
