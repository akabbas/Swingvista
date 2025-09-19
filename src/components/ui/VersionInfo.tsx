'use client';

import { useState } from 'react';

export default function VersionInfo() {
  const [isOpen, setIsOpen] = useState(false);

  const versionInfo = {
    version: '2.0.0',
    branch: 'feature/enhanced-swing-analysis-v2',
    build: 'development',
    lastCommit: '8f4dd8a',
    features: [
      '9 PGA Tour Golfer Videos',
      'Real Computer Vision Analysis',
      'Immediate Video Preview',
      'AI-Powered Feedback',
      'Phase Detection System',
      'Professional Golf Standards'
    ]
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-800 text-white px-3 py-2 rounded-lg text-xs font-mono hover:bg-gray-700 transition-colors"
        title="Click to view version info"
      >
        v{versionInfo.version}
      </button>
      
      {isOpen && (
        <div className="absolute bottom-12 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-semibold text-gray-800">SwingVista Version Info</span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-1 text-xs">
              <div><span className="font-medium">Version:</span> {versionInfo.version}</div>
              <div><span className="font-medium">Branch:</span> {versionInfo.branch}</div>
              <div><span className="font-medium">Build:</span> {versionInfo.build}</div>
              <div><span className="font-medium">Last Commit:</span> {versionInfo.lastCommit}</div>
            </div>
            
            <div className="border-t pt-2">
              <div className="font-medium text-gray-800 mb-1">Key Features:</div>
              <ul className="space-y-1 text-xs text-gray-600">
                {versionInfo.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="border-t pt-2 text-xs text-gray-500">
              <div>Available Videos: 20 total</div>
              <div>Analysis Types: 4 different overlays</div>
              <div>Status: Latest Development</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
