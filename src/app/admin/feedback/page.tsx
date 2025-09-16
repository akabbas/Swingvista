"use client";
import { useEffect, useMemo, useState } from 'react';

interface FeedbackItem {
  id?: string | number;
  feedback: string;
  timestamp?: string;
  email?: string | null;
}

export default function FeedbackAdminPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  // Simple client-side auth gate (replace with secure auth in production)
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('admin-authenticated') === 'true') {
      setAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const expected = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'dev123';
    if (password === expected) {
      if (typeof window !== 'undefined') sessionStorage.setItem('admin-authenticated', 'true');
      setAuthenticated(true);
    } else {
      alert('Incorrect password');
    }
  };

  useEffect(() => {
    if (!authenticated) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/feedback', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load feedback');
        const data = await res.json();
        if (!mounted) return;
        setItems(Array.isArray(data.items) ? data.items : []);
        setError(null);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load feedback');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [authenticated]);

  const filtered = useMemo(() => {
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter(i => (i.feedback || '').toLowerCase().includes(q));
  }, [items, query]);

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow-md w-full max-w-sm">
          <h2 className="text-xl font-bold mb-4">Admin Login</h2>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            className="w-full p-2 border rounded mb-4"
          />
          <button type="submit" className="w-full bg-green-600 text-white py-2 rounded">
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">Feedback</h1>
      <p className="text-gray-600 mb-6">Latest user feedback (server-backed if Supabase is configured).</p>

      <div className="mb-6 flex items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search feedback..."
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <span className="text-sm text-gray-500">{filtered.length} shown</span>
        <button
          onClick={() => { if (typeof window !== 'undefined') { sessionStorage.removeItem('admin-authenticated'); location.reload(); } }}
          className="ml-auto text-sm px-3 py-2 border rounded hover:bg-gray-50"
        >
          Logout
        </button>
      </div>

      {loading && (
        <div className="text-gray-600">Loading...</div>
      )}
      {error && (
        <div className="text-red-600">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {filtered.map((item, idx) => (
          <div key={item.id ?? idx} className="p-4 bg-white border rounded-lg">
            <div className="text-sm text-gray-500 mb-2">{item.timestamp ? new Date(item.timestamp).toLocaleString() : '—'}</div>
            <div className="whitespace-pre-wrap">{item.feedback}</div>
            {item.email && (
              <div className="text-xs text-gray-500 mt-2">Email: {item.email}</div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}


