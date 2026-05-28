import React, { useState } from 'react';
import { AlertTriangle, HelpCircle, Check, Eye, BadgeCheck, FileText } from 'lucide-react';
import { MistakeItem } from '../types';

interface VisualMarkerProps {
  answerSheetBase64: string | null | undefined;
  answerSheetFileName?: string;
  mistakes: MistakeItem[];
}

export default function VisualMarker({ answerSheetBase64, answerSheetFileName, mistakes }: VisualMarkerProps) {
  const [selectedMistake, setSelectedMistake] = useState<MistakeItem | null>(null);
  const [hoveredMistake, setHoveredMistake] = useState<MistakeItem | null>(null);

  // Filter mistakes that have valid image coordinates
  const visualMistakes = mistakes.filter(m => Array.isArray(m.box_2d) && m.box_2d.length === 4);

  const getSeverityStyle = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return {
          border: 'border-red-500 bg-red-500/10 hover:bg-red-500/20 text-red-700',
          badge: 'bg-red-100 text-red-800 border-red-200'
        };
      case 'medium':
        return {
          border: 'border-amber-500 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700',
          badge: 'bg-amber-100 text-amber-800 border-amber-200'
        };
      default:
        return {
          border: 'border-blue-500 bg-blue-500/10 hover:bg-blue-500/20 text-blue-700',
          badge: 'bg-blue-100 text-blue-800 border-blue-200'
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 tracking-tight flex items-center gap-2">
          <BadgeCheck className="w-5 h-5 text-gray-500" />
          Marked Answer Paper
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          AI detects handwriting patterns and outlines mistakes dynamically
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Interactive Marked Paper */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between bg-gray-50/50 rounded-lg p-3 border border-gray-100 mb-3">
            <span className="text-xs text-gray-700 font-medium truncate flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-gray-400" />
              {answerSheetFileName || 'student_submission.jpg'}
            </span>
            <div className="text-[10px] text-gray-500 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-red-500/20 border border-red-500"></span>
                Critical Errors
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-500/20 border border-amber-500"></span>
                Calculations / Mid-steps
              </span>
            </div>
          </div>

          {answerSheetBase64 ? (
            <div className="relative border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-gray-50 group select-none min-h-[60vh] flex flex-col justify-center">
              {answerSheetBase64.startsWith('data:application/pdf') ? (
                <iframe
                  src={answerSheetBase64}
                  title="Student Answer Sheet PDF"
                  className="w-full h-[65vh] border-none"
                />
              ) : (
                <img
                  src={answerSheetBase64}
                  alt="Student Answer sheet marked"
                  className="w-full h-auto block max-h-[70vh] object-contain mx-auto"
                />
              )}

              {/* Absolute coordinates layout overlays (only for non-PDFs since PDFs have their own internal page scrolls) */}
              {!answerSheetBase64.startsWith('data:application/pdf') && (
                <div className="absolute inset-0 top-0 left-0 w-full h-full pointer-events-none">
                  {visualMistakes.map((mk, index) => {
                    if (!mk.box_2d) return null;
                    const [ymin, xmin, ymax, xmax] = mk.box_2d;

                    const isSelected = selectedMistake === mk;
                    const isHovered = hoveredMistake === mk;

                    // Translate standard Gemini visual grounding integers (0 - 1000) to relative percentages
                    const top = `${ymin / 10}%`;
                    const left = `${xmin / 10}%`;
                    const height = `${Math.max((ymax - ymin) / 10, 2)}%`; // Ensure minimum size of 2%
                    const width = `${Math.max((xmax - xmin) / 10, 2)}%`;

                    const sevStyle = getSeverityStyle(mk.severity);

                    return (
                      <div
                        key={index}
                        className={`absolute rounded border-2 cursor-pointer pointer-events-auto transition-all ${sevStyle.border} ${
                          isSelected || isHovered ? 'ring-2 ring-offset-2 ring-gray-900 border-opacity-100 z-30' : 'border-opacity-80 z-20'
                        }`}
                        style={{ top, left, width, height }}
                        onClick={() => setSelectedMistake(mk)}
                        onMouseEnter={() => setHoveredMistake(mk)}
                        onMouseLeave={() => setHoveredMistake(null)}
                      >
                        {/* Floating Indicator */}
                        <div className="absolute -top-5 left-0 bg-gray-900 text-[9px] font-mono font-medium text-white px-2 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          Question {mk.questionNumber} ({mk.severity})
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="border border-dashed border-gray-200 rounded-xl p-12 text-center bg-gray-50 flex flex-col items-center justify-center min-h-[40vh]">
              <AlertTriangle className="w-10 h-10 text-gray-400 mb-3" />
              <p className="text-sm font-semibold text-gray-800">Visual Overlay Offline</p>
              <p className="text-xs text-gray-500 mt-1 max-w-xs leading-normal">
                Mistakes are listed textually because the student response was submitted solely in typed text format.
              </p>
            </div>
          )}
        </div>

        {/* Mistakes Index and Detail Sidebar */}
        <div className="flex flex-col h-full justify-between">
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Specific Mistakes Map ({visualMistakes.length})
            </h3>

            {mistakes.length === 0 ? (
              <div className="border border-gray-100 rounded-xl p-6 text-center bg-gray-50/50 flex flex-col items-center justify-center">
                <Check className="w-8 h-8 text-green-500 mb-2" />
                <p className="text-xs font-semibold text-gray-800">Perfect Layout Score!</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Found zero spelling, formulaic, or arithmetic flaws.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {mistakes.map((mk, idx) => {
                  const sevStyle = getSeverityStyle(mk.severity);
                  const isCur = selectedMistake === mk;
                  const isHov = hoveredMistake === mk;

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                        isCur || isHov
                          ? 'border-gray-900 bg-gray-900/5 shadow-xs'
                          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
                      }`}
                      onClick={() => setSelectedMistake(mk)}
                      onMouseEnter={() => setHoveredMistake(mk)}
                      onMouseLeave={() => setHoveredMistake(null)}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-100 border text-gray-800">
                            Q{mk.questionNumber}
                          </span>
                          <span className="text-xs font-semibold text-gray-900 truncate max-w-[120px]">
                            {mk.label}
                          </span>
                        </div>
                        <span className={`text-[9px] font-mono uppercase font-bold border px-1.5 py-0.5 rounded ${sevStyle.badge}`}>
                          {mk.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 line-clamp-2 mt-1">
                        {mk.comment}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Details Card */}
          <div className="mt-6 border border-gray-100 rounded-xl bg-gray-50/50 p-4">
            {selectedMistake ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                    Correction Target
                  </h4>
                  <div className="bg-gray-100 outline-none text-[10px] font-bold text-gray-700 rounded px-2 py-0.5 font-mono">
                    Question {selectedMistake.questionNumber}
                  </div>
                </div>

                <div>
                  <span className={`text-[10px] font-mono font-bold uppercase border px-2 py-0.5 rounded inline-block ${getSeverityStyle(selectedMistake.severity).badge}`}>
                    {selectedMistake.severity} Severity
                  </span>
                  <h5 className="text-sm font-semibold text-gray-900 mt-2">{selectedMistake.label}</h5>
                  <p className="text-xs text-gray-600 leading-relaxed mt-1">{selectedMistake.comment}</p>
                </div>

                {selectedMistake.box_2d && (
                  <div className="text-[10px] text-gray-500 italic border-t border-gray-100 pt-2.5 flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    Coordinate normalized is {`[${selectedMistake.box_2d.join(', ')}]`}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <HelpCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-gray-800">Interactive Inspector</p>
                <p className="text-[10px] text-gray-500 max-w-xs mx-auto leading-normal mt-0.5">
                  Click on any listed mistake or visual bounding box on the paper to load active pedagogical help guidelines here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
