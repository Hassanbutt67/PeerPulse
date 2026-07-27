'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Simple loading component
function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

export default function InsightsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not instructor
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'INSTRUCTOR') {
      router.push('/');
    }
  }, [status, session, router]);

  // Fetch all sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch('/api/sessions');
        if (!res.ok) throw new Error('Failed to fetch sessions');
        const data = await res.json();
        setSessions(data);
        if (data.length > 0) {
          setSelectedSession(data[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
      }
    };

    if (session?.user?.role === 'INSTRUCTOR') {
      fetchSessions();
    }
  }, [session]);

  // Load existing insights
  const loadInsights = async () => {
    if (!selectedSession) return;
    
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/insights?sessionId=${selectedSession}`);
      
      if (res.status === 404) {
        setInsights(null);
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load insights');
      setInsights(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate insights for selected session
  const generateInsights = async () => {
    if (!selectedSession) return;
    
    setGenerating(true);
    setError('');
    setInsights(null);

    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selectedSession })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate insights');
      }

      setInsights(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setGenerating(false);
    }
  };

  // Load insights when session changes
  useEffect(() => {
    if (selectedSession) {
      loadInsights();
    }
  }, [selectedSession]);

  // Show loading while checking auth
  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  // If not instructor, show nothing
  if (!session || session.user?.role !== 'INSTRUCTOR') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">🤖 AI Insights</h1>
            <p className="text-gray-600">Get intelligent recommendations based on student feedback</p>
          </div>
          <Link href="/dashboard">
            <button className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors">
              ← Back to Dashboard
            </button>
          </Link>
        </div>

        {/* Session Selector */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Session
              </label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.title} ({session.code}) - {session.feedbacks?.length || 0} feedbacks
                  </option>
                ))}
                {sessions.length === 0 && (
                  <option value="">No sessions available</option>
                )}
              </select>
            </div>
            <button
              onClick={generateInsights}
              disabled={generating || !selectedSession || sessions.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {generating ? '⏳ Generating...' : '🔮 Generate Insights'}
            </button>
            <button
              onClick={loadInsights}
              disabled={loading || !selectedSession}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
            >
              {loading ? '⏳ Loading...' : '🔄 Refresh'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
            ❌ {error}
          </div>
        )}

        {/* No Insights State */}
        {!insights && !loading && !generating && !error && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🔮</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Insights Generated Yet</h3>
            <p className="text-gray-500">
              Select a session and click "Generate Insights" to get AI-powered recommendations
              based on student feedback.
            </p>
            {sessions.length === 0 && (
              <div className="mt-4">
                <Link href="/session/new">
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Create Your First Session
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Generating State */}
        {generating && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Analyzing feedback and generating insights...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading insights...</p>
          </div>
        )}

        {/* Insights Display */}
        {insights && (
          <div className="space-y-6">
            {/* Summary */}
            {insights.summary && (
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <p className="text-gray-700 text-lg">{insights.summary}</p>
              </div>
            )}

            {/* Engagement Score */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4">📊 Engagement Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">
                    {insights.engagementScore?.overall || 0}%
                  </div>
                  <div className="text-sm text-gray-600">Overall Engagement</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {insights.studentSentiment?.positive || 0}%
                  </div>
                  <div className="text-sm text-gray-600">Positive</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-600">
                    {insights.studentSentiment?.neutral || 0}%
                  </div>
                  <div className="text-sm text-gray-600">Neutral</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-3xl font-bold text-red-600">
                    {insights.studentSentiment?.negative || 0}%
                  </div>
                  <div className="text-sm text-gray-600">Needs Attention</div>
                </div>
              </div>
            </div>

            {/* Confidence Score */}
            {insights.confidenceScore !== undefined && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold mb-4">📊 Analysis Confidence</h2>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full transition-all duration-1000"
                        style={{ width: `${insights.confidenceScore || 50}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">
                    {insights.confidenceScore || 50}%
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {insights.confidenceScore > 70 
                    ? '✅ High confidence - Based on sufficient feedback data'
                    : insights.confidenceScore > 40
                    ? '⚠️ Medium confidence - More feedback would improve accuracy'
                    : '📝 Low confidence - Consider collecting more feedback'}
                </p>
              </div>
            )}

            {/* Confusion Hotspots */}
            {insights.confusionHotspots && insights.confusionHotspots.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold mb-4">🔴 Confusion Hotspots</h2>
                <div className="space-y-3">
                  {insights.confusionHotspots.map((hotspot: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                      <span className="text-xl">
                        {hotspot.severity === 'high' ? '🚨' : 
                         hotspot.severity === 'medium' ? '⚠️' : 'ℹ️'}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium">{hotspot.topic}</p>
                        <p className="text-sm text-gray-600">{hotspot.suggestion}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {hotspot.studentCount} students reported confusion
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Teaching Recommendations */}
            {insights.teachingSuggestions && insights.teachingSuggestions.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold mb-4">💡 Teaching Recommendations</h2>
                <ul className="space-y-2">
                  {insights.teachingSuggestions.map((suggestion: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700 p-2 hover:bg-gray-50 rounded-lg">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Review Recommendations */}
            {insights.reviewRecommendations && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold mb-4">📚 Review Recommendations</h2>
                
                {insights.reviewRecommendations.criticalTopics && insights.reviewRecommendations.criticalTopics.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-700 mb-2">Critical Topics to Review:</h3>
                    <div className="flex flex-wrap gap-2">
                      {insights.reviewRecommendations.criticalTopics.map((topic: string, index: number) => (
                        <span key={index} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {insights.reviewRecommendations.suggestedActivities && insights.reviewRecommendations.suggestedActivities.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Suggested Activities:</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      {insights.reviewRecommendations.suggestedActivities.map((activity: string, index: number) => (
                        <li key={index}>{activity}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Action Items */}
            {insights.actionItems && insights.actionItems.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold mb-4">✅ Action Items</h2>
                <ul className="space-y-2">
                  {insights.actionItems.map((item: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg">
                      <span className="text-blue-500 mt-1">☐</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Export Options */}
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => window.print()}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                🖨️ Print Report
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(insights, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `insights-${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                📥 Download Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}