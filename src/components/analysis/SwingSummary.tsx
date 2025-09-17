'use client';

import React from 'react';

interface SwingSummaryProps {
  summary: string;
  className?: string;
}

export default function SwingSummary({ summary, className = '' }: SwingSummaryProps) {
  if (!summary) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg p-6 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-lg font-bold">💡</span>
          </div>
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Swing Summary
          </h3>
          <p className="text-gray-700 text-base leading-relaxed">
            {summary}
          </p>
        </div>
      </div>
    </div>
  );
}
