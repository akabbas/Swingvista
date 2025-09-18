import Link from 'next/link';

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">SV</span>
          </div>
          <span className="font-bold text-xl text-gray-800">SwingVista</span>
        </Link>
        <nav className="flex items-center gap-8 text-sm font-medium">
          <Link 
            href="/" 
            className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
          >
            🏠 Home
          </Link>
          <Link 
            href="/camera" 
            className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
          >
            📹 Camera
          </Link>
          <Link 
            href="/upload" 
            className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
          >
            📤 Upload
          </Link>
          <Link 
            href="/test-enhanced-analysis" 
            className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
          >
            🔬 Analysis Test
          </Link>
        </nav>
      </div>
    </header>
  );
}


