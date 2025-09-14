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

        {/* Features Section */}
        <section 
          className="mb-20"
          aria-labelledby="features-heading"
        >
          <header className="text-center mb-16">
            <h2 
              id="features-heading"
              className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4"
            >
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to improve your golf game with cutting-edge technology
            </p>
          </header>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" role="list">
            <article 
              className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white p-10 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 focus-within:ring-4 focus-within:ring-blue-300"
              role="listitem"
            >
              <Link 
                href="/camera" 
                className="block h-full"
                aria-label="Start live swing analysis with camera"
              >
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  aria-hidden="true"
                />
                <div className="relative z-10 text-center">
                  <div 
                    className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:animate-pulse-glow"
                    aria-hidden="true"
                  >
                    <svg 
                      className="w-8 h-8" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" 
                      />
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" 
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Live Analysis</h3>
                  <p className="text-blue-100 text-base leading-relaxed">
                    Real-time swing analysis with your camera for instant feedback
                  </p>
                </div>
              </Link>
            </article>

            <article 
              className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-10 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 focus-within:ring-4 focus-within:ring-emerald-300"
              role="listitem"
            >
              <Link 
                href="/upload" 
                className="block h-full"
                aria-label="Upload video for swing analysis"
              >
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  aria-hidden="true"
                />
                <div className="relative z-10 text-center">
                  <div 
                    className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:animate-pulse-glow"
                    aria-hidden="true"
                  >
                    <svg 
                      className="w-8 h-8" 
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
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Upload Video</h3>
                  <p className="text-emerald-100 text-base leading-relaxed">
                    Analyze recorded swing videos with detailed metrics
                  </p>
                </div>
              </Link>
            </article>

            <article 
              className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 text-white p-10 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 focus-within:ring-4 focus-within:ring-purple-300"
              role="listitem"
            >
              <Link 
                href="/compare" 
                className="block h-full"
                aria-label="Compare swing analysis results"
              >
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  aria-hidden="true"
                />
                <div className="relative z-10 text-center">
                  <div 
                    className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:animate-pulse-glow"
                    aria-hidden="true"
                  >
                    <svg 
                      className="w-8 h-8" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Compare Swings</h3>
                  <p className="text-purple-100 text-base leading-relaxed">
                    Track your progress over time with detailed comparisons
                  </p>
                </div>
              </Link>
            </article>

            <article 
              className="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 text-white p-10 rounded-3xl shadow-2xl"
              role="listitem"
            >
              <div className="text-center">
                <div 
                  className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 mx-auto"
                  aria-hidden="true"
                >
                  <svg 
                    className="w-8 h-8" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3">AI Insights</h3>
                <p className="text-orange-100 text-base leading-relaxed">
                  Coming soon - Advanced AI coaching and personalized tips
                </p>
              </div>
            </article>
          </div>
        </section>

        {/* Statistics Section */}
        <section 
          className="mb-20"
          aria-labelledby="performance-heading"
        >
          <header className="text-center mb-16">
            <h2 
              id="performance-heading"
              className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4"
            >
              Your Performance
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Track your progress across different clubs and see how you're improving
            </p>
          </header>
        
          {clubStats.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" role="list">
              {clubStats.map((stat, index) => (
                <article 
                  key={stat.club} 
                  className="group bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                  role="listitem"
                >
                  <header className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 capitalize">{stat.club}</h3>
                    <div 
                      className="w-4 h-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-pulse"
                      aria-hidden="true"
                    />
                  </header>
                  <dl className="space-y-4">
                    <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
                      <dt className="text-gray-700 font-semibold">Total Swings</dt>
                      <dd className="font-bold text-xl text-blue-600">{stat.total_swings}</dd>
                    </div>
                    <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl">
                      <dt className="text-gray-700 font-semibold">Avg Plane</dt>
                      <dd className="font-bold text-xl text-emerald-600">{stat.avg_swing_plane.toFixed(1)}°</dd>
                    </div>
                    <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl">
                      <dt className="text-gray-700 font-semibold">Avg Tempo</dt>
                      <dd className="font-bold text-xl text-purple-600">{stat.avg_tempo_ratio.toFixed(2)}</dd>
                    </div>
                    <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl">
                      <dt className="text-gray-700 font-semibold">Last Swing</dt>
                      <dd className="font-medium text-sm text-gray-600">
                        <time dateTime={stat.last_swing}>
                          {new Date(stat.last_swing).toLocaleDateString()}
                        </time>
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm p-16 rounded-3xl border border-gray-200/50 shadow-xl text-center">
              <div 
                className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6"
                aria-hidden="true"
              >
                <svg 
                  className="w-10 h-10 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M13 10V3L4 14h7v7l9-11h-7z" 
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No Swing Data Yet</h3>
              <p className="text-gray-600 mb-8 text-lg">
                Start analyzing your swings to see detailed statistics and track your progress
              </p>
              <Link 
                href="/camera" 
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-2xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
                aria-label="Start your first swing analysis"
              >
                Start Your First Analysis
              </Link>
            </div>
          )}
        </section>

        {/* Recent Swings Section */}
        <section aria-labelledby="recent-heading">
          <header className="text-center mb-16">
            <h2 
              id="recent-heading"
              className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4"
            >
              Recent Analysis
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Your latest swing analysis results and performance insights
            </p>
          </header>
        
          {recentSwings.length > 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full" role="table">
                  <caption className="sr-only">
                    Recent swing analysis results with club, metrics, feedback, and actions
                  </caption>
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th 
                        scope="col"
                        className="px-8 py-6 text-left text-sm font-bold text-gray-700 uppercase tracking-wider"
                      >
                        Club
                      </th>
                      <th 
                        scope="col"
                        className="px-8 py-6 text-left text-sm font-bold text-gray-700 uppercase tracking-wider"
                      >
                        Plane Angle
                      </th>
                      <th 
                        scope="col"
                        className="px-8 py-6 text-left text-sm font-bold text-gray-700 uppercase tracking-wider"
                      >
                        Tempo
                      </th>
                      <th 
                        scope="col"
                        className="px-8 py-6 text-left text-sm font-bold text-gray-700 uppercase tracking-wider"
                      >
                        Feedback
                      </th>
                      <th 
                        scope="col"
                        className="px-8 py-6 text-left text-sm font-bold text-gray-700 uppercase tracking-wider"
                      >
                        Date
                      </th>
                      <th 
                        scope="col"
                        className="px-8 py-6 text-left text-sm font-bold text-gray-700 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50">
                    {recentSwings.map((swing, index) => (
                      <tr key={swing.id} className="hover:bg-gray-50/50 transition-colors duration-200">
                        <th 
                          scope="row"
                          className="px-8 py-6 whitespace-nowrap"
                        >
                          <div className="flex items-center">
                            <div 
                              className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4"
                              aria-hidden="true"
                            >
                              <span className="text-white font-bold text-sm uppercase">
                                {swing.club.charAt(0)}
                              </span>
                            </div>
                            <span className="text-base font-semibold text-gray-900 capitalize">
                              {swing.club}
                            </span>
                          </div>
                        </th>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-emerald-100 text-emerald-800">
                            {swing.metrics.swingPlaneAngle.toFixed(1)}°
                          </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-purple-100 text-purple-800">
                            {swing.metrics.tempoRatio.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex flex-wrap gap-2">
                            {swing.feedback.slice(0, 2).map((msg, idx) => (
                              <span 
                                key={idx} 
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {msg}
                              </span>
                            ))}
                            {swing.feedback.length > 2 && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                +{swing.feedback.length - 2} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-600 font-medium">
                          <time dateTime={swing.created_at}>
                            {new Date(swing.created_at).toLocaleDateString()}
                          </time>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <Link 
                            href={`/swing/${swing.id}`} 
                            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-bold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
                            aria-label={`View details for ${swing.club} swing analysis`}
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm p-16 rounded-3xl border border-gray-200/50 shadow-xl text-center">
              <div 
                className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6"
                aria-hidden="true"
              >
                <svg 
                  className="w-10 h-10 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No Recent Swings</h3>
              <p className="text-gray-600 mb-8 text-lg">
                Your recent swing analysis will appear here
              </p>
              <Link 
                href="/camera" 
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-2xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
                aria-label="Start analyzing your golf swing"
              >
                Start Analyzing
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}