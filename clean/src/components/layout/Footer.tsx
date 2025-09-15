import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t border-gray-200 bg-white dark:bg-slate-900 dark:border-slate-800">
      <div className="max-w-5xl mx-auto px-4 py-8 text-sm text-gray-600 dark:text-slate-300 flex items-center justify-between">
        <span>© {currentYear} SwingVista</span>
        <nav className="flex items-center gap-4">
          <Link href="/camera">Camera</Link>
          <Link href="/upload">Upload</Link>
        </nav>
      </div>
    </footer>
  );
}


