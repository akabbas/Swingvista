import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 py-8 text-sm text-gray-600 flex items-center justify-between">
        <span>© {currentYear} SwingVista - Golf Swing Analysis</span>
        <nav className="flex items-center gap-6">
          <Link 
            href="/camera" 
            className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            📹 Camera
          </Link>
          <Link 
            href="/upload" 
            className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            📤 Upload
          </Link>
        </nav>
      </div>
    </footer>
  );
}


