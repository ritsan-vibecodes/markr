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
  Plus
} from 'lucide-react';
import EvaluationForm from './components/EvaluationForm';
import VisualMarker from './components/VisualMarker';
import EvaluationReport from './components/EvaluationReport';
import ProgressDashboard from './components/ProgressDashboard';
import HistoryList from './components/HistoryList';
import ClassroomImport from './components/ClassroomImport';
import { EvaluationResult } from './types';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'evaluate' | 'history' | 'analytics'>('evaluate');
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'report' | 'paper'>('report');

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

  // Load history summaries & performance logs on initial mount
  useEffect(() => {
    fetchHistorySummaries();
    fetchPerformanceAnalytics();
  }, []);

  const fetchHistorySummaries = async () => {
    try {
      setErrorAdvisory(null);
      const res = await fetch('/api/history');
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
      const res = await fetch('/api/analytics');
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
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`/api/history/${id}`);
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
      const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
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

  return (
    <div className="min-h-screen bg-gray-50/50 text-gray-900 flex flex-col font-sans">
      {/* Dynamic Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-5.6 h-5.6" />
            </div>
            <div>
              <h1 className="text-md font-bold tracking-tight text-gray-900 flex items-center gap-1.5">
                GradeLens
              </h1>
              <p className="text-[10px] text-gray-400 font-mono font-medium tracking-wide">
                PEDAGOGICAL EVALUATOR
              </p>
            </div>
          </div>

          {/* Quick Stats & Controls */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-mono text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                VLM COORDINATES ENGINE: ON
              </span>
            </div>

            {/* Main view navigation cards */}
            <nav className="flex space-x-1 bg-gray-100 p-0.5 rounded-xl">
              <button
                onClick={() => setActiveTab('evaluate')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'evaluate'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Evaluator Desk
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'history'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Saved Records ({historyItems.length})
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Progress Analytics
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
                Import from Google Classroom & Drive
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
                        Current Inspect Desk
                      </span>
                      <h2 className="text-sm font-bold text-gray-800 truncate max-w-xs sm:max-w-md">
                        {activeReport.studentName} — {activeReport.subject}
                      </h2>
                    </div>

                    <div className="flex bg-gray-100 p-0.5 rounded-xl self-start sm:self-auto">
                      <button
                        onClick={() => setActiveWorkspaceTab('report')}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                          activeWorkspaceTab === 'report'
                            ? 'bg-white text-gray-900 shadow-xs'
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        Analytical Report
                      </button>
                      <button
                        onClick={() => setActiveWorkspaceTab('paper')}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                          activeWorkspaceTab === 'paper'
                            ? 'bg-white text-gray-900 shadow-xs'
                            : 'text-gray-500 hover:text-gray-900'
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
                  <h3 className="text-sm font-bold text-gray-800">Operational Desk Idle</h3>
                  <p className="text-xs text-gray-500 mt-2 max-w-sm leading-relaxed">
                    Upload an exam Question Paper alongside a Student Answer Sheet on the left, then click evaluated trigger to run visual grading models.
                  </p>
                  {historyItems.length > 0 && (
                    <div className="mt-6">
                      <div className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-3">
                        Or jump to a saved record
                      </div>
                      <div className="flex flex-wrap justify-center gap-2">
                        {historyItems.slice(0, 3).map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleSelectHistoryId(item.id)}
                            className="bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-gray-700 font-semibold flex items-center gap-2 cursor-pointer"
                          >
                            <span>{item.studentName}</span>
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
            &copy; {new Date().getFullYear()} AI Evaluation Grader — Real-Time Spatial Marks Dashboard.
          </div>
          <div className="flex items-center gap-4 text-[11px] text-gray-400 font-mono">
            <span>DATABASE: LOCAL PERSISTENCE</span>
            <span>API RE-ESTABLISHMENT: AUTO</span>
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
