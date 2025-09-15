'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface HeaderProps {
  environment?: 'development' | 'production';
}

export default function Header({ environment = 'production' }: HeaderProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [envStatus, setEnvStatus] = useState<'loading' | 'connected' | 'error'>('loading');

  // Test environment connection on mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test Supabase connection
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          setEnvStatus('error');
          return;
        }

        // Simple connection test
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });
        
        setEnvStatus(response.ok ? 'connected' : 'error');
      } catch (error) {
        console.warn('Environment connection test failed:', error);
        setEnvStatus('error');
      }
    };

    testConnection();
  }, []);

  const navItems = [
    { href: '/', label: 'Dashboard', icon: '🏠' },
    { href: '/camera', label: 'Camera', icon: '📹' },
    { href: '/upload', label: 'Upload', icon: '📤' },
    { href: '/compare', label: 'Compare', icon: '⚖️' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm dark:bg-slate-900/80 dark:border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SV</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-white dark:to-slate-300">
                SwingVista
              </h1>
            </Link>
            
            {/* Environment Status Indicator */}
            {environment === 'development' && (
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  envStatus === 'connected' ? 'bg-green-500' : 
                  envStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                }`}></div>
                <span className="text-xs text-gray-500 dark:text-slate-400">
                  {envStatus === 'connected' ? 'Connected' : 
                   envStatus === 'error' ? 'Error' : 'Loading...'}
                </span>
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium flex items-center space-x-2 ${
                  isActive(item.href)
                    ? 'text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-blue-950/40'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-300 dark:hover:text-blue-300 dark:hover:bg-blue-950/40'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Toggle mobile menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} 
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 dark:border-slate-800">
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg transition-all duration-200 font-medium flex items-center space-x-3 ${
                    isActive(item.href)
                      ? 'text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-blue-950/40'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-300 dark:hover:text-blue-300 dark:hover:bg-blue-950/40'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}


