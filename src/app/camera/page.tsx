import Link from 'next/link';

export default function CameraPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-6 text-gray-900">
          📹 Camera Analysis
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Real-time golf swing analysis with your camera. Get instant feedback and improve your game.
        </p>
        
        <div className="bg-gray-50 rounded-2xl p-12 mb-12">
          <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-6 flex items-center justify-center">
            <span className="text-4xl">📹</span>
          </div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Camera Ready</h2>
          <p className="text-gray-600 mb-8">Camera analysis features will be implemented here.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <button className="w-full sm:w-auto bg-green-600 text-white px-10 py-4 rounded-xl font-semibold hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-center min-w-[200px]">
            🎬 Start Recording
          </button>
          <button className="w-full sm:w-auto bg-blue-600 text-white px-10 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-center min-w-[200px]">
            ⚙️ Settings
          </button>
          <Link 
            href="/" 
            className="w-full sm:w-auto bg-gray-100 text-gray-900 px-10 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-center min-w-[200px]"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}


