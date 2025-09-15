'use client';

import { useState, useEffect } from 'react';
import { testEnvironmentConnection, getEnvironmentConfig } from '@/lib/environment';

export default function EnvironmentBanner() {
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [isVisible, setIsVisible] = useState(true);
  const config = getEnvironmentConfig();

  useEffect(() => {
    const testConnection = async () => {
      const result = await testEnvironmentConnection();
      setConnectionStatus(result.success ? 'connected' : 'error');
    };

    testConnection();
  }, []);

  if (!isVisible) return null;

  return (
    <div className="bg-yellow-500 text-yellow-900 px-4 py-2 text-sm font-medium">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span>🔧</span>
          <span>Development Environment</span>
          <span className="px-2 py-1 bg-yellow-600 text-yellow-100 rounded text-xs">
            v{config.version}
          </span>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-xs">
              {connectionStatus === 'connected' ? 'Connected' : 
               connectionStatus === 'error' ? 'Connection Error' : 'Testing...'}
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-yellow-800 hover:text-yellow-900 transition-colors"
          aria-label="Dismiss banner"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
