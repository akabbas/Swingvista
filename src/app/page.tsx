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
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-12">
          <a 
            href="/camera" 
            className="w-full sm:w-auto bg-green-600 text-white px-10 py-4 rounded-xl font-semibold hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-center min-w-[200px]"
          >
            📹 Start Camera Analysis
          </a>
          <a 
            href="/upload-clean" 
            className="w-full sm:w-auto bg-blue-600 text-white px-10 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-center min-w-[200px]"
          >
            📤 Upload Video (Enhanced)
          </a>
          <a 
            href="/upload" 
            className="w-full sm:w-auto bg-gray-100 text-gray-900 px-10 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-center min-w-[200px]"
          >
            📤 Upload Video (Legacy)
          </a>
        </div>
      </div>
    </main>
  );
}


