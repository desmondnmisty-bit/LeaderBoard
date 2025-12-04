import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { LeaderboardProvider } from '../lib/LeaderboardContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Generic Leaderboard',
  description: 'Real-time leaderboard with Socket.io integration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LeaderboardProvider>
          {children}
        </LeaderboardProvider>
      </body>
    </html>
  );
}