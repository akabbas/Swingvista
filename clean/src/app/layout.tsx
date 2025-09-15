import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
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
      // Ensure background matches theme before CSS loads
      d.style.backgroundColor = isDark ? '#0A0A0A' : '#FAFAFA';
      // Hint UA for form controls, etc.
      var meta = document.querySelector('meta[name="color-scheme"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'color-scheme');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', 'dark light');
    } catch (e) {}
  })();
`;

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.className} ${inter.variable} scroll-smooth antialiased font-sans`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <meta name="color-scheme" content="dark light" />
      </head>
      <body className={`min-h-screen bg-background text-foreground`}>
        <Header />
        <main className="min-h-screen bg-background">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
