'use client';

import React, { useState } from 'react';

const TestDebugSimplePage: React.FC = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🛠️ Simple Debug Test
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Debug Controls</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Counter: {count}</p>
              <button
                onClick={() => setCount(count + 1)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg mr-2"
              >
                Increment
              </button>
              <button
                onClick={() => setCount(0)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
              >
                Reset
              </button>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">
                This is a simplified debug page to test basic functionality.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <h3 className="font-semibold text-green-800">React</h3>
              <p className="text-sm text-green-600">✅ Working</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <h3 className="font-semibold text-green-800">Next.js</h3>
              <p className="text-sm text-green-600">✅ Working</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <h3 className="font-semibold text-green-800">TypeScript</h3>
              <p className="text-sm text-green-600">✅ Working</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestDebugSimplePage;
