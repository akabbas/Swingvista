import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 py-8 text-sm text-gray-600 flex items-center justify-between">
        <span>© {currentYear} SwingVista - Golf Swing Analysis</span>
        <nav className="flex items-center gap-4">
          <Link href="/camera" className="hover:text-gray-900">Camera</Link>
          <Link href="/upload" className="hover:text-gray-900">Upload</Link>
        </nav>
      </div>
    </footer>
  );
}


