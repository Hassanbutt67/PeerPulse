'use client';

export default function ContentManager({ sessionId }: { sessionId: string }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">📚 Content Management</h2>
      <p className="text-gray-600">Session ID: {sessionId}</p>
      <p className="text-gray-500 mt-2">Content management features coming soon...</p>
    </div>
  );
}