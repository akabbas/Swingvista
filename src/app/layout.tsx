// Import order matters! CSS must be first
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import EnvironmentBanner from '@/components/ui/EnvironmentBanner'
import PreHydrationControl from '@/components/PreHydrationControl'

// Configure font loading with swap + preload strategy
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Use swap with preload for better performance
  preload: true,
  weight: ['300', '400', '500', '600', '700', '800'], // Preload all possible weights
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
  adjustFontFallback: true, // Enable for better font metrics matching
})

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
      <PreHydrationControl />
      <body suppressHydrationWarning className={`${inter.className} min-h-screen bg-background text-foreground`}>
        {isDevelopment && <EnvironmentBanner />}
        <Header environment={isDevelopment ? 'development' : 'production'} />
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
          {children}
        </main>
        <Footer environment={isDevelopment ? 'development' : 'production'} />
      </body>
    </html>
  )
}