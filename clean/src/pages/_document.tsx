import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en" suppressHydrationWarning>
      <Head>
        {/* Critical theme script - must execute before CSS loads */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var d = document.documentElement;
                  var theme = localStorage.getItem('theme') || 'light';
                  var isDark = theme === 'dark';
                  
                  // Set theme class immediately
                  if (isDark) {
                    d.classList.add('dark');
                  } else {
                    d.classList.remove('dark');
                  }
                  
                  // Set background color inline to prevent white flash
                  d.style.backgroundColor = isDark ? '#0A0A0A' : '#FAFAFA';
                  
                  // Set color-scheme meta for form controls
                  var meta = document.querySelector('meta[name="color-scheme"]');
                  if (!meta) {
                    meta = document.createElement('meta');
                    meta.setAttribute('name', 'color-scheme');
                    document.head.appendChild(meta);
                  }
                  meta.setAttribute('content', isDark ? 'dark' : 'light');
                } catch (e) {
                  // Fallback to light theme if localStorage fails
                  document.documentElement.classList.remove('dark');
                  document.documentElement.style.backgroundColor = '#FAFAFA';
                }
              })();
            `,
          }}
        />
        
        {/* Color scheme meta for form controls */}
        <meta name="color-scheme" content="dark light" />
        
        {/* Preload critical fonts */}
        <link
          rel="preload"
          href="/_next/static/media/inter-latin-400-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/_next/static/media/inter-latin-500-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/_next/static/media/inter-latin-600-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        
        {/* DNS prefetch for performance */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      </Head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
