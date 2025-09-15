'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { SwingExporter, defaultExportOptions } from '@/lib/export-utils';

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
  video_url?: string;
  created_at: string;
  phases?: Array<{
    name: string;
    startFrame: number;
    endFrame: number;
    startTime: number;
    endTime: number;
  }>;
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

export default function SwingDetailPage() {
  const params = useParams();
  const [swing, setSwing] = useState<SwingRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
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

  const handleExport = async (format: 'json' | 'csv') => {
    if (!swing) return;

    setIsExporting(true);
    try {
      // Create export data from swing record
      const exportData = {
        swingId: swing.id,
        timestamp: new Date(swing.created_at).getTime(),
        club: swing.club,
        trajectory: {
          rightWrist: [],
          leftWrist: [],
          rightShoulder: [],
          leftShoulder: [],
          rightHip: [],
          leftHip: [],
          clubhead: []
        },
        phases: (swing.phases || []).map(phase => ({
          name: phase.name,
          startFrame: phase.startFrame,
          endFrame: phase.endFrame,
          startTime: phase.startTime,
          endTime: phase.endTime,
          duration: phase.endTime - phase.startTime,
          keyLandmarks: [],
          color: '#3B82F6',
          description: `${phase.name} phase`
        })),
        metrics: {
          totalDistance: 0,
          maxVelocity: 0,
          avgVelocity: 0,
          maxAcceleration: 0,
          avgAcceleration: 0,
          peakFrame: swing.impact_frame,
          smoothness: 0.8
        },
        pathAnalysis: {
          clubheadPath: [],
          swingPlane: swing.swing_plane_angle,
          pathConsistency: 0.8,
          insideOut: false,
          outsideIn: false,
          onPlane: true
        },
        reportCard: swing.report_card ? {
          setup: swing.report_card.setup,
          grip: swing.report_card.grip,
          alignment: swing.report_card.alignment,
          rotation: swing.report_card.rotation,
          impact: swing.report_card.impact,
          followThrough: swing.report_card.follow_through,
          overall: swing.report_card.overall
        } : {
          setup: { grade: 'C', tip: 'Setup needs improvement' },
          grip: { grade: 'C', tip: 'Grip needs improvement' },
          alignment: { grade: 'C', tip: 'Alignment needs improvement' },
          rotation: { grade: 'C', tip: 'Rotation needs improvement' },
          impact: { grade: 'C', tip: 'Impact needs improvement' },
          followThrough: { grade: 'C', tip: 'Follow through needs improvement' },
          overall: { score: 'C', tip: 'Overall swing needs improvement' }
        },
        videoUrl: swing.video_url
      };

      const options = {
        ...defaultExportOptions,
        format,
        includeTrajectory: false, // No trajectory data available
        includePhases: true,
        includeMetrics: true,
        includeReportCard: true
      };

      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === 'json') {
        content = SwingExporter.exportAsJSON(exportData, options);
        filename = `swing-${swing.id}.json`;
        mimeType = 'application/json';
      } else {
        content = SwingExporter.exportAsCSV(exportData, options);
        filename = `swing-${swing.id}.csv`;
        mimeType = 'text/csv';
      }

      SwingExporter.downloadFile(content, filename, mimeType);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
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
            <div className="flex space-x-3">
              <div className="flex space-x-2">
                <button
                  onClick={() => handleExport('json')}
                  disabled={isExporting}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center"
                >
                  {isExporting ? (
                    <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                  Export JSON
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  disabled={isExporting}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </button>
              </div>
              <Link href="/" className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
                Back to Dashboard
              </Link>
            </div>
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
                      {swing.phases && swing.phases.length > 0 ? (
                        swing.phases.map((phase, index) => (
                          <button
                            key={phase.name}
                            onClick={() => seekToTime(phase.startTime / 1000)}
                            className={`px-3 py-1 rounded text-sm font-medium hover:opacity-80 ${
                              phase.name === 'Setup' ? 'bg-green-100 text-green-800' :
                              phase.name === 'Backswing' ? 'bg-yellow-100 text-yellow-800' :
                              phase.name === 'Impact' ? 'bg-red-100 text-red-800' :
                              phase.name === 'Follow-through' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {phase.name}
                          </button>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">No phase data available</div>
                      )}
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
                  {swing.swing_plane_angle.toFixed(1)}°
                </div>
                <div className="text-sm text-gray-600">Swing Plane</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {swing.tempo_ratio.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Tempo Ratio</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {swing.hip_rotation.toFixed(1)}°
                </div>
                <div className="text-sm text-gray-600">Hip Rotation</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {swing.shoulder_rotation.toFixed(1)}°
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
                <span className="font-medium">{swing.backswing_time.toFixed(2)}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Downswing Time:</span>
                <span className="font-medium">{swing.downswing_time.toFixed(2)}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Time:</span>
                <span className="font-medium">{(swing.backswing_time + swing.downswing_time).toFixed(2)}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Impact Frame:</span>
                <span className="font-medium">{swing.impact_frame}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
