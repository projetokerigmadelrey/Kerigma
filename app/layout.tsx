import type {Metadata} from 'next';
import { Inter, Manrope } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-headline',
});

export const metadata: Metadata = {
  title: 'Kerigma - Gestão Ministerial',
  description: 'Sistema de Gestão Ministerial - O Santuário Digital',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${manrope.variable}`}>
      <body suppressHydrationWarning className="min-h-screen bg-surface">
        {children}
      </body>
    </html>
  );
}
