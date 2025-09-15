'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getEnvironmentConfig, logEnvironmentInfo } from '@/lib/environment';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorAlert from '@/components/ui/ErrorAlert';

interface SwingRecord {
  id: string;
  club: string;
  swing_plane_angle: number;
  tempo_ratio: number;
  hip_rotation: number;
  shoulder_rotation: number;
  impact_frame: number;
  backswing_time: number;
  downswing_time: number;
  feedback: string[];
  created_at: string;
  report_card?: {
    setup: { grade: string; tip: string };
    grip: { grade: string; tip: string };
    alignment: { grade: string; tip: string };
    rotation: { grade: string; tip: string };
    impact: { grade: string; tip: string };
    follow_through: { grade: string; tip: string };
    overall: { score: string; tip: string };
  };
}

export default function ComparePage() {
  const [swings, setSwings] = useState<SwingRecord[]>([]);
  const [selectedSwings, setSelectedSwings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [environmentConfig] = useState(getEnvironmentConfig());

  // Log environment info in development
  useEffect(() => {
    logEnvironmentInfo();
  }, []);

  useEffect(() => {
    fetchSwings();
  }, []);

  const fetchSwings = async () => {
    try {
      setError(null);
      const response = await fetch(`${environmentConfig.apiBaseUrl}/swings`);
      if (response.ok) {
        const data = await response.json();
        setSwings(data);
      } else {
        throw new Error(`Failed to fetch swings: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching swings:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch swings');
    } finally {
      setLoading(false);
    }
  };

  const toggleSwingSelection = (swingId: string) => {
    setSelectedSwings(prev => {
      if (prev.includes(swingId)) {
        return prev.filter(id => id !== swingId);
      } else if (prev.length < 2) {
        return [...prev, swingId];
      }
      return prev;
    });
  };

  const getSelectedSwingData = () => {
    return selectedSwings.map(id => swings.find(swing => swing.id === id)).filter(Boolean) as SwingRecord[];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <header className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Swing Comparison</h1>
            <p className="text-gray-600 text-lg">Compare your swings to track progress and identify improvements</p>
          </header>
          <LoadingSpinner size="lg" text="Loading swings..." className="py-12" />
        </div>
      </div>
    );
  }

  const selectedData = getSelectedSwingData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <header className="mb-8">
          <nav className="flex items-center mb-4" aria-label="Breadcrumb">
            <Link 
              href="/" 
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Swing Comparison</h1>
          <p className="text-gray-600 text-lg">Compare your swings to track progress and identify improvements</p>
        </header>

        {/* Error Display */}
        {error && (
          <ErrorAlert 
            message={error} 
            onDismiss={() => setError(null)}
            className="mb-6"
          />
        )}

      {swings.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Swings to Compare</h3>
          <p className="text-gray-500 mb-6">Record some swings first to use the comparison feature.</p>
          <div className="space-x-4">
            <Button asChild variant="primary">
              <Link href="/camera">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Start Recording
              </Link>
            </Button>
            <Button asChild variant="success">
              <Link href="/upload">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Video
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Swing Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Swings to Compare</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {swings.map((swing) => (
                <div
                  key={swing.id}
                  onClick={() => toggleSwingSelection(swing.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    selectedSwings.includes(swing.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{swing.club}</h3>
                    <span className="text-sm text-gray-500">
                      {new Date(swing.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Plane: {swing.swing_plane_angle.toFixed(1)}°</div>
                    <div>Tempo: {swing.tempo_ratio.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-sm text-gray-500">
              Select 2 swings to compare (currently selected: {selectedSwings.length}/2)
            </div>
          </div>

          {/* Comparison View */}
          {selectedData.length === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {selectedData.map((swing, index) => (
                <div key={swing.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Swing {index + 1}: {swing.club}
                    </h3>
                    <Link
                      href={`/swing/${swing.id}`}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      View Details
                    </Link>
                  </div>

                  {/* Metrics Comparison */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl font-bold text-gray-900">
                          {swing.swing_plane_angle.toFixed(1)}°
                        </div>
                        <div className="text-xs text-gray-600">Swing Plane</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl font-bold text-gray-900">
                          {swing.tempo_ratio.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-600">Tempo Ratio</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl font-bold text-gray-900">
                          {swing.hip_rotation.toFixed(1)}°
                        </div>
                        <div className="text-xs text-gray-600">Hip Rotation</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl font-bold text-gray-900">
                          {swing.shoulder_rotation.toFixed(1)}°
                        </div>
                        <div className="text-xs text-gray-600">Shoulder Rotation</div>
                      </div>
                    </div>

                    {/* Feedback */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Feedback</h4>
                      <div className="space-y-1">
                        {swing.feedback.map((feedback, idx) => (
                          <div
                            key={idx}
                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm font-medium"
                          >
                            {feedback}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Timing */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Timing</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Backswing:</span>
                          <span>{swing.backswing_time.toFixed(2)}s</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Downswing:</span>
                          <span>{swing.downswing_time.toFixed(2)}s</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comparison Summary */}
          {selectedData.length === 2 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Comparison Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { key: 'swing_plane_angle', label: 'Swing Plane', unit: '°' },
                  { key: 'tempo_ratio', label: 'Tempo Ratio', unit: '' },
                  { key: 'hip_rotation', label: 'Hip Rotation', unit: '°' },
                  { key: 'shoulder_rotation', label: 'Shoulder Rotation', unit: '°' }
                ].map(({ key, label, unit }) => {
                  const swing1Value = selectedData[0][key as keyof SwingRecord] as number;
                  const swing2Value = selectedData[1][key as keyof SwingRecord] as number;
                  const difference = swing2Value - swing1Value;
                  const improvement = Math.abs(difference) > 0.1;
                  
                  return (
                    <div key={key} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-2">{label}</div>
                      <div className="text-lg font-bold text-gray-900 mb-1">
                        {swing1Value.toFixed(1)}{unit} {'→'} {swing2Value.toFixed(1)}{unit}
                      </div>
                      <div className={`text-sm font-medium ${
                        improvement ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {difference > 0 ? '+' : ''}{difference.toFixed(1)}{unit}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
