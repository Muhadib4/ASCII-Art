import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/space-grotesk';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import { ThemeRuntime } from '@/features/themes/ThemeRuntime';
import './globals.css';

export const metadata: Metadata = {
  title: 'ASCII — A little less pixel. A little more character.',
  description: 'An independent creative studio for text, images, camera captures, and ASCII compositions. Create, customize, and export. Everything happens in your browser.',
  applicationName: 'ASCII Creative Studio',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#101010' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-theme="mono" data-mode="dark" suppressHydrationWarning>
    <body><a className="skip-link" href="#main">Skip to content</a><ThemeRuntime />{children}</body>
  </html>;
}
