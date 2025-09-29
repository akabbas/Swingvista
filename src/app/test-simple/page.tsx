'use client';

import React from 'react';

const TestSimplePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 Simple Test Page
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Basic Test</h2>
          <p className="text-gray-600">
            This is a simple test page to verify that Next.js is working correctly.
          </p>
          
          <div className="mt-4">
            <button 
              onClick={() => alert('Button clicked!')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Test Button
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestSimplePage;
