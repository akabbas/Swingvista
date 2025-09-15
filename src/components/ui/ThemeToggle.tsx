'use client';

import { useState, useEffect } from 'react';

// Script to run before hydration to prevent flash
const themeScript = `
  (function() {
    let isDark;
    try {
      isDark = localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    } catch {
      isDark = true; // Default to dark if localStorage fails
    }
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  })()
`;

export default function ThemeToggle() {
  // Initialize state from localStorage/system preference
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    // This runs on the client after hydration
    if (typeof window === 'undefined') return true;
    try {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    } catch {
      return true;
    }
  });

  // Only show theme toggle after hydration to prevent flash
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Apply theme to document
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark, mounted]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20" />
    );
  }

  return (
    <>
      {/* Inject theme script before hydration */}
      <script
        dangerouslySetInnerHTML={{ __html: themeScript }}
      />
      <button
        onClick={toggleTheme}
        className="relative inline-flex items-center justify-center w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        <div className="relative w-6 h-6">
          {/* Sun icon */}
          <svg
            className={`absolute inset-0 w-6 h-6 text-yellow-400 transition-all duration-300 ${
              isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
          
          {/* Moon icon */}
          <svg
            className={`absolute inset-0 w-6 h-6 text-blue-300 transition-all duration-300 ${
              isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </div>
      </button>
    </>
  );
}
