import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Layers,
  GraduationCap,
  Calendar,
  LineChart as LineChartIcon,
  AlertCircle,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  X,
  Plus,
  Shield,
  Lock,
  LogOut
} from 'lucide-react';
import EvaluationForm from './components/EvaluationForm';
import VisualMarker from './components/VisualMarker';
import EvaluationReport from './components/EvaluationReport';
import ProgressDashboard from './components/ProgressDashboard';
import HistoryList from './components/HistoryList';
import ClassroomImport from './components/ClassroomImport';
import { EvaluationResult } from './types';
import { auth, googleSignIn, logout } from './lib/firebase';
import { User, onAuthStateChanged } from 'firebase/auth';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'evaluate' | 'history' | 'analytics'>('evaluate');
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'report' | 'paper'>('report');

  // User Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  // Google Classroom integration states
  const [showClassroomModal, setShowClassroomModal] = useState(false);
  const [importedClassroomData, setImportedClassroomData] = useState<any>(null);

  // Core States
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [activeReport, setActiveReport] = useState<EvaluationResult | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>({
    subjects: [],
    stats: { totalEvaluations: 0, averagePercentage: 0, perfectScores: 0 },
    timeline: []
  });

  // Loaders & Errors
  const [loading, setLoading] = useState(false);
  const [loadingHistoryItem, setLoadingHistoryItem] = useState<string | null>(null);
  const [errorAdvisory, setErrorAdvisory] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setAuthLoading(true);
    try {
      await googleSignIn();
    } catch (err: any) {
      console.error(err);
      alert('Authentication failed: ' + err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setActiveReport(null);
      setHistoryItems([]);
      setAnalyticsData({
        subjects: [],
        stats: { totalEvaluations: 0, averagePercentage: 0, perfectScores: 0 },
        timeline: []
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  // Load history summaries & performance logs whenever user state changes
  useEffect(() => {
    if (user) {
      fetchHistorySummaries();
      fetchPerformanceAnalytics();
    }
  }, [user]);

  const fetchHistorySummaries = async () => {
    try {
      setErrorAdvisory(null);
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const headers: Record<string, string> = {};
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/history', { headers });
      if (!res.ok) throw new Error('Could not fetch past exam records');
      const data = await res.json();
      setHistoryItems(data);
    } catch (err: any) {
      console.error(err);
      // Don't show major error block for standard initial silent failure
    }
  };

  const fetchPerformanceAnalytics = async () => {
    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const headers: Record<string, string> = {};
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/analytics', { headers });
      if (!res.ok) throw new Error('Could not compute historical analytics data');
      const data = await res.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Perform full visual & evaluation grading
  const handleEvaluatePaper = async (payload: {
    questionPaperText: string;
    questionPaperImgMeta: { data: string; mimeType: string; fileName: string } | null;
    answerSheetImgMeta: { data: string; mimeType: string; fileName: string } | null;
    answerSheetText: string;
    subjectOverride: string;
    studentNameOverride: string;
  }) => {
    setLoading(true);
    setErrorAdvisory(null);
    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errDetail = await res.json();
        throw new Error(errDetail.details || errDetail.error || 'AI process execution failed');
      }

      const report: EvaluationResult = await res.json();
      setActiveReport(report);
      setActiveWorkspaceTab('report');

      // Refresh listings
      await fetchHistorySummaries();
      await fetchPerformanceAnalytics();
    } catch (err: any) {
      setErrorAdvisory(err.message || 'The Gemini server timed out or failed to evaluate.');
    } finally {
      setLoading(false);
    }
  };

  // Select item from history and load complete visual overlays (with base64 content)
  const handleSelectHistoryId = async (id: string) => {
    setLoadingHistoryItem(id);
    setErrorAdvisory(null);
    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const headers: Record<string, string> = {};
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch(`/api/history/${id}`, { headers });
      if (!res.ok) throw new Error('Failed to retrieve full exam coordinates');
      const fullReport: EvaluationResult = await res.json();
      setActiveReport(fullReport);
      setActiveWorkspaceTab('report');
      // Slide view focus
      setActiveTab('evaluate');
    } catch (err: any) {
      setErrorAdvisory(err.message);
    } finally {
      setLoadingHistoryItem(null);
    }
  };

  // Delete appraisal record
  const handleDeleteHistoryId = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this evaluated submission?')) {
      return;
    }
    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const headers: Record<string, string> = {};
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch(`/api/history/${id}`, { 
        method: 'DELETE',
        headers
      });
      if (!res.ok) throw new Error('Failed to remove evaluation');

      // If active item deleted, close visual inspect window
      if (activeReport?.id === id) {
        setActiveReport(null);
      }

      await fetchHistorySummaries();
      await fetchPerformanceAnalytics();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-gray-400 font-mono tracking-wider uppercase font-bold">Securing Study Workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl border border-gray-100 shadow-xl p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mx-auto border border-amber-100/50">
            <Lock className="w-7 h-7" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
              Markr Workspace Locked
            </h1>
            <p className="text-xs text-gray-500 leading-relaxed">
              Your exam sheets, question criteria, and marked errors are isolated in a secure, zero-trust container.
              Please authenticate below to safely load your private study desk and history log.
            </p>
          </div>

          <button
            onClick={handleSignIn}
            disabled={authLoading}
            className="w-full bg-gray-950 hover:bg-gray-900 text-white font-bold text-xs py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            {authLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></span>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
            )}
            Sign In with Google Account
          </button>

          <div className="pt-2 text-[10px] text-gray-400 font-mono flex items-center justify-center gap-1.5 uppercase tracking-widest font-extrabold">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Zero-Trust Privacy Protection</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 text-gray-900 flex flex-col font-sans">
      {/* Dynamic Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-950 rounded-xl flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-5.5 h-5.5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-gray-900 flex items-center gap-1">
                Markr
              </h1>
              <p className="text-[9px] text-gray-400 font-mono font-bold tracking-wider">
                STUDY COMPANION & SELF-EVALUATOR
              </p>
            </div>
          </div>

          {/* Quick Stats & Controls */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2.5 border-r border-gray-100 pr-4">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="w-7 h-7 rounded-full border border-gray-200 shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-full flex items-center justify-center">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                  </div>
                )}
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-[10px] font-bold text-gray-800 leading-normal">
                    {user.displayName || "Student"}
                  </span>
                  <span className="text-[7.5px] font-mono font-bold text-emerald-600 leading-none uppercase tracking-wider">
                    SECURED
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  title="Sign out of Markr"
                  className="p-1 hover:bg-gray-105 rounded-lg text-gray-400 hover:text-red-500 transition-colors cursor-pointer ml-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full font-mono text-[9px] border border-amber-100/50">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                VLM ANNOTATION MODEL: READY
              </span>
            </div>

            {/* Main view navigation cards */}
            <nav className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('evaluate')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'evaluate'
                    ? 'bg-white text-gray-950 shadow-xs'
                    : 'text-gray-500 hover:text-gray-950'
                }`}
              >
                Self-Evaluation Desk
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-white text-gray-950 shadow-xs'
                    : 'text-gray-500 hover:text-gray-950'
                }`}
              >
                My Saved Papers ({historyItems.length})
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-white text-gray-950 shadow-xs'
                    : 'text-gray-500 hover:text-gray-950'
                }`}
              >
                My Study Analytics
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Error Advisory Block */}
        {errorAdvisory && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4.5 mb-6 text-left flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5 animate-bounce" />
            <div className="space-y-1">
              <h3 className="text-xs font-extrabold text-red-900 uppercase tracking-widest font-mono">
                Evaluation Incident Intercepted
              </h3>
              <p className="text-xs text-red-700 leading-normal font-medium">{errorAdvisory}</p>
              <p className="text-[10px] text-red-500/80 mt-1 leading-normal font-sans">
                Please verify that your **Gemini API Key** is properly saved in the **Settings &gt; Secrets** panel.
              </p>
            </div>
            <button
              onClick={() => setErrorAdvisory(null)}
              className="ml-auto text-red-400 hover:text-red-700 p-1 bg-white/50 hover:bg-white rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dynamic Display Router */}
        {activeTab === 'evaluate' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            {/* Input Form Column */}
            <div className="xl:col-span-5 space-y-4">
              <button
                onClick={() => setShowClassroomModal(true)}
                className="w-full py-3 px-4 rounded-xl border border-dashed border-gray-250 hover:border-gray-950 bg-white hover:bg-gray-50/50 text-gray-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs hover:shadow-sm"
              >
                <div className="w-5 h-5 bg-emerald-600 rounded flex items-center justify-center text-white font-serif font-extrabold text-[10px] shadow-xs">
                  G
                </div>
                Self-Import My Coursework (Classroom & Drive)
              </button>

              <EvaluationForm
                onEvaluate={handleEvaluatePaper}
                loading={loading}
                importedData={importedClassroomData}
              />
            </div>

            {/* Evaluation Results Monitor Column */}
            <div className="xl:col-span-7 space-y-6">
              {activeReport ? (
                <div className="space-y-6">
                  {/* Results Sub-Tab Controller */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-left">
                      <span className="text-[10px] font-mono font-extrabold text-gray-400 uppercase tracking-wider">
                        Active Study Workspace
                      </span>
                      <h2 className="text-sm font-bold text-gray-800 truncate max-w-xs sm:max-w-md">
                        {activeReport.subject} — {activeReport.studentName}
                      </h2>
                    </div>

                    <div className="flex bg-gray-100 p-0.5 rounded-xl self-start sm:self-auto">
                      <button
                        onClick={() => setActiveWorkspaceTab('report')}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          activeWorkspaceTab === 'report'
                            ? 'bg-white text-gray-950 shadow-xs'
                            : 'text-gray-500 hover:text-gray-950'
                        }`}
                      >
                        Self-Evaluation Report
                      </button>
                      <button
                        onClick={() => setActiveWorkspaceTab('paper')}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          activeWorkspaceTab === 'paper'
                            ? 'bg-white text-gray-950 shadow-xs'
                            : 'text-gray-500 hover:text-gray-950'
                        }`}
                      >
                        Interactive Mistakes Map
                      </button>
                    </div>
                  </div>

                  {/* Nested Workspace Tabs */}
                  {activeWorkspaceTab === 'report' ? (
                    <EvaluationReport evaluation={activeReport} />
                  ) : (
                    <VisualMarker
                      answerSheetBase64={activeReport.answerSheetBase64}
                      answerSheetFileName={activeReport.answerSheetFileName}
                      mistakes={activeReport.mistakes}
                    />
                  )}
                </div>
              ) : (
                <div className="border border-dashed border-gray-200 rounded-3xl bg-white p-12 text-center min-h-[50vh] flex flex-col items-center justify-center shadow-xs">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 mb-4 animate-pulse">
                    <Sparkles className="w-6 h-6 text-yellow-400" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-800">Study Desk Empty</h3>
                  <p className="text-xs text-gray-500 mt-2 max-w-sm leading-relaxed">
                    Upload your exam criteria or guidelines alongside your written coordinates answer paper on the left, then click analyze to run self-checks.
                  </p>
                  {historyItems.length > 0 && (
                    <div className="mt-6">
                      <div className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-3">
                        Or jump to a saved evaluation
                      </div>
                      <div className="flex flex-wrap justify-center gap-2">
                        {historyItems.slice(0, 3).map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleSelectHistoryId(item.id)}
                            className="bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-gray-700 font-semibold flex items-center gap-2 cursor-pointer"
                          >
                            <span>{item.subject}</span>
                            <ChevronRight className="w-3 h-3 text-gray-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <HistoryList
            historyItems={historyItems}
            onSelectId={handleSelectHistoryId}
            onDeleteId={handleDeleteHistoryId}
            loadingReportId={loadingHistoryItem}
          />
        )}

        {activeTab === 'analytics' && (
          <ProgressDashboard
            analyticsData={analyticsData}
            onSelectReportId={handleSelectHistoryId}
          />
        )}
      </main>

      {/* Modern Humble Sandbox Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Markr study companion. Built in AI Studio for student self-checks.
          </div>
          <div className="flex items-center gap-4 text-[11px] text-gray-400 font-mono">
            <span>PERSISTENT EXAMS STORAGE</span>
            <span>VLM ANNOTATOR: ACTIVE</span>
          </div>
        </div>
      </footer>

      {showClassroomModal && (
        <ClassroomImport
          onClose={() => setShowClassroomModal(false)}
          onImport={(data) => setImportedClassroomData(data)}
        />
      )}
    </div>
  );
}
