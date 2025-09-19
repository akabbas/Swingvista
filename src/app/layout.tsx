import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FeedbackButton from '@/components/ui/FeedbackButton';
import VersionInfo from '@/components/ui/VersionInfo';

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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#10B981",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.className} ${inter.variable}`} suppressHydrationWarning>
      <head>
        {/* Critical CSS moved to globals.css to prevent hydration mismatch */}
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
        {/* Version info for development */}
        {process.env.NODE_ENV === 'development' && (
          <VersionInfo />
        )}
      </body>
    </html>
  );
}
