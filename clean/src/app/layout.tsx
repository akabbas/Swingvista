import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "block",
  preload: true,
  weight: ["300", "400", "500", "600", "700", "800"],
  fallback: [
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: "SwingVista - Clean Baseline",
  description: "FOUC-free baseline for SwingVista",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3B82F6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeInitScript = `
  (function() {
    try {
      var d = document.documentElement;
      var s = localStorage.getItem('theme');
      var m = window.matchMedia('(prefers-color-scheme: dark)');
      var isDark = s === 'dark' || (!s && m.matches);
      if (isDark) d.classList.add('dark'); else d.classList.remove('dark');
    } catch (e) {}
  })();
`;

  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <html lang="en" className={`${inter.variable} scroll-smooth antialiased font-sans`}>
      <head>
        <meta name="color-scheme" content="dark light" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${inter.className} min-h-screen bg-background text-foreground`} suppressHydrationWarning>
        <Header environment={isDevelopment ? 'development' : 'production'} />
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
          {children}
        </main>
        <Footer environment={isDevelopment ? 'development' : 'production'} />
      </body>
    </html>
  );
}
