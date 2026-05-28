import React, { useState } from 'react';
import { Search, Calendar, User, Eye, Trash2, SlidersHorizontal, ArrowUpRight, HelpCircle } from 'lucide-react';
import { EvaluationResult } from '../types';

interface HistoryListProps {
  historyItems: Array<{
    id: string;
    studentName: string;
    subject: string;
    examDate: string;
    score: number;
    totalMarks: number;
    answerSheetFileName?: string;
  }>;
  onSelectId: (id: string) => void;
  onDeleteId: (id: string) => Promise<void>;
  loadingReportId?: string | null;
}

export default function HistoryList({ historyItems, onSelectId, onDeleteId, loadingReportId }: HistoryListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');

  // Compute unique subjects available for filtering
  const subjects = ['all', ...Array.from(new Set(historyItems.map(item => item.subject || 'General')))];

  const filteredItems = historyItems.filter(item => {
    const sName = item.studentName?.toLowerCase() || '';
    const sSubject = item.subject?.toLowerCase() || '';
    const sTerm = searchTerm.toLowerCase();

    const matchesSearch = sName.includes(sTerm) || sSubject.includes(sTerm);
    const matchesFilter = subjectFilter === 'all' || (item.subject || 'General') === subjectFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-left">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 tracking-tight flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          Saved Evaluations
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">Browse past annotated submissions and pedagogical stats</p>
      </div>

      {/* Controls & Search */}
      <div className="flex flex-col sm:flex-row gap-4 mt-5 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name or subject topics..."
            className="w-full text-xs pl-9.5 pr-4 py-2.5 bg-gray-50/50 hover:bg-gray-50 focus:bg-white rounded-lg border border-gray-200 outline-none focus:border-gray-900 transition-all font-sans placeholder-gray-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gray-400" />
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-gray-50/50 hover:bg-gray-50 rounded-lg border border-gray-200 text-gray-600 outline-none cursor-pointer focus:border-gray-900"
          >
            {subjects.map((sub, idx) => (
              <option key={idx} value={sub}>
                {sub === 'all' ? 'All Subjects' : sub}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Reports */}
      {filteredItems.length === 0 ? (
        <div className="border border-dashed border-gray-100 bg-gray-50/30 rounded-xl py-12 text-center flex flex-col items-center justify-center font-sans">
          <HelpCircle className="w-8 h-8 text-gray-300 mb-2" />
          <p className="text-xs font-semibold text-gray-800">No Evaluations Found</p>
          <p className="text-[10px] text-gray-500 max-w-[200px] leading-normal mx-auto mt-0.5">
            Try adjusting your search criteria, or submit a new set of test papers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const pct = Math.round((item.score / item.totalMarks) * 100);

            return (
              <div
                key={item.id}
                className="group relative border border-gray-100 rounded-xl p-4.5 bg-white hover:border-gray-900 hover:shadow-xs hover:bg-gray-50/10 transition-all duration-300 text-left flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[10px] font-mono text-gray-400 font-medium">{item.examDate}</span>
                    <span className={`px-2 py-0.5 rounded-full font-mono font-bold text-[10px] ${
                      pct >= 85 ? 'bg-emerald-50 text-emerald-800' : pct >= 65 ? 'bg-blue-50 text-blue-800' : 'bg-amber-50 text-amber-800'
                    }`}>
                      {pct}%
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-gray-800 tracking-tight mt-2 truncate group-hover:text-gray-900">
                    {item.studentName}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium truncate mt-0.5">{item.subject}</p>

                  <div className="text-[11px] text-gray-400 font-sans mt-3">
                    Score: <span className="font-semibold text-gray-700">{item.score}/{item.totalMarks} points</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-t border-gray-100 pt-3 mt-4">
                  <button
                    onClick={() => onSelectId(item.id)}
                    disabled={loadingReportId === item.id}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-gray-950 text-white font-medium text-[11px] hover:bg-gray-800 active:scale-98/100 flex items-center justify-center gap-1 cursor-pointer disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    {loadingReportId === item.id ? (
                      <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        Inspect Details
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => onDeleteId(item.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all cursor-pointer border border-transparent hover:border-red-100"
                    title="Delete record from local database"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
