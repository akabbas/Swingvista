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
  const [clubStats, setClubStats] = useState<ClubStats[]>([]);
  const [recentSwings, setRecentSwings] = useState<SwingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Track your golf swing progress and get instant feedback</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link href="/camera" className="bg-blue-600 text-white p-6 rounded-lg shadow hover:bg-blue-700 transition-colors">
          <h2 className="text-xl font-semibold mb-2">Live Analysis</h2>
          <p className="text-blue-100">Start real-time swing analysis with your camera</p>
        </Link>
        <Link href="/upload" className="bg-green-600 text-white p-6 rounded-lg shadow hover:bg-green-700 transition-colors">
          <h2 className="text-xl font-semibold mb-2">Upload Video</h2>
          <p className="text-green-100">Analyze recorded swing videos</p>
        </Link>
      </div>

      {/* Club Statistics */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Club Statistics</h2>
        {clubStats.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clubStats.map((stat) => (
              <div key={stat.club} className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{stat.club}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Swings:</span>
                    <span className="font-medium">{stat.total_swings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Plane:</span>
                    <span className="font-medium">{stat.avg_swing_plane.toFixed(1)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Tempo:</span>
                    <span className="font-medium">{stat.avg_tempo_ratio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Swing:</span>
                    <span className="font-medium text-sm">
                      {new Date(stat.last_swing).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <p className="text-gray-500">No swing data yet. Start analyzing your swings!</p>
          </div>
        )}
      </div>

      {/* Recent Swings */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Recent Swings</h2>
        {recentSwings.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Club
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plane Angle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tempo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Feedback
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentSwings.map((swing) => (
                    <tr key={swing.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {swing.club}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {swing.metrics.swingPlaneAngle.toFixed(1)}°
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {swing.metrics.tempoRatio.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-wrap gap-1">
                          {swing.feedback.slice(0, 2).map((msg, idx) => (
                            <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                              {msg}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(swing.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Link href={`/swing/${swing.id}`} className="text-blue-600 hover:text-blue-900">
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
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <p className="text-gray-500">No recent swings. Start analyzing your swings!</p>
          </div>
        )}
      </div>
    </div>
  );
}