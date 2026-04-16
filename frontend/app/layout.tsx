import type { ReactNode } from 'react';
import { Nunito } from 'next/font/google';
import './globals.css';

const fontMain = Nunito({
  subsets: ['latin'],
  variable: '--font-main',
});

const fontTitle = Nunito({
  subsets: ['latin'],
  variable: '--font-title',
  weight: ['700', '800', '900'],
});

export const metadata = {
  title: 'ENEMBot',
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