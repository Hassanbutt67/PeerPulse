'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not instructor
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if ((session as any)?.user?.role !== 'INSTRUCTOR') {
      router.push('/');
    }
  }, [status, session, router]);

  // Fetch sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch('/api/sessions');
        const data = await res.json();
        setSessions(data);
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    if ((session as any)?.user?.role === 'INSTRUCTOR') {
      fetchSessions();
    }
  }, [session]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session || (session as any).user?.role !== 'INSTRUCTOR') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">📊 Dashboard</h1>
            <p className="text-gray-600">Welcome back, {session?.user?.name ?? 'Instructor'}</p>
          </div>
          <Link href="/session/new">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
              + New Session
            </button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-2xl font-bold text-blue-600">{sessions.length}</div>
            <div className="text-sm text-gray-600">Total Sessions</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-2xl font-bold text-green-600">0</div>
            <div className="text-sm text-gray-600">Active Now</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-2xl font-bold text-purple-600">0</div>
            <div className="text-sm text-gray-600">Total Feedback</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-2xl font-bold text-orange-600">0%</div>
            <div className="text-sm text-gray-600">Engagement Rate</div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Your Sessions</h2>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">📭</div>
              <p>No sessions created yet</p>
              <Link href="/session/new">
                <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Create Your First Session
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session: any) => (
                <Link key={session.id} href={`/session/${session.id}`}>
                  <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{session.title}</h3>
                        <p className="text-sm text-gray-600">{session.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-gray-500">Code: {session.code}</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            session.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {session.isActive ? '🟢 Active' : '🔴 Ended'}
                          </span>
                          <span className="text-gray-500">
                            {session.feedbacks?.length || 0} feedbacks
                          </span>
                        </div>
                      </div>
                      <div className="text-blue-600">
                        View →
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}