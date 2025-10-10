'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useIntegrityStatus } from '@/lib/integrity/status-context';

export default function Header() {
  const [isTestMenuOpen, setIsTestMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const status = useIntegrityStatus();
  const indicator = useMemo(() => {
    switch (status.dataSource) {
      case 'live-api':
        return { text: '🟢 LIVE ANALYSIS', cls: 'bg-green-600' };
      case 'cached':
        return { text: '🟠 CACHED', cls: 'bg-amber-600' };
      case 'mock':
        return { text: '🔴 DEMO MODE', cls: 'bg-red-600' };
      default:
        return { text: '⚫ NO DATA', cls: 'bg-gray-600' };
    }
  }, [status]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTestMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">SV</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl text-gray-800">SwingVista</span>
            <span className="text-xs text-gray-500 font-mono">v2.0.0-dev</span>
          </div>
        </Link>
        <nav className="flex items-center gap-8 text-sm font-medium">
          <Link 
            href="/" 
            className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
          >
            🏠 Home
          </Link>
          <Link 
            href="/camera" 
            className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
          >
            📹 Camera
          </Link>
          <Link 
            href="/upload-clean" 
            className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
          >
            📤 Upload
          </Link>
          
          <div className={`px-3 py-1 rounded text-white text-xs font-semibold ${indicator.cls}`} title={`Data source: ${status.dataSource}`}>
            {indicator.text}
          </div>
          {/* Test Pages Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsTestMenuOpen(!isTestMenuOpen)}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 flex items-center gap-1"
            >
              🧪 Test Pages
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isTestMenuOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="py-2">
                  <Link 
                    href="/test-debug" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsTestMenuOpen(false)}
                  >
                    🛠️ Debug System
                  </Link>
                  <Link 
                    href="/test-mediapipe" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsTestMenuOpen(false)}
                  >
                    🎯 MediaPipe Test
                  </Link>
                  <Link 
                    href="/test-analysis" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsTestMenuOpen(false)}
                  >
                    📊 Swing Analysis
                  </Link>
                  <Link 
                    href="/test-graphs" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsTestMenuOpen(false)}
                  >
                    📈 Graph Visualization
                  </Link>
                  <Link 
                    href="/test-simple" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsTestMenuOpen(false)}
                  >
                    🔧 Basic Test
                  </Link>
                  <div className="border-t border-gray-100 my-1"></div>
                  <Link 
                    href="/test-professional-analysis" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsTestMenuOpen(false)}
                  >
                    🏆 Professional Analysis
                  </Link>
                  <Link 
                    href="/test-swing-comparison" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsTestMenuOpen(false)}
                  >
                    ⚖️ Swing Comparison
                  </Link>
                  <Link 
                    href="/upload-clean" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsTestMenuOpen(false)}
                  >
                    🎯 Enhanced Upload
                  </Link>
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}


