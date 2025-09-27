'use client';

import { useEffect, useState } from 'react';

export default function TestMediaPipePage() {
  const [status, setStatus] = useState('Loading...');
  const [logs, setLogs] = useState<string[]>([]);

  const log = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, message]);
  };

  useEffect(() => {
    async function testMediaPipeLoading() {
      try {
        log('🔄 Testing local MediaPipe loading...');
        
        // Test if local files are accessible
        const response = await fetch('/mediapipe/pose.js');
        if (response.ok) {
          log('✅ Local MediaPipe files are accessible');
        } else {
          log('❌ Local MediaPipe files not accessible');
          setStatus('❌ Local MediaPipe files not accessible');
          return;
        }
        
        // Load MediaPipe script
        const script = document.createElement('script');
        script.src = '/mediapipe/pose.js';
        
        script.onload = () => {
          log('✅ MediaPipe script loaded successfully');
          
          // Check if Pose is available
          if (typeof (window as any).Pose === 'function') {
            log('✅ Pose constructor found: ' + typeof (window as any).Pose);
            setStatus('✅ MediaPipe loaded successfully from local files!');
            
            // Try to create a Pose instance
            try {
              const pose = new (window as any).Pose({
                locateFile: (file: string) => {
                  log('📁 Loading file: ' + file);
                  return '/mediapipe/' + file;
                }
              });
              log('✅ Pose instance created successfully');
            } catch (error: any) {
              log('❌ Failed to create Pose instance: ' + error.message);
            }
          } else {
            log('❌ Pose constructor not found');
            setStatus('❌ MediaPipe failed to load');
          }
        };
        
        script.onerror = (error) => {
          log('❌ Failed to load MediaPipe script: ' + error);
          setStatus('❌ MediaPipe script failed to load');
        };
        
        document.head.appendChild(script);
        
      } catch (error: any) {
        log('❌ Test failed: ' + error.message);
        setStatus('❌ Test failed: ' + error.message);
      }
    }
    
    testMediaPipeLoading();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">MediaPipe Local Loading Test</h1>
          
          <div className="mb-6">
            <div 
              id="status" 
              className={`text-lg font-semibold ${
                status.includes('✅') ? 'text-green-600' : 
                status.includes('❌') ? 'text-red-600' : 'text-blue-600'
              }`}
            >
              {status}
            </div>
          </div>
          
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Test Logs:</h3>
            <div className="space-y-1 text-sm font-mono">
              {logs.map((log, index) => (
                <div key={index} className="text-gray-700">{log}</div>
              ))}
            </div>
          </div>
          
          <div className="mt-6">
            <a 
              href="/upload" 
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              ← Back to Upload
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
