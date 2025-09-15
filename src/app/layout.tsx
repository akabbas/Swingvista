import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import EnvironmentBanner from '@/components/ui/EnvironmentBanner'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif']
})

export const metadata: Metadata = {
  title: 'SwingVista - Golf Swing Analysis',
  description: 'Real-time golf swing analysis with AI-powered feedback',
  keywords: 'golf, swing analysis, AI, pose detection, MediaPipe, sports technology',
  authors: [{ name: 'SwingVista Team' }],
  viewport: 'width=device-width, initial-scale=1',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="theme-color" content="#3B82F6" />
        <style dangerouslySetInnerHTML={{ __html: `
          /* Critical CSS to prevent FOUC */
          .icon-container {
            width: 8px !important;
            height: 8px !important;
          }
          .icon-svg {
            width: 4px !important;
            height: 4px !important;
          }
          .logo-container {
            width: 12px !important;
            height: 12px !important;
          }
          .logo-svg {
            width: 6px !important;
            height: 6px !important;
          }
          /* Hide content until styles load */
          .js-loading * {
            visibility: hidden;
          }
          .js-loading .critical-content {
            visibility: visible;
          }
        ` }} />
        <script dangerouslySetInnerHTML={{ __html: `
          // Add loading class
          document.documentElement.classList.add('js-loading');
          // Remove loading class once styles are ready
          window.addEventListener('load', () => {
            document.documentElement.classList.remove('js-loading');
          });
        ` }} />
      </head>
      <body className={`${inter.className} antialiased critical-content`}>
        {/* Environment Banner for Development */}
        {isDevelopment && <EnvironmentBanner />}
        
        {/* Header Navigation */}
        <Header environment={isDevelopment ? 'development' : 'production'} />
        
        {/* Main Content */}
        <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
          {children}
        </main>
        
        {/* Footer */}
        <Footer environment={isDevelopment ? 'development' : 'production'} />
      </body>
    </html>
  )
}