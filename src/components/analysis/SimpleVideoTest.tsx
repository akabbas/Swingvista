'use client';

import React, { useRef, useEffect, useState } from 'react';

interface SimpleVideoTestProps {
  videoUrl: string;
  videoName: string;
  isSampleVideo?: boolean;
}

export default function SimpleVideoTest({ videoUrl, videoName, isSampleVideo = false }: SimpleVideoTestProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<any>(null);

  useEffect(() => {
    console.log('🎥 SimpleVideoTest mounted with:', { videoUrl, videoName, isSampleVideo });
  }, [videoUrl, videoName, isSampleVideo]);

  const handleVideoLoad = () => {
    console.log('✅ Video loaded successfully');
    setVideoLoaded(true);
    setVideoError(null);
    
    if (videoRef.current) {
      const video = videoRef.current;
      setVideoInfo({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        readyState: video.readyState
      });
    }
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('❌ Video error:', e);
    setVideoError('Failed to load video');
    setVideoLoaded(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Simple Video Test</h2>
      
      <div className="mb-4">
        <p><strong>Video Name:</strong> {videoName}</p>
        <p><strong>Video URL:</strong> {videoUrl}</p>
        <p><strong>Is Sample Video:</strong> {isSampleVideo ? 'Yes' : 'No'}</p>
        <p><strong>Status:</strong> {videoLoaded ? '✅ Loaded' : videoError ? '❌ Error' : '⏳ Loading...'}</p>
      </div>

      {videoInfo && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Video Info:</h3>
          <p>Duration: {videoInfo.duration}s</p>
          <p>Dimensions: {videoInfo.width}x{videoInfo.height}</p>
          <p>Ready State: {videoInfo.readyState}</p>
        </div>
      )}

      {videoError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-medium mb-2">Video Error</h3>
          <p className="text-red-700">{videoError}</p>
        </div>
      )}

      <div className="relative">
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          className="w-full max-w-4xl mx-auto rounded-lg shadow-lg"
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
          onLoadStart={() => console.log('🔄 Video load started')}
          onLoadedMetadata={() => console.log('📊 Video metadata loaded')}
          onCanPlay={() => console.log('▶️ Video can play')}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
}
