"use client";

import { useState, useRef } from 'react';

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onChooseFile = () => {
    console.log('Choose file button clicked');
    inputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    console.log('File selected:', selectedFile?.name);
    setFile(selectedFile);
  };

  const analyze = () => {
    if (!file) {
      alert('Please choose a video file first.');
      return;
    }
    console.log('Analyze button clicked for file:', file.name);
    setIsAnalyzing(true);
    
    // Simulate analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      alert('Analysis completed! (This is a test)');
    }, 2000);
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-6 text-gray-900">
          🧪 Test Upload Page
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          This is a simplified test version to verify button functionality.
        </p>
        
        <div className="bg-gray-50 rounded-2xl p-8 md:p-12 mb-12 text-left">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Test Upload Area</h2>
          <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={onFileChange} />
          
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
            <button 
              onClick={onChooseFile} 
              className="w-full md:w-auto bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-all shadow"
            >
              📁 {file ? 'Change File' : 'Choose File'}
            </button>
            
            <button 
              onClick={analyze} 
              disabled={!file || isAnalyzing} 
              className="w-full md:w-auto bg-blue-600 disabled:bg-blue-300 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow"
            >
              🔍 {isAnalyzing ? 'Analyzing...' : 'Analyze Video'}
            </button>
            
            {file && (
              <span className="text-sm text-gray-600 truncate">
                Selected: {file.name}
              </span>
            )}
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-2xl p-8 text-left">
          <h3 className="text-xl font-semibold mb-4 text-blue-800">Test Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-700">
            <li>Click "Choose File" button - should open file picker</li>
            <li>Select a video file - button should change to "Change File"</li>
            <li>Click "Analyze Video" button - should start analysis simulation</li>
            <li>Check browser console for log messages</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
