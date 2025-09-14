'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
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
  video_url?: string;
  created_at: string;
  timestamps: {
    setup: number;
    backswingTop: number;
    impact: number;
    followThrough: number;
  };
}

export default function SwingDetailPage() {
  const params = useParams();
  const [swing, setSwing] = useState<SwingRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (params.id) {
      fetchSwing(params.id as string);
    }
  }, [params.id]);

  const fetchSwing = async (id: string) => {
    try {
      const response = await fetch(`/api/swings/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSwing(data);
      }
    } catch (error) {
      console.error('Error fetching swing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const seekToTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!swing) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Swing Not Found</h1>
          <p className="text-gray-600 mb-6">The requested swing could not be found.</p>
          <Link href="/" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Swing Analysis</h1>
            <p className="text-gray-600">
              {swing.club.charAt(0).toUpperCase() + swing.club.slice(1)} • {new Date(swing.created_at).toLocaleDateString()}
            </p>
          </div>
          <Link href="/" className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Video Player */}
        <div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Swing Video</h2>
            
            {swing.video_url ? (
              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-auto"
                    controls
                    onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  >
                    <source src={swing.video_url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
                
                {/* Playback Controls */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-700">Playback Speed:</span>
                    <div className="flex space-x-2">
                      {[0.25, 0.5, 1, 1.5, 2].map((speed) => (
                        <button
                          key={speed}
                          onClick={() => handleSpeedChange(speed)}
                          className={`px-3 py-1 rounded text-sm font-medium ${
                            playbackSpeed === speed
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Key Moments:</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => seekToTime(swing.timestamps.setup / 1000)}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm font-medium hover:bg-green-200"
                      >
                        Setup
                      </button>
                      <button
                        onClick={() => seekToTime(swing.timestamps.backswingTop / 1000)}
                        className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm font-medium hover:bg-yellow-200"
                      >
                        Top
                      </button>
                      <button
                        onClick={() => seekToTime(swing.timestamps.impact / 1000)}
                        className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm font-medium hover:bg-red-200"
                      >
                        Impact
                      </button>
                      <button
                        onClick={() => seekToTime(swing.timestamps.followThrough / 1000)}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium hover:bg-blue-200"
                      >
                        Finish
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <p className="text-gray-500">No video available for this swing</p>
              </div>
            )}
          </div>
        </div>

        {/* Analysis Results */}
        <div className="space-y-6">
          {/* Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Swing Metrics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {swing.metrics.swingPlaneAngle.toFixed(1)}°
                </div>
                <div className="text-sm text-gray-600">Swing Plane</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {swing.metrics.tempoRatio.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Tempo Ratio</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {swing.metrics.hipRotation.toFixed(1)}°
                </div>
                <div className="text-sm text-gray-600">Hip Rotation</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {swing.metrics.shoulderRotation.toFixed(1)}°
                </div>
                <div className="text-sm text-gray-600">Shoulder Rotation</div>
              </div>
            </div>
          </div>

          {/* Feedback */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Coaching Feedback</h2>
            <div className="space-y-2">
              {swing.feedback.map((feedback, index) => (
                <div
                  key={index}
                  className="bg-blue-100 text-blue-800 px-4 py-2 rounded-md font-medium"
                >
                  {feedback}
                </div>
              ))}
            </div>
          </div>

          {/* Timing Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Timing Breakdown</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Backswing Time:</span>
                <span className="font-medium">{swing.metrics.backswingTime.toFixed(2)}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Downswing Time:</span>
                <span className="font-medium">{swing.metrics.downswingTime.toFixed(2)}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Time:</span>
                <span className="font-medium">{(swing.metrics.backswingTime + swing.metrics.downswingTime).toFixed(2)}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Impact Frame:</span>
                <span className="font-medium">{swing.metrics.impactFrame}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
