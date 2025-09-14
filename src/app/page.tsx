'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="text-center space-y-4">
            <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-1/3 mx-auto"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to SwingVista</h1>
          <p className="text-xl text-gray-600 mb-8">Your golf swing analysis dashboard</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/camera" className="bg-blue-500 text-white p-6 rounded-lg hover:bg-blue-600 transition-colors">
              <h3 className="text-xl font-bold mb-2">Live Analysis</h3>
              <p>Real-time swing analysis</p>
            </Link>
            <Link href="/upload" className="bg-green-500 text-white p-6 rounded-lg hover:bg-green-600 transition-colors">
              <h3 className="text-xl font-bold mb-2">Upload Video</h3>
              <p>Analyze recorded swings</p>
            </Link>
            <Link href="/compare" className="bg-purple-500 text-white p-6 rounded-lg hover:bg-purple-600 transition-colors">
              <h3 className="text-xl font-bold mb-2">Compare Swings</h3>
              <p>Track your progress</p>
            </Link>
            <div className="bg-gray-500 text-white p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-2">AI Insights</h3>
              <p>Coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}