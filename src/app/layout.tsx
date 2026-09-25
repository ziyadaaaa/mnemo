import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Mnemo — Autonomous Business Memory',
  description: 'Never lose a company decision, task, or deadline again.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-neutral-950 text-neutral-100 antialiased selection:bg-neutral-800 selection:text-white min-h-screen`}>
        {children}
      </body>
    </html>
  );
}


