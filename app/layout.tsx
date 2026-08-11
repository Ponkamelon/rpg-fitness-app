import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WODXP',
  description: 'Train. Earn XP. Level up. WODXP turns your kettlebell, dumbbell, and bodyweight training into a game.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#0D0D0D',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
