'use client';

import { useEffect, useState } from 'react';

// Script to run before hydration to prevent FOUC
const preHydrationScript = `
  (function() {
    document.documentElement.style.setProperty('--pre-hydration-opacity', '0');
    document.documentElement.style.setProperty('--pre-hydration-transform', 'translateY(10px)');
  })()
`;

export default function PreHydrationControl() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Wait for next frame to ensure fonts and CSS are loaded
    requestAnimationFrame(() => {
      setMounted(true);
      document.documentElement.style.setProperty('--pre-hydration-opacity', '1');
      document.documentElement.style.setProperty('--pre-hydration-transform', 'translateY(0)');
    });
  }, []);

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: preHydrationScript }} />
      <style jsx global>{`
        :root {
          --pre-hydration-opacity: 0;
          --pre-hydration-transform: translateY(10px);
        }

        body {
          opacity: var(--pre-hydration-opacity);
          transform: var(--pre-hydration-transform);
          transition: opacity 0.2s ease-out, transform 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
