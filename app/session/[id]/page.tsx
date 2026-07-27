'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function LiveSession() {
  const params = useParams();
  const sessionId = params?.id as string;
  
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'feedback' | 'content'>('feedback');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'MATERIAL',
    description: '',
    content: '',
    file: null as File | null,
    fileName: '',
    fileSize: 0,
    fileType: ''
  });
  const [contents, setContents] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [contentError, setContentError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadingContentId, setUploadingContentId] = useState<string | null>(null);

  const isInstructor = session?.user?.role === 'INSTRUCTOR';

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Invalid Session</h2>
          <p className="text-gray-600">Session ID is missing.</p>
          <Link href="/">
            <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Go Home
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Fetch session data
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (!res.ok) throw new Error('Failed to fetch session');
        const data = await res.json();
        setSessionData(data);
        if (data.contents) {
          setContents(data.contents);
        }
      } catch (error) {
        console.error('Failed to fetch session:', error);
        setContentError('Failed to load session data');
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [sessionId]);

  // Handle feedback
  const handleFeedback = async (feedback: { emoji: string; comment: string }) => {
    if (isInstructor) {
      alert('Instructors cannot submit feedback on their own sessions.');
      return;
    }

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          emoji: feedback.emoji,
          comment: feedback.comment
        })
      });

      if (res.ok) {
        setFeedbackSubmitted(true);
        setTimeout(() => setFeedbackSubmitted(false), 3000);
      }
    } catch (error) {
      console.error('Feedback submission failed:', error);
    }
  };

  // Handle content submission with file upload
  const handleContentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setContentError('');

    try {
      const res = await fetch(`/api/sessions/${sessionId}/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          type: formData.type,
          description: formData.description,
          content: formData.content
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add content');
      }

      if (formData.file) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', formData.file);
        uploadFormData.append('contentId', data.id);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData
        });

        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) {
          throw new Error(uploadData.error || 'File upload failed');
        }

        data.fileUrl = uploadData.fileUrl;
        data.fileName = formData.file.name;
        data.fileSize = formData.file.size;
        data.fileType = formData.file.type;
      }

      setContents([data, ...contents]);
      setShowForm(false);
      setFormData({
        title: '',
        type: 'MATERIAL',
        description: '',
        content: '',
        file: null,
        fileName: '',
        fileSize: 0,
        fileType: ''
      });
    } catch (err: any) {
      setContentError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle file upload for existing content
  const handleFileUpload = async (contentId: string, file: File) => {
    setUploading(true);
    setUploadingContentId(contentId);
    setContentError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('contentId', contentId);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setContents(contents.map(c => 
        c.id === contentId ? { 
          ...c, 
          fileUrl: data.fileUrl, 
          fileName: file.name, 
          fileSize: file.size,
          fileType: file.type
        } : c
      ));

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (err: any) {
      setContentError(err.message);
    } finally {
      setUploading(false);
      setUploadingContentId(null);
    }
  };

  // Delete content
  const handleDeleteContent = async (contentId: string) => {
    if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      return;
    }

    setContentError('');
    
    try {
      const res = await fetch(`/api/sessions/${sessionId}/content?contentId=${contentId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete content');
      }

      setContents(contents.filter(c => c.id !== contentId));
      
      setContentError('✅ Content deleted successfully!');
      setTimeout(() => setContentError(''), 3000);
      
    } catch (err: any) {
      setContentError(err.message);
    }
  };

  // Download file
  const downloadFile = (fileUrl: string, fileName: string) => {
    window.open(fileUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">🔴</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Session Not Found</h2>
          <p className="text-gray-600">This session may have ended or doesn't exist.</p>
          <Link href="/">
            <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Go Home
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Session Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{sessionData.title}</h1>
              <p className="text-gray-600 mt-1">{sessionData.description}</p>
              <div className="flex items-center gap-3 mt-3">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  sessionData.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {sessionData.isActive ? '🟢 Live' : '🔴 Ended'}
                </span>
                <span className="text-sm text-gray-500">
                  Code: <span className="font-mono font-bold">{sessionData.code}</span>
                </span>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  isInstructor ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                }`}>
                  {isInstructor ? '👨‍🏫 Instructor' : '🎓 Student'}
                </span>
              </div>
            </div>
            <Link href="/">
              <button className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors">
                ← Exit
              </button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'feedback'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            😊 Feedback
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'content'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📚 Content
          </button>
        </div>

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {isInstructor ? (
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Instructor View</h3>
                  <p className="text-gray-600">Students can submit feedback below.</p>
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Feedback:</p>
                    <p className="text-3xl font-bold text-blue-600">{sessionData.feedbacks?.length || 0}</p>
                  </div>
                </div>
              ) : feedbackSubmitted ? (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-8 text-center">
                  <div className="text-6xl mb-2">✅</div>
                  <h3 className="text-xl font-semibold text-green-700">Thank You!</h3>
                  <p className="text-green-600">Your feedback has been submitted anonymously</p>
                </div>
              ) : (
                <div className="p-6 bg-white rounded-xl shadow-lg">
                  <h3 className="text-lg font-semibold text-center mb-4">
                    How are you feeling about this lecture?
                  </h3>
                  <div className="grid grid-cols-5 gap-4 max-w-2xl mx-auto">
                    {[
                      { emoji: '🤯', key: 'AMAZING' },
                      { emoji: '✅', key: 'GOT_IT' },
                      { emoji: '😕', key: 'CONFUSED' },
                      { emoji: '😵', key: 'LOST' },
                      { emoji: '😴', key: 'BORED' }
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => handleFeedback({ emoji: item.key, comment: '' })}
                        className="flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 hover:scale-110 transition-all"
                      >
                        <span className="text-4xl">{item.emoji}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-semibold text-lg mb-4">Session Info</h3>
                <p className="font-mono text-2xl font-bold text-blue-600">{sessionData.code}</p>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-gray-600">Total Feedback:</p>
                  <p className="text-2xl font-bold">{sessionData.feedbacks?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            {contentError && (
              <div className={`rounded-lg p-3 ${
                contentError.includes('✅') 
                  ? 'bg-green-50 border border-green-200 text-green-700' 
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {contentError}
              </div>
            )}

            {/* Instructor: Add Content Button */}
            {isInstructor && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {showForm ? '✕ Cancel' : '+ Add Content'}
              </button>
            )}

            {/* Add Content Form - Only MATERIAL and ANNOUNCEMENT */}
            {showForm && isInstructor && (
              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-200">
                <h3 className="font-semibold mb-4">Add New Content</h3>
                <form onSubmit={handleContentSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="MATERIAL">📚 Material</option>
                        <option value="ANNOUNCEMENT">📢 Announcement</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none h-20"
                      placeholder="Brief description..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content Details</label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none h-32"
                      placeholder="Enter the content details..."
                    />
                  </div>

                  {/* FILE UPLOAD */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload File (Optional)
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer flex-1">
                        <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                          formData.fileName ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-500'
                        }`}>
                          <div className="text-3xl mb-1">
                            {formData.fileName ? '✅' : '📁'}
                          </div>
                          <p className="text-sm text-gray-600">
                            {formData.fileName ? formData.fileName : 'Click to select a file from your device'}
                          </p>
                          <p className="text-xs text-gray-400">
                            PDF, DOCX, images, ZIP (Max 50MB)
                          </p>
                          {formData.fileName && (
                            <p className="text-xs text-green-600 mt-1">
                              {(formData.fileSize / 1024).toFixed(1)} KB
                            </p>
                          )}
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setFormData({ 
                                ...formData, 
                                file: file,
                                fileName: file.name,
                                fileSize: file.size,
                                fileType: file.type
                              });
                            }
                          }}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.txt,.zip,.rar"
                        />
                      </label>
                      {formData.fileName && (
                        <button
                          type="button"
                          onClick={() => setFormData({ 
                            ...formData, 
                            file: null,
                            fileName: '',
                            fileSize: 0,
                            fileType: ''
                          })}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          ✕ Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? 'Adding...' : 'Add Content'}
                  </button>
                </form>
              </div>
            )}

            {/* Content List */}
            {contents.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="text-4xl mb-4">📭</div>
                <p className="text-gray-500">No content added yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {contents.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.type === 'MATERIAL' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {item.type === 'MATERIAL' ? '📚 Material' : '📢 Announcement'}
                          </span>
                          {item.fileUrl && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                              📎 File attached
                            </span>
                          )}
                          {uploading && uploadingContentId === item.id && (
                            <span className="text-sm text-blue-600">⏳ Uploading...</span>
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-lg">{item.title}</h3>
                        {item.description && (
                          <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                        )}
                        {item.content && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm whitespace-pre-wrap text-gray-700">{item.content}</p>
                          </div>
                        )}

                        {/* File Upload for Instructor */}
                        {isInstructor && (
                          <div className="mt-4">
                            {item.fileUrl ? (
                              <div className="flex items-center gap-3 flex-wrap">
                                <button
                                  onClick={() => downloadFile(item.fileUrl, item.fileName || 'download')}
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-2"
                                >
                                  📥 Download {item.fileName || 'File'}
                                </button>
                                <span className="text-xs text-gray-500">
                                  {item.fileSize ? `${(item.fileSize / 1024).toFixed(1)} KB` : ''}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {item.fileType || ''}
                                </span>
                                <label className="cursor-pointer">
                                  <span className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 cursor-pointer">
                                    🔄 Replace
                                  </span>
                                  <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleFileUpload(item.id, file);
                                    }}
                                    disabled={uploading}
                                  />
                                </label>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 flex-wrap">
                                <label className="cursor-pointer">
                                  <span className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm inline-block">
                                    📤 Upload File
                                  </span>
                                  <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleFileUpload(item.id, file);
                                    }}
                                    disabled={uploading}
                                  />
                                </label>
                                <span className="text-xs text-gray-500">
                                  PDF, DOCX, images, ZIP
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Student View - Just download */}
                        {!isInstructor && item.fileUrl && (
                          <div className="mt-4">
                            <button
                              onClick={() => downloadFile(item.fileUrl, item.fileName || 'download')}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
                            >
                              📥 Download {item.fileName || 'Material'}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Delete Button for Instructor */}
                      {isInstructor && (
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleDeleteContent(item.id)}
                            className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1"
                            title="Delete this content"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}