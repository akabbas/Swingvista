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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-6 animate-float">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4">
          SwingVista
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Master your golf swing with AI-powered analysis and real-time feedback
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Link href="/camera" className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:animate-pulse-glow">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Live Analysis</h2>
            <p className="text-blue-100 text-sm">Real-time swing analysis with your camera</p>
          </div>
        </Link>

        <Link href="/upload" className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:animate-pulse-glow">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Upload Video</h2>
            <p className="text-emerald-100 text-sm">Analyze recorded swing videos</p>
          </div>
        </Link>

        <Link href="/compare" className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 text-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:animate-pulse-glow">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Compare Swings</h2>
            <p className="text-purple-100 text-sm">Track your progress over time</p>
          </div>
        </Link>

        <div className="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 text-white p-8 rounded-2xl shadow-xl">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">AI Insights</h2>
          <p className="text-orange-100 text-sm">Coming soon - Advanced AI coaching</p>
        </div>
      </div>

      {/* Club Statistics */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Club Statistics
          </h2>
          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1 ml-6"></div>
        </div>
        
        {clubStats.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clubStats.map((stat, index) => (
              <div key={stat.club} className="group bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 capitalize">{stat.club}</h3>
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-pulse"></div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-medium">Total Swings</span>
                    <span className="font-bold text-lg text-blue-600">{stat.total_swings}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-medium">Avg Plane</span>
                    <span className="font-bold text-lg text-emerald-600">{stat.avg_swing_plane.toFixed(1)}°</span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-medium">Avg Tempo</span>
                    <span className="font-bold text-lg text-purple-600">{stat.avg_tempo_ratio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-medium">Last Swing</span>
                    <span className="font-medium text-sm text-gray-500">
                      {new Date(stat.last_swing).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/70 backdrop-blur-sm p-12 rounded-2xl border border-gray-200/50 shadow-lg text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Swing Data Yet</h3>
            <p className="text-gray-500 mb-6">Start analyzing your swings to see detailed statistics here</p>
            <Link href="/camera" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg hover:shadow-xl">
              Start Your First Analysis
            </Link>
          </div>
        )}
      </div>

      {/* Recent Swings */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Recent Swings
          </h2>
          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1 ml-6"></div>
        </div>
        
        {recentSwings.length > 0 ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Club
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Plane Angle
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Tempo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Feedback
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50">
                  {recentSwings.map((swing, index) => (
                    <tr key={swing.id} className="hover:bg-gray-50/50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-white font-bold text-xs uppercase">
                              {swing.club.charAt(0)}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900 capitalize">
                            {swing.club}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                          {swing.metrics.swingPlaneAngle.toFixed(1)}°
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                          {swing.metrics.tempoRatio.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {swing.feedback.slice(0, 2).map((msg, idx) => (
                            <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {msg}
                            </span>
                          ))}
                          {swing.feedback.length > 2 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              +{swing.feedback.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(swing.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link 
                          href={`/swing/${swing.id}`} 
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-md hover:shadow-lg"
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
          <div className="bg-white/70 backdrop-blur-sm p-12 rounded-2xl border border-gray-200/50 shadow-lg text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Recent Swings</h3>
            <p className="text-gray-500 mb-6">Your recent swing analysis will appear here</p>
            <Link href="/camera" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg hover:shadow-xl">
              Start Analyzing
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}