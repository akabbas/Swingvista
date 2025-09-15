// Import order matters! CSS must be first
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import EnvironmentBanner from '@/components/ui/EnvironmentBanner'

// Configure font loading to avoid font swapping and FOUC
const inter = Inter({
  subsets: ['latin'],
  display: 'block',
  preload: true,
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter',
  fallback: [
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif'
  ],
  adjustFontFallback: true,
})

// Inline theme script to set initial color mode before React hydration
const themeInitScript = `
  (function() {
    try {
      var d = document.documentElement;
      var s = localStorage.getItem('theme');
      var m = window.matchMedia('(prefers-color-scheme: dark)');
      var isDark = s === 'dark' || (!s && m.matches);
      if (isDark) {
        d.classList.add('dark');
        d.style.backgroundColor = 'rgb(10 10 10)'; // Dark background
        d.setAttribute('data-theme', 'dark');
      } else {
        d.classList.remove('dark');
        d.style.backgroundColor = 'rgb(250 250 250)'; // Light background
        d.setAttribute('data-theme', 'light');
      }
    } catch (e) { /* noop */ }
  })();
`;

export const metadata: Metadata = {
  title: 'SwingVista - Golf Swing Analysis',
  description: 'Real-time golf swing analysis with AI-powered feedback',
  metadataBase: new URL('https://swingvista.com'),
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
  robots: 'index, follow',
  openGraph: {
    title: 'SwingVista - Golf Swing Analysis',
    description: 'Real-time golf swing analysis with AI-powered feedback',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SwingVista - Golf Swing Analysis',
    description: 'Real-time golf swing analysis with AI-powered feedback',
  }
}

// Viewport and theme configuration must be in separate exports
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3B82F6'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <html lang="en" className={`${inter.variable} scroll-smooth antialiased font-sans`}>
      <head>
        <meta name="color-scheme" content="dark light" />
        {/* Preconnects are harmless even when fonts are self-hosted by next/font */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body suppressHydrationWarning className={`${inter.className} min-h-screen bg-background text-foreground`}>
        {isDevelopment && <EnvironmentBanner />}
        <Header />
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}