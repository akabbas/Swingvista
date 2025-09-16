import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FeedbackButton from '@/components/ui/FeedbackButton';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  weight: ["400", "500", "600", "700"],
  fallback: [
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
});

export const metadata: Metadata = {
  title: "SwingVista - Golf Swing Analysis",
  description: "Advanced golf swing analysis with AI-powered insights",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SwingVista"
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#3B82F6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.className} ${inter.variable}`}>
      <head>
        {/* Critical CSS inlined to prevent FOUC - no hydration mismatch */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html { 
                background-color: #FAFAFA !important; 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
              }
              body { 
                margin: 0 !important; 
                background-color: #FAFAFA !important;
                color: #1A1A1A !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
              }
              /* Prevent FOUC during hydration */
              .fouc-prevention {
                background-color: #FAFAFA !important;
                color: #1A1A1A !important;
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-white text-gray-900 antialiased fouc-prevention">
        <Header />
        <main className="min-h-screen bg-white">
          {children}
        </main>
        <Footer />
        {/* Lightweight feedback button */}
        {process.env.NODE_ENV !== 'test' && (
          <FeedbackButton />
        )}
      </body>
    </html>
  );
}
