import Link from 'next/link';

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white dark:bg-slate-900 dark:border-slate-800">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-blue-600 rounded-sm" />
          <span className="font-semibold">SwingVista</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/">Home</Link>
          <Link href="/camera">Camera</Link>
          <Link href="/upload">Upload</Link>
        </nav>
      </div>
    </header>
  );
}


