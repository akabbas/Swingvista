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
    // Original videos - Fixed URLs to match actual files
    {
      name: "Tiger Woods Driver Swing",
      description: "Professional driver swing with perfect form",
      url: "/fixtures/swings/tiger-woods-swing-original.mp4",
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
    },
    // New PGA Tour golfer videos
    {
      name: "Adam Scott Driver Swing",
      description: "PGA Tour professional driver swing",
      url: "/fixtures/swings/pga_adam_scott_driver_3.mp4",
      thumbnail: "🇦🇺",
      difficulty: "PGA Tour"
    },
    {
      name: "Collin Morikawa Driver Swing",
      description: "PGA Tour professional driver swing",
      url: "/fixtures/swings/pga_collin_morikawa_driver_1.mp4",
      thumbnail: "🇺🇸",
      difficulty: "PGA Tour"
    },
    {
      name: "Hideki Matsuyama Driver Swing",
      description: "PGA Tour professional driver swing",
      url: "/fixtures/swings/pga_hideki_matsuyama_driver_1.mp4",
      thumbnail: "🇯🇵",
      difficulty: "PGA Tour"
    },
    {
      name: "Jon Rahm Driver Swing",
      description: "PGA Tour professional driver swing",
      url: "/fixtures/swings/pga_jon_rahm_driver_3.mp4",
      thumbnail: "🇪🇸",
      difficulty: "PGA Tour"
    },
    {
      name: "Justin Thomas Driver Swing",
      description: "PGA Tour professional driver swing",
      url: "/fixtures/swings/pga_justin_thomas_driver_8.mp4",
      thumbnail: "🇺🇸",
      difficulty: "PGA Tour"
    },
    {
      name: "Rory McIlroy Driver Swing",
      description: "PGA Tour professional driver swing",
      url: "/fixtures/swings/pga_rory_mcilroy_driver_2.mp4",
      thumbnail: "🇮🇪",
      difficulty: "PGA Tour"
    },
    {
      name: "Scottie Scheffler Driver Swing",
      description: "PGA Tour professional driver swing",
      url: "/fixtures/swings/pga_scottie_scheffler_driver_4.mp4",
      thumbnail: "🇺🇸",
      difficulty: "PGA Tour"
    },
    {
      name: "Xander Schauffele Driver Swing",
      description: "PGA Tour professional driver swing",
      url: "/fixtures/swings/pga_xander_schauffele_driver_2.mp4",
      thumbnail: "🇺🇸",
      difficulty: "PGA Tour"
    }
  ];

  const analyzedVideos = [
    {
      name: "Adam Scott Driver (Analyzed)",
      description: "PGA Tour swing with real analysis overlays",
      url: "/fixtures/real_analyzed_swings/pga_adam_scott_driver_3_real_analyzed.mp4",
      thumbnail: "📊",
      difficulty: "Analyzed"
    },
    {
      name: "Xander Schauffele Driver (Analyzed)",
      description: "PGA Tour swing with real analysis overlays",
      url: "/fixtures/real_analyzed_swings/pga_xander_schauffele_driver_2_real_analyzed.mp4",
      thumbnail: "📈",
      difficulty: "Analyzed"
    },
    {
      name: "Collin Morikawa Driver (Analyzed)",
      description: "PGA Tour swing with real analysis overlays",
      url: "/fixtures/real_analyzed_swings/pga_collin_morikawa_driver_1_real_analyzed.mp4",
      thumbnail: "📊",
      difficulty: "Analyzed"
    },
    {
      name: "Rory McIlroy Driver (Analyzed)",
      description: "PGA Tour swing with real analysis overlays",
      url: "/fixtures/real_analyzed_swings/pga_rory_mcilroy_driver_2_real_analyzed.mp4",
      thumbnail: "📈",
      difficulty: "Analyzed"
    },
    {
      name: "Jon Rahm Driver (Analyzed)",
      description: "PGA Tour swing with real analysis overlays",
      url: "/fixtures/real_analyzed_swings/pga_jon_rahm_driver_3_real_analyzed.mp4",
      thumbnail: "📊",
      difficulty: "Analyzed"
    },
    {
      name: "Justin Thomas Driver (Analyzed)",
      description: "PGA Tour swing with real analysis overlays",
      url: "/fixtures/real_analyzed_swings/pga_justin_thomas_driver_8_real_analyzed.mp4",
      thumbnail: "📈",
      difficulty: "Analyzed"
    },
    {
      name: "Scottie Scheffler Driver (Analyzed)",
      description: "PGA Tour swing with real analysis overlays",
      url: "/fixtures/real_analyzed_swings/pga_scottie_scheffler_driver_4_real_analyzed.mp4",
      thumbnail: "📊",
      difficulty: "Analyzed"
    },
    {
      name: "Hideki Matsuyama Driver (Analyzed)",
      description: "PGA Tour swing with real analysis overlays",
      url: "/fixtures/real_analyzed_swings/pga_hideki_matsuyama_driver_7_real_analyzed.mp4",
      thumbnail: "📈",
      difficulty: "Analyzed"
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
            
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Original Videos</h4>
              <p className="text-xs text-gray-500 mb-3">Raw professional swings for analysis</p>
            </div>
            
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
            
            <div className="mt-6 mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Analyzed Videos</h4>
              <p className="text-xs text-gray-500 mb-3">Videos with real analysis overlays and metrics</p>
            </div>
            
            <div className="space-y-3">
              {analyzedVideos.map((video, index) => (
                <button
                  key={`analyzed-${index}`}
                  onClick={() => handleVideoSelect(video)}
                  className="w-full text-left p-3 rounded-lg border border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{video.thumbnail}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{video.name}</div>
                      <div className="text-sm text-gray-600">{video.description}</div>
                      <div className="text-xs text-blue-600 font-medium">{video.difficulty}</div>
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
