import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '../lib/ThemeContext';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: '4 The Win Leaderboard',
  description: 'Real-time leaderboard with Socket.io integration',
};

// Helper to strip quotes from env vars if present
const cleanEnvVar = (value?: string) => {
  if (!value) return undefined;
  // Remove surrounding single or double quotes if both match
  const match = value.match(/^(['"])(.*)\1$/);
  return match ? match[2] : value;
};

// Helper to extract font name for Google Fonts
const getGoogleFontUrl = (fontFamily?: string) => {
  if (!fontFamily) return null;
  const cleanFont = cleanEnvVar(fontFamily);
  if (!cleanFont) return null;

  // Extract first font family name (before comma)
  const firstFont = cleanFont.split(',')[0].trim().replace(/['"]/g, '');

  // Skip system fonts
  if (['Inter', 'system-ui', 'sans-serif', 'serif', 'monospace', 'arial', 'helvetica'].includes(firstFont.toLowerCase())) {
    return null;
  }

  // Check if it's likely a typo for Roboto (common mistake)
  const fontName = firstFont === 'Roberto' ? 'Roboto' : firstFont;

  return `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`;
};

import AnalyticsScript from '../components/AnalyticsScript';
import AnalyticsProvider from '../components/AnalyticsProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const primaryColor = cleanEnvVar(process.env.NEXT_PUBLIC_PRIMARY_COLOR);
  const secondaryColor = cleanEnvVar(process.env.NEXT_PUBLIC_SECONDARY_COLOR);
  const appName = cleanEnvVar(process.env.NEXT_PUBLIC_APP_NAME);
  const rawFontFamily = process.env.NEXT_PUBLIC_FONT_FAMILY; // Keep raw for CSS value
  const fontFamily = cleanEnvVar(rawFontFamily);

  const googleFontUrl = getGoogleFontUrl(rawFontFamily);

  // Create style string if variables exist
  // We use !important to ensure these override the globals.css defaults which use html.light selectors
  // We typically want the Secondary Color to affect "gray" UI elements like borders and subtitles to give a brand tint
  const themeStyles = [
    primaryColor && `--color-primary: ${primaryColor} !important;`,
    secondaryColor && [
      `--color-secondary: ${secondaryColor} !important;`,
      `--color-text-secondary: ${secondaryColor} !important;`, // Tint subtitles/icons
      `--color-border: ${secondaryColor} !important;`          // Tint borders
    ].join('\n'),
    fontFamily && `--font-family: ${fontFamily} !important;`,
  ].filter(Boolean).join('\n');

  return (
    <html lang="en">
      <head>
        {appName && <title>{appName}</title>}
        {googleFontUrl && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href={googleFontUrl} rel="stylesheet" />
          </>
        )}
        {themeStyles && (
          <style dangerouslySetInnerHTML={{
            __html: `
              :root, html, html.light, html.dark {
                ${themeStyles}
              }
            `
          }} />
        )}
      </head>
      <body className={inter.className}>
        <AnalyticsProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AnalyticsProvider>
        <AnalyticsScript />
      </body>
    </html>
  );
}