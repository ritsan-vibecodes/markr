import React, { useState } from 'react';
import { AlertTriangle, HelpCircle, Check, Eye, BadgeCheck, FileText, CheckCircle2, RotateCcw, Lightbulb, Flame } from 'lucide-react';
import { MistakeItem } from '../types';

interface VisualMarkerProps {
  answerSheetBase64: string | null | undefined;
  answerSheetFileName?: string;
  mistakes: MistakeItem[];
}

export default function VisualMarker({ answerSheetBase64, answerSheetFileName, mistakes }: VisualMarkerProps) {
  const [selectedMistake, setSelectedMistake] = useState<MistakeItem | null>(null);
  const [hoveredMistake, setHoveredMistake] = useState<MistakeItem | null>(null);
  const [resolvedMistakes, setResolvedMistakes] = useState<Record<string, boolean>>({});
  const [pdfViewMode, setPdfViewMode] = useState<'annotated' | 'native'>('annotated');

  // Filter mistakes that have valid image coordinates
  const visualMistakes = mistakes.filter(m => Array.isArray(m.box_2d) && m.box_2d.length === 4);

  const getSeverityStyle = (severity: string, isResolved = false) => {
    if (isResolved) {
      return {
        border: 'border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        glow: 'shadow-[0_0_12px_rgba(16,185,129,0.35)]'
      };
    }

    switch (severity?.toLowerCase()) {
      case 'high':
        return {
          border: 'border-red-500 bg-red-500/10 hover:bg-red-500/20 text-red-700',
          badge: 'bg-red-100 text-red-800 border-red-200',
          glow: 'shadow-[0_0_12px_rgba(239,68,68,0.35)]'
        };
      case 'medium':
        return {
          border: 'border-amber-500 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700',
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          glow: 'shadow-[0_0_12px_rgba(245,158,11,0.35)]'
        };
      default:
        return {
          border: 'border-blue-500 bg-blue-500/10 hover:bg-blue-500/20 text-blue-700',
          badge: 'bg-blue-100 text-blue-800 border-blue-200',
          glow: 'shadow-[0_0_12px_rgba(59,130,246,0.35)]'
        };
    }
  };

  const getResolvedKey = (mk: MistakeItem, index: number) => {
    return `${mk.questionNumber}_${index}`;
  };

  const toggleResolved = (key: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setResolvedMistakes(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const totalMistakesCount = mistakes.length;
  const resolvedCount = Object.values(resolvedMistakes).filter(Boolean).length;
  const completionPercent = totalMistakesCount > 0 ? Math.round((resolvedCount / totalMistakesCount) * 100) : 100;

  const renderAnnotationMarkers = () => {
    return visualMistakes.map((mk, index) => {
      if (!mk.box_2d) return null;
      const [ymin, xmin, ymax, xmax] = mk.box_2d;

      const key = getResolvedKey(mk, index);
      const isResolved = !!resolvedMistakes[key];
      const isSelected = selectedMistake === mk;
      const isHovered = hoveredMistake === mk;

      // Translate standard visual grounding integers (0 - 1000) to relative percentages
      const top = `${ymin / 10}%`;
      const left = `${xmin / 10}%`;
      const height = `${Math.max((ymax - ymin) / 10, 3.5)}%`; // Ensure safe minimum sizes
      const width = `${Math.max((xmax - xmin) / 10, 3.5)}%`;

      const sevStyle = getSeverityStyle(mk.severity, isResolved);

      return (
        <div
          key={index}
          className={`absolute rounded border-2 cursor-pointer pointer-events-auto transition-all duration-300 ${sevStyle.border} ${sevStyle.glow} ${
            isSelected || isHovered 
              ? 'ring-2 ring-offset-2 ring-gray-950 border-opacity-100 z-40' 
              : 'border-opacity-90 z-20'
          }`}
          style={{ top, left, width, height }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedMistake(mk);
          }}
          onMouseEnter={() => setHoveredMistake(mk)}
          onMouseLeave={() => setHoveredMistake(null)}
        >
          {/* Pin Identifier Corner Tag */}
          <div 
            className={`absolute -top-3.5 -left-3.5 h-6.5 w-6.5 rounded-full flex items-center justify-center font-bold text-[10px] shadow-sm tracking-tight border select-none transition-transform active:scale-95 z-50 ${
              isResolved 
                ? 'bg-emerald-500 text-white border-emerald-600' 
                : mk.severity?.toLowerCase() === 'high' 
                ? 'bg-red-500 text-white border-red-600' 
                : mk.severity?.toLowerCase() === 'medium'
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-blue-500 text-white border-blue-600'
            }`}
          >
            {isResolved ? (
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            ) : (
              <span>{mk.questionNumber}</span>
            )}
          </div>

          {/* Floating Speech annotation Popover directly in context */}
          {isSelected && (
            <div 
              className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 bg-gray-950 text-white border border-gray-800 shadow-xl rounded-xl p-4 w-72 text-left font-sans transition-all z-50 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-white/10 text-white/90">
                  Question {mk.questionNumber}
                </span>
                <span className={`text-[9.5px] font-mono uppercase font-bold border px-1.5 py-0.5 rounded ${
                  isResolved 
                    ? 'bg-emerald-950/20 text-emerald-400 border-emerald-800' 
                    : mk.severity?.toLowerCase() === 'high'
                    ? 'bg-red-950/20 text-red-400 border-red-800'
                    : 'bg-amber-950/20 text-amber-400 border-amber-850'
                }`}>
                  {isResolved ? 'Resolved' : `${mk.severity} Issue`}
                </span>
              </div>
              
              <h5 className="text-xs font-bold text-white tracking-tight">{mk.label}</h5>
              <p className="text-[11px] text-gray-300 leading-normal mt-1.5 font-sans">
                {mk.comment}
              </p>
              
              <div className="mt-3.5 pt-2.5 border-t border-gray-800 flex items-center justify-between gap-2">
                <button
                  onClick={(e) => toggleResolved(key, e)}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    isResolved
                      ? 'bg-amber-500 text-gray-950 hover:bg-amber-400'
                      : 'bg-emerald-500 text-white hover:bg-emerald-450'
                  }`}
                >
                  {isResolved ? (
                    <>
                      <RotateCcw className="w-3 h-3" />
                      Mark Unsolved
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      Review & Fix Issue
                    </>
                  )}
                </button>
                <button
                  onClick={() => setSelectedMistake(null)}
                  className="text-[10px] text-gray-400 hover:text-white transition-colors py-1 px-2 pointer-events-auto"
                >
                  Close
                </button>
              </div>

              {/* Speech Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-6 border-transparent border-t-gray-950"></div>
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-5 text-left">
        <div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <BadgeCheck className="w-5.5 h-5.5 text-emerald-500" />
            Interactive Mistakes Annotation & Study Board
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Click highlighted boxes on the paper to read correction suggestions and track your learning progress.
          </p>
        </div>

        {totalMistakesCount > 0 && (
          <div className="bg-gray-50 border border-gray-150 p-3 rounded-xl flex items-center gap-4 text-xs font-medium text-gray-700 w-full sm:w-auto">
            <div className="space-y-1 flex-1 sm:flex-none">
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Self-Correction Progress</span>
                <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                  {resolvedCount} / {totalMistakesCount} Fixed
                </span>
              </div>
              <div className="w-full sm:w-44 h-2 rounded bg-gray-200 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500 rounded" 
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Marked Paper (ColSpan 8) */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50/50 rounded-lg p-3 border border-gray-100 mb-3 gap-3 text-left">
            <span className="text-xs text-gray-700 font-semibold truncate flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-gray-400" />
              {answerSheetFileName || 'submission_paper.jpg'}
            </span>
            <div className="flex items-center justify-between sm:justify-end gap-4">
              <div className="text-[10px] text-gray-500 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-red-500/20 border border-red-500"></span>
                  Critical
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500/20 border border-amber-500"></span>
                  Partial Fixes
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500"></span>
                  Corrected
                </span>
              </div>
            </div>
          </div>

          {/* Toggle buttons for PDF annotations map support */}
          {answerSheetBase64 && answerSheetBase64.startsWith('data:application/pdf') && (
            <div className="flex justify-end mb-3">
              <div className="inline-flex rounded-lg bg-gray-100 p-0.5 border border-gray-200 text-xs font-semibold gap-1">
                <button
                  type="button"
                  onClick={() => setPdfViewMode('annotated')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                    pdfViewMode === 'annotated'
                      ? 'bg-white text-gray-950 shadow-xs border border-gray-200/50'
                      : 'text-gray-500 hover:text-gray-955 font-normal'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-500" />
                  Interactive Map
                </button>
                <button
                  type="button"
                  onClick={() => setPdfViewMode('native')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                    pdfViewMode === 'native'
                      ? 'bg-white text-gray-950 shadow-xs border border-gray-200/50'
                      : 'text-gray-500 hover:text-gray-955 font-normal'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-gray-400" />
                  Original PDF Frame
                </button>
              </div>
            </div>
          )}

          {answerSheetBase64 ? (
            <div className="relative border border-gray-200 rounded-xl overflow-auto p-4 bg-gray-50/50 select-none min-h-[60vh] flex flex-col justify-center items-center">
              {answerSheetBase64.startsWith('data:application/pdf') ? (
                pdfViewMode === 'native' ? (
                  <iframe
                    src={answerSheetBase64}
                    title="Answer Sheet Document PDF"
                    className="w-full h-[65vh] border-none rounded-lg bg-white"
                  />
                ) : (
                  /* Elegant, proportional A4 container with interactive annotations */
                  <div className="relative mx-auto w-full max-w-[620px] aspect-[1/1.414] bg-white shadow-md rounded-xl border border-gray-200 overflow-hidden">
                    <iframe
                      src={`${answerSheetBase64}#toolbar=0&navpanes=0&view=Fit`}
                      title="Annotated Answer Sheet PDF"
                      className="absolute inset-0 w-full h-full border-none select-none bg-white"
                      style={{ pointerEvents: 'none' }}
                    />
                    
                    {/* Absolute coordinates layer */}
                    <div className="absolute inset-0 top-0 left-0 w-full h-full pointer-events-none z-10">
                      {renderAnnotationMarkers()}
                    </div>
                  </div>
                )
              ) : (
                /* Precise Wrap Inner Image Component to snap boundaries */
                <div className="relative inline-block mx-auto max-w-full">
                  <img
                    src={answerSheetBase64}
                    alt="Answer sheet marked"
                    className="block max-h-[70vh] w-auto max-w-full object-contain mx-auto rounded-lg shadow-sm"
                  />

                  {/* Absolute coordinate markers aligned perfectly inside image bounds */}
                  <div className="absolute inset-0 top-0 left-0 w-full h-full pointer-events-none">
                    {renderAnnotationMarkers()}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="border border-dashed border-gray-200 rounded-xl p-12 text-center bg-gray-50 flex flex-col items-center justify-center min-h-[40vh]">
              <AlertTriangle className="w-10 h-10 text-gray-400 mb-3" />
              <p className="text-sm font-semibold text-gray-800">Visual Overlay Offline</p>
              <p className="text-xs text-gray-500 mt-1 max-w-xs leading-normal">
                No exam image was submitted. Your mistakes are fully listed textually in the sidebar on the right!
              </p>
            </div>
          )}
        </div>

        {/* Mistakes Index and Detail Sidebar (ColSpan 4) */}
        <div className="lg:col-span-4 flex flex-col h-full justify-between gap-5 text-left font-sans">
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Mistakes Found ({mistakes.length})</span>
              {totalMistakesCount > 0 && (
                <span className="text-[10px] text-emerald-600 font-mono font-normal">
                  {completionPercent}% corrected
                </span>
              )}
            </h3>

            {mistakes.length === 0 ? (
              <div className="border border-gray-100 rounded-xl p-8 text-center bg-gray-50/50 flex flex-col items-center justify-center">
                <Check className="w-8 h-8 text-green-500 mb-3" />
                <p className="text-xs font-bold text-gray-800">Perfect Self-Evaluation!</p>
                <p className="text-[10px] text-gray-500 mt-1 max-w-[180px] leading-normal font-sans">
                  Found zero spelling, formulaic, or analytical errors on your paper. Amazing job!
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {mistakes.map((mk, idx) => {
                  const key = getResolvedKey(mk, idx);
                  const isResolved = !!resolvedMistakes[key];
                  const sevStyle = getSeverityStyle(mk.severity, isResolved);
                  const isCur = selectedMistake === mk;
                  const isHov = hoveredMistake === mk;

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                        isCur || isHov
                          ? 'border-gray-900 bg-gray-950/5 shadow-xs'
                          : isResolved
                          ? 'border-emerald-100 bg-emerald-50/10 hover:border-emerald-200 hover:bg-emerald-50/20'
                          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
                      }`}
                      onClick={() => setSelectedMistake(mk)}
                      onMouseEnter={() => setHoveredMistake(mk)}
                      onMouseLeave={() => setHoveredMistake(null)}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 font-sans">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors ${
                            isResolved 
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                              : 'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            Q{mk.questionNumber}
                          </span>
                          <span className={`text-xs font-bold truncate max-w-[110px] ${
                            isResolved ? 'text-gray-500 line-through font-normal' : 'text-gray-900'
                          }`}>
                            {mk.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isResolved ? (
                            <span className="text-[9px] font-mono font-bold border px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border-emerald-200 uppercase">
                              Solved
                            </span>
                          ) : (
                            <span className={`text-[9px] font-mono uppercase font-bold border px-1.5 py-0.5 rounded ${sevStyle.badge}`}>
                              {mk.severity}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-505 line-clamp-2 mt-1.5 leading-relaxed font-sans">
                        {mk.comment}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detailed Study Guide Panel */}
          <div className="border border-gray-100 rounded-xl bg-gray-50/50 p-4 font-sans">
            {selectedMistake ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5 text-yellow-500" />
                    How to Correct This Gap
                  </h4>
                  <div className="text-[10px] font-bold text-gray-750 bg-gray-100 rounded px-2 py-0.5 font-mono">
                    Q{selectedMistake.questionNumber}
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-bold text-gray-900 leading-tight">{selectedMistake.label}</h5>
                  <p className="text-xs text-gray-650 leading-relaxed mt-1 font-sans">{selectedMistake.comment}</p>
                </div>

                {/* Study Hint Callout Box */}
                <div className="bg-amber-50/40 rounded-lg p-3 border border-amber-100 text-left">
                  <span className="text-[10px] font-semibold text-amber-800 flex items-center gap-1 mb-1 font-sans">
                    <Flame className="w-3 h-3 text-amber-600 animate-pulse" />
                    Self-Correction Suggestion
                  </span>
                  <p className="text-[10.5px] text-amber-900 font-medium leading-normal font-sans">
                    Re-check the core concept formula. Try drawing a clean mental flowchart or rewriting the calculation step-by-step in your physical review notebook!
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <HelpCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-800">Dynamic Correction Inspector</p>
                <p className="text-[10.5px] text-gray-500 max-w-xs mx-auto leading-normal mt-0.5 font-sans">
                  Click on any highlighted box on your sheet (or select from list) to load custom educational study targets and instructions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
