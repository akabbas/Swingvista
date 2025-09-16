import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en" suppressHydrationWarning>
      <Head>
        {/* Critical theme script - must execute before ANY CSS loads */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var d = document.documentElement;
                  var theme = localStorage.getItem('theme') || 'light';
                  var isDark = theme === 'dark';
                  
                  // Set theme class immediately - this is critical
                  if (isDark) {
                    d.classList.add('dark');
                  } else {
                    d.classList.remove('dark');
                  }
                  
                  // Set background color inline to prevent white flash
                  d.style.backgroundColor = isDark ? '#0A0A0A' : '#FAFAFA';
                  d.style.color = isDark ? '#FAFAFA' : '#1A1A1A';
                  
                  // Set color-scheme meta for form controls
                  var meta = document.querySelector('meta[name="color-scheme"]');
                  if (!meta) {
                    meta = document.createElement('meta');
                    meta.setAttribute('name', 'color-scheme');
                    document.head.appendChild(meta);
                  }
                  meta.setAttribute('content', isDark ? 'dark' : 'light');
                  
                  // Prevent any potential FOUC by setting visibility
                  d.style.visibility = 'visible';
                } catch (e) {
                  // Fallback to light theme if localStorage fails
                  document.documentElement.classList.remove('dark');
                  document.documentElement.style.backgroundColor = '#FAFAFA';
                  document.documentElement.style.color = '#1A1A1A';
                  document.documentElement.style.visibility = 'visible';
                }
              })();
            `,
          }}
        />
        
        {/* Color scheme meta for form controls */}
        <meta name="color-scheme" content="dark light" />
        
        {/* Critical CSS inlined to prevent FOUC */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html { background-color: #FAFAFA; }
              html.dark { background-color: #0A0A0A; }
              body { 
                margin: 0; 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
                background-color: #FAFAFA;
                color: #1A1A1A;
              }
              .dark body { 
                background-color: #0A0A0A; 
                color: #FAFAFA; 
              }
            `,
          }}
        />
        
        {/* DNS prefetch for performance */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      </Head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {/* Loading state to prevent FOUC */}
        <div id="loading-fouc-prevention" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'var(--bg-color, #FAFAFA)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            #loading-fouc-prevention {
              --bg-color: #FAFAFA;
            }
            .dark #loading-fouc-prevention {
              --bg-color: #0A0A0A;
            }
          `
        }} />
        <Main />
        <NextScript />
        <script dangerouslySetInnerHTML={{
          __html: `
            // Hide loading screen once page is ready
            document.addEventListener('DOMContentLoaded', function() {
              setTimeout(function() {
                var loader = document.getElementById('loading-fouc-prevention');
                if (loader) {
                  loader.style.opacity = '0';
                  loader.style.transition = 'opacity 0.3s ease';
                  setTimeout(function() {
                    if (loader.parentNode) {
                      loader.parentNode.removeChild(loader);
                    }
                  }, 300);
                }
              }, 100);
            });
          `
        }} />
      </body>
    </Html>
  )
}
