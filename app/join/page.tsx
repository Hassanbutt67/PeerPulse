'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function JoinSession() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!code.trim()) {
      setError('Please enter a session code');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/sessions/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase() })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid session code');
      }

      router.push(`/session/${data.sessionId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl">🎓</span>
          <h1 className="text-2xl font-bold">Join a Session</h1>
        </div>
        <p className="text-gray-600 mb-6">Enter the session code provided by your instructor</p>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Session Code *
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g., ABC123"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase text-center text-2xl tracking-widest font-mono"
              maxLength={6}
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Enter the 6-character code from your instructor</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? '⏳ Joining...' : '🎯 Join Session'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}