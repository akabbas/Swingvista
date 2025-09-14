'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SwingRecord {
  id: string;
  club: string;
  metrics: {
    swingPlaneAngle: number;
    tempoRatio: number;
    hipRotation: number;
    shoulderRotation: number;
    impactFrame: number;
    backswingTime: number;
    downswingTime: number;
  };
  feedback: string[];
  created_at: string;
}

export default function ComparePage() {
  const [swings, setSwings] = useState<SwingRecord[]>([]);
  const [selectedSwings, setSelectedSwings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSwings();
  }, []);

  const fetchSwings = async () => {
    try {
      const response = await fetch('/api/swings');
      if (response.ok) {
        const data = await response.json();
        setSwings(data);
      }
    } catch (error) {
      console.error('Error fetching swings:', error);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const selectedData = getSelectedSwingData();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Swing Comparison</h1>
        <p className="text-gray-600">Compare two swings side by side to track your progress</p>
      </div>

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
            <Link href="/camera" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Start Recording
            </Link>
            <Link href="/upload" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
              Upload Video
            </Link>
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
                    <div>Plane: {swing.metrics.swingPlaneAngle.toFixed(1)}°</div>
                    <div>Tempo: {swing.metrics.tempoRatio.toFixed(2)}</div>
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
                          {swing.metrics.swingPlaneAngle.toFixed(1)}°
                        </div>
                        <div className="text-xs text-gray-600">Swing Plane</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl font-bold text-gray-900">
                          {swing.metrics.tempoRatio.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-600">Tempo Ratio</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl font-bold text-gray-900">
                          {swing.metrics.hipRotation.toFixed(1)}°
                        </div>
                        <div className="text-xs text-gray-600">Hip Rotation</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl font-bold text-gray-900">
                          {swing.metrics.shoulderRotation.toFixed(1)}°
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
                          <span>{swing.metrics.backswingTime.toFixed(2)}s</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Downswing:</span>
                          <span>{swing.metrics.downswingTime.toFixed(2)}s</span>
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
                  { key: 'swingPlaneAngle', label: 'Swing Plane', unit: '°' },
                  { key: 'tempoRatio', label: 'Tempo Ratio', unit: '' },
                  { key: 'hipRotation', label: 'Hip Rotation', unit: '°' },
                  { key: 'shoulderRotation', label: 'Shoulder Rotation', unit: '°' }
                ].map(({ key, label, unit }) => {
                  const swing1Value = selectedData[0].metrics[key as keyof typeof selectedData[0].metrics] as number;
                  const swing2Value = selectedData[1].metrics[key as keyof typeof selectedData[1].metrics] as number;
                  const difference = swing2Value - swing1Value;
                  const improvement = Math.abs(difference) > 0.1;
                  
                  return (
                    <div key={key} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-2">{label}</div>
                      <div className="text-lg font-bold text-gray-900 mb-1">
                        {swing1Value.toFixed(1)}{unit} → {swing2Value.toFixed(1)}{unit}
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
  );
}
