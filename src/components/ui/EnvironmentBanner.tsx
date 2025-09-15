export default function EnvironmentBanner() {
  return (
    <div className="bg-yellow-500 text-yellow-900 px-4 py-2 text-sm font-medium">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span>Development Environment</span>
          <span className="px-2 py-1 bg-yellow-600 text-yellow-100 rounded text-xs">
            v1.0.0
          </span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span className="text-xs">Testing...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
