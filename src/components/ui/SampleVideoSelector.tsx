"use client";

import React, { useState } from 'react';

interface SampleVideoSelectorProps {
  onSelectVideo: (videoUrl: string, videoName: string) => void;
  className?: string;
}

const SampleVideoSelector: React.FC<SampleVideoSelectorProps> = ({
  onSelectVideo,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const sampleVideos = [
    {
      name: "Tiger Woods Driver Swing",
      description: "Professional driver swing with perfect form",
      url: "/fixtures/swings/tiger-woods-swing.mp4",
      thumbnail: "🏌️",
      difficulty: "Professional"
    },
    {
      name: "Tiger Woods Driver Swing (Slow Motion)",
      description: "Slow motion version for detailed analysis",
      url: "/fixtures/swings/tiger-woods-swing-slow.mp4",
      thumbnail: "🎬",
      difficulty: "Professional"
    },
    {
      name: "Ludvig Aberg Driver Swing",
      description: "Modern professional swing technique",
      url: "/fixtures/swings/ludvig_aberg_driver.mp4",
      thumbnail: "🏆",
      difficulty: "Professional"
    },
    {
      name: "Max Homa Iron Swing",
      description: "Iron swing with excellent tempo",
      url: "/fixtures/swings/max_homa_iron.mp4",
      thumbnail: "⛳",
      difficulty: "Professional"
    }
  ];

  const handleVideoSelect = (video: typeof sampleVideos[0]) => {
    console.log('🎥 SAMPLE VIDEO DEBUG: Video selected from dropdown:', video.name, 'URL:', video.url);
    onSelectVideo(video.url, video.name);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => {
          console.log('🎥 SAMPLE VIDEO DEBUG: Dropdown button clicked, isOpen:', isOpen);
          setIsOpen(!isOpen);
        }}
        className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2"
      >
        <span className="text-xl">🎥</span>
        <span>Try Sample Videos</span>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Sample Golf Swings</h3>
            <p className="text-sm text-gray-600 mb-4">
              Try these professional swings to see how the analysis works
            </p>
            
            <div className="space-y-3">
              {sampleVideos.map((video, index) => (
                <button
                  key={index}
                  onClick={() => handleVideoSelect(video)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{video.thumbnail}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{video.name}</div>
                      <div className="text-sm text-gray-600">{video.description}</div>
                      <div className="text-xs text-green-600 font-medium">{video.difficulty}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                💡 Tip: Upload your own video for personalized analysis
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SampleVideoSelector;
