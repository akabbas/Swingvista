'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ClubStats {
  club: string;
  total_swings: number;
  avg_swing_plane: number;
  avg_tempo_ratio: number;
  avg_hip_rotation: number;
  avg_shoulder_rotation: number;
  last_swing: string;
}

interface SwingRecord {
  id: string;
  club: string;
  metrics: {
    swingPlaneAngle: number;
    tempoRatio: number;
    hipRotation: number;
    shoulderRotation: number;
  };
  feedback: string[];
  created_at: string;
}

export default function Dashboard() {
  // State management
  const [clubStats, setClubStats] = useState<ClubStats[]>([]);
  const [recentSwings, setRecentSwings] = useState<SwingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Effects
  useEffect(() => {
    fetchData();
  }, []);

  // Data fetching
  const fetchData = async () => {
    try {
      const [statsResponse, swingsResponse] = await Promise.all([
        fetch('/api/swings?type=stats'),
        fetch('/api/swings')
      ]);

      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setClubStats(stats);
      }

      if (swingsResponse.ok) {
        const swings = await swingsResponse.json();
        setRecentSwings(swings.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          {/* Header skeleton */}
          <div className="text-center space-y-4">
            <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-1/3 mx-auto"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
          
          {/* Cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-200/50">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-20 lg:py-32"
        aria-labelledby="hero-heading"
      >
        {/* Background decoration */}
        <div 
          className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%230ea5e9\" fill-opacity=\"0.05\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"4\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"
          aria-hidden="true"
        />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="text-center">
            {/* Logo */}
            <div 
              className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl mb-8 animate-float shadow-2xl"
              aria-hidden="true"
            >
              <svg 
                className="w-12 h-12 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2.5} 
                  d="M13 10V3L4 14h7v7l9-11h-7z" 
                />
              </svg>
            </div>
            
            {/* Main heading */}
            <h1 
              id="hero-heading"
              className="text-6xl lg:text-7xl font-black bg-gradient-to-r from-gray-900 via-blue-600 to-cyan-600 bg-clip-text text-transparent mb-6 leading-tight"
            >
              SwingVista
            </h1>
            
            {/* Subtitle */}
            <p className="text-2xl lg:text-3xl text-gray-700 max-w-4xl mx-auto mb-8 font-light leading-relaxed">
              Master your golf swing with <span className="font-semibold text-blue-600">AI-powered analysis</span> and real-time feedback
            </p>
            
            {/* CTA Buttons */}
            <nav className="flex flex-col sm:flex-row gap-4 justify-center items-center" aria-label="Main actions">
              <Link 
                href="/camera" 
                className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-lg font-semibold rounded-2xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
                aria-label="Start live swing analysis with camera"
              >
                <svg 
                  className="w-6 h-6 mr-3" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" 
                  />
                </svg>
                Start Live Analysis
              </Link>
              <Link 
                href="/upload" 
                className="group inline-flex items-center px-8 py-4 bg-white text-gray-700 text-lg font-semibold rounded-2xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
                aria-label="Upload video for swing analysis"
              >
                <svg 
                  className="w-6 h-6 mr-3" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                  />
                </svg>
                Upload Video
              </Link>
            </nav>
          </header>
        </div>
      </section>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Welcome to SwingVista</h2>
          <p className="text-xl text-gray-600 mb-8">Your golf swing analysis dashboard</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/camera" className="bg-blue-500 text-white p-6 rounded-lg hover:bg-blue-600 transition-colors">
              <h3 className="text-xl font-bold mb-2">Live Analysis</h3>
              <p>Real-time swing analysis</p>
            </Link>
            <Link href="/upload" className="bg-green-500 text-white p-6 rounded-lg hover:bg-green-600 transition-colors">
              <h3 className="text-xl font-bold mb-2">Upload Video</h3>
              <p>Analyze recorded swings</p>
            </Link>
            <Link href="/compare" className="bg-purple-500 text-white p-6 rounded-lg hover:bg-purple-600 transition-colors">
              <h3 className="text-xl font-bold mb-2">Compare Swings</h3>
              <p>Track your progress</p>
            </Link>
            <div className="bg-gray-500 text-white p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-2">AI Insights</h3>
              <p>Coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
