import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Simple FOUC prevention - just set background color immediately */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Set background color immediately to prevent white flash
                document.documentElement.style.backgroundColor = '#FAFAFA';
                document.documentElement.style.color = '#1A1A1A';
                document.documentElement.style.visibility = 'visible';
              })();
            `,
          }}
        />
        
        {/* Critical CSS inlined to prevent FOUC */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html { 
                background-color: #FAFAFA; 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
              }
              body { 
                margin: 0; 
                background-color: #FAFAFA;
                color: #1A1A1A;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
              }
            `,
          }}
        />
      </Head>
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
