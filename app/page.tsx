'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function Home() {
  const { data: session, status } = useSession();
  const isInstructor = (session?.user as { role?: string })?.role === 'INSTRUCTOR';
  const isAuthenticated = status === 'authenticated';

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-20">
        {/* User info and actions */}
        {isAuthenticated && (
          <div className="flex justify-end items-center gap-4 mb-8 flex-wrap">
            <span className="text-sm text-gray-600">
              👋 Welcome, {session?.user?.name}
            </span>
            {isInstructor && (
              <>
                <Link href="/dashboard">
                  <button className="px-4 py-2 text-sm bg-green-500 text-white hover:bg-green-600 rounded-lg transition-colors">
                    📊 Dashboard
                  </button>
                </Link>
                <Link href="/insights">
                  <button className="px-4 py-2 text-sm bg-purple-500 text-white hover:bg-purple-600 rounded-lg transition-colors">
                    🤖 AI Insights
                  </button>
                </Link>
                <Link href="/settings">
                  <button className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors">
                    🔑 Change Password
                  </button>
                </Link>
              </>
            )}
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="px-4 py-2 text-sm bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}

        <div className="text-center">
          <div className="inline-block p-3 bg-blue-100 rounded-full mb-6">
            <span className="text-4xl">🎯</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">PeerPulse</h1>
          <p className="text-xl text-gray-600 mb-2">
            The Anonymous Classroom Feedback Thermometer
          </p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
            Make your classroom more interactive, one emoji at a time
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/join">
              <button className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all cursor-pointer">
                🎓 Join Session
              </button>
            </Link>
            
            {isInstructor && (
              <Link href="/session/new">
                <button className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-xl hover:bg-blue-50 transition-all cursor-pointer">
                  👨‍🏫 Create Session
                </button>
              </Link>
            )}
          </div>

          {!isAuthenticated && (
            <div className="mt-4 space-y-2">
              <Link href="/login">
                <button className="text-blue-600 hover:underline">
                  Sign in to create sessions
                </button>
              </Link>
              <br />
              <Link href="/register">
                <button className="text-sm text-gray-600 hover:underline">
                  New instructor? Register here
                </button>
              </Link>
            </div>
          )}

          {isAuthenticated && (
            <div className="mt-4">
              <span className={`px-3 py-1 rounded-full text-sm ${
                isInstructor ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {isInstructor ? '👨‍🏫 Instructor' : '🎓 Student'}
              </span>
            </div>
          )}
        </div>

        {/* Clickable Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          {/* Card 1: Real-time Feedback */}
          <Link href="/join" className="block">
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="text-4xl mb-4">😊</div>
              <h3 className="font-semibold text-lg mb-2">Real-time Feedback</h3>
              <p className="text-gray-600">Students share their understanding instantly with emoji reactions</p>
              <div className="mt-4 text-blue-600 text-sm font-medium">
                Join a session →
              </div>
            </div>
          </Link>

          {/* Card 2: AI Insights */}
          <Link href="/insights" className="block">
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="font-semibold text-lg mb-2">AI Insights</h3>
              <p className="text-gray-600">Get intelligent analysis of confusion patterns and teaching suggestions</p>
              <div className="mt-4 text-blue-600 text-sm font-medium">
                View insights →
              </div>
            </div>
          </Link>

          {/* Card 3: Heatmap Dashboard */}
          <Link href="/insights" className="block">
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="font-semibold text-lg mb-2">Heatmap Dashboard</h3>
              <p className="text-gray-600">Visualize classroom understanding and identify problem areas instantly</p>
              <div className="mt-4 text-blue-600 text-sm font-medium">
                View dashboard →
              </div>
            </div>
          </Link>
        </div>

        {/* How It Works Section */}
        <div className="mt-20 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="font-semibold">Create or Join</h4>
              <p className="text-sm text-gray-600">Instructor creates a session, students join with a code</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-blue-600">2</span>
              </div>
              <h4 className="font-semibold">Share Feedback</h4>
              <p className="text-sm text-gray-600">Students submit anonymous emoji reactions in real-time</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-blue-600">3</span>
              </div>
              <h4 className="font-semibold">Get Insights</h4>
              <p className="text-sm text-gray-600">AI analyzes feedback and provides teaching recommendations</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-gray-500 border-t pt-8">
          <p>Built with ❤️ for COMSATS University, Sahiwal Campus</p>
          <p className="mt-1">© 2024 PeerPulse. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}