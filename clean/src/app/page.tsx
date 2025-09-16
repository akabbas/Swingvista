export default function Dashboard() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-6 text-gray-900">
          Welcome to <span className="text-green-600">SwingVista</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Advanced golf swing analysis with AI-powered insights. 
          Capture your swing and get instant feedback to improve your game.
        </p>
        <div className="flex gap-4 justify-center">
          <a 
            href="/camera" 
            className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Start Camera Analysis
          </a>
          <a 
            href="/upload" 
            className="bg-gray-100 text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Upload Video
          </a>
        </div>
      </div>
    </main>
  );
}


