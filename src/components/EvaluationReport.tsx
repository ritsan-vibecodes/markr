import React from 'react';
import { CheckCircle2, AlertCircle, XCircle, Award, Compass, ArrowUpRight, Zap, Printer } from 'lucide-react';
import { EvaluationResult } from '../types';

interface EvaluationReportProps {
  evaluation: EvaluationResult;
}

export default function EvaluationReport({ evaluation }: EvaluationReportProps) {
  const {
    studentName,
    subject,
    examDate,
    score,
    totalMarks,
    glow,
    grow,
    overallStats,
    grades = []
  } = evaluation;

  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please disable your popup blocker to generate the PDF report.');
      return;
    }

    const pct = totalMarks > 0 ? Math.round((score / totalMarks) * 105 / 1.05) : 0; // standard safety percentage
    const roundedPct = Math.round(score / totalMarks * 100);

    printWindow.document.write(`
      <html>
        <head>
          <title>Evaluation Report - ${studentName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body {
              font-family: 'Inter', -apple-system, sans-serif;
              color: #111827;
              background: #ffffff;
              margin: 40px;
              line-height: 1.5;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 24px;
              margin-bottom: 30px;
            }
            .title-area h1 {
              font-size: 28px;
              margin: 0;
              font-weight: 700;
              letter-spacing: -0.025em;
            }
            .title-area p {
              font-size: 14px;
              color: #4b5563;
              margin: 4px 0 0 0;
              font-family: 'Inter', sans-serif;
            }
            .score-badge {
              text-align: right;
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              padding: 12px 24px;
              border-radius: 12px;
            }
            .score-val {
              font-size: 32px;
              font-weight: 700;
              margin: 0;
            }
            .score-total {
              font-size: 16px;
              color: #9ca3af;
              font-weight: 400;
            }
            .score-percentage {
              font-size: 14px;
              font-weight: 600;
              color: #059669;
              margin-top: 2px;
            }
            .section-title {
              font-size: 12px;
              text-transform: uppercase;
              font-weight: 700;
              letter-spacing: 0.1em;
              color: #6b7280;
              border-bottom: 1px solid #f3f4f6;
              padding-bottom: 8px;
              margin-bottom: 12px;
              margin-top: 30px;
            }
            .overview-box {
              background: #fdfdfd;
              border: 1px solid #f3f4f6;
              border-radius: 12px;
              padding: 20px;
              margin-bottom: 30px;
            }
            .glow-grow-grid {
              display: grid;
              grid-template-cols: 1fr 1fr;
              gap: 24px;
              margin-bottom: 30px;
            }
            .grow-card {
              background: #fefaf0;
              border: 1px solid #fdf4e7;
              border-radius: 16px;
              padding: 20px;
            }
            .glow-card {
              background: #fafdfb;
              border: 1px solid #ecfbf3;
              border-radius: 16px;
              padding: 20px;
            }
            .card-title {
              font-size: 16px;
              font-weight: 700;
              margin: 0 0 8px 0;
            }
            .grow-card .card-title { color: #b45309; }
            .glow-card .card-title { color: #047857; }
            .card-desc {
              font-size: 11px;
              color: #6b7280;
              margin: 0 0 12px 0;
            }
            .card-content {
              font-size: 13px;
              color: #374151;
              margin: 0;
              white-space: pre-line;
            }
            .breakdown-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            .breakdown-header {
              background: #f9fafb;
              font-weight: 600;
              font-size: 12px;
              color: #4b5563;
              border-bottom: 2px solid #e5e7eb;
            }
            .breakdown-header td, .breakdown-row td {
              padding: 12px 16px;
              text-align: left;
            }
            .breakdown-row {
              border-bottom: 1px solid #f3f4f6;
            }
            .breakdown-q {
              font-family: 'Inter', sans-serif;
              font-weight: 700;
              font-size: 13px;
            }
            .breakdown-status {
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
              padding: 4px 8px;
              border-radius: 6px;
              display: inline-block;
            }
            .status-correct { background: #ecfdf5; color: #047857; }
            .status-partial { background: #fffbeb; color: #b45309; }
            .status-incorrect { background: #fef2f2; color: #b91c1c; }
            .breakdown-marks {
              text-align: right !important;
              font-weight: 750;
            }
            .footer {
              margin-top: 50px;
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
              font-size: 11px;
              color: #9ca3af;
              text-align: center;
            }
            @media print {
              body { margin: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title-area">
              <h1>${studentName}</h1>
              <p>${subject} &bull; Exam: ${examDate}</p>
            </div>
            <div class="score-badge">
              <p class="score-val">${score} <span class="score-total">/ ${totalMarks}</span></p>
              <div class="score-percentage">Class Accuracy: ${roundedPct}%</div>
            </div>
          </div>

          <div class="section-title">Summary Review</div>
          <div class="overview-box">
            <p style="font-size: 14px; margin: 0; color: #374151;">${overallStats || 'The evaluation successfully catalogued and rated all answers.'}</p>
          </div>

          <div class="glow-grow-grid">
            <div class="glow-card">
              <h3 class="card-title">Glow Points</h3>
              <p class="card-desc">Strengths and correct pedagogical models</p>
              <p class="card-content">${glow || 'Excellent conceptual structure recorded.'}</p>
            </div>
            <div class="grow-card">
              <h3 class="card-title">Grow Advice</h3>
              <p class="card-desc">Areas of remediation and calculations alignment</p>
              <p class="card-content">${grow || 'Remediating formulas aligned correctly.'}</p>
            </div>
          </div>

          <div class="section-title">Question Breakdown</div>
          <table class="breakdown-table">
            <thead>
              <tr class="breakdown-header">
                <td>Question No.</td>
                <td>Status</td>
                <td>Pedagogical Feedback</td>
                <td style="text-align: right;">Obtained Score</td>
              </tr>
            </thead>
            <tbody>
              ${(grades || []).map(g => `
                <tr class="breakdown-row">
                  <td class="breakdown-q">Question ${g.questionNumber}</td>
                  <td>
                    <span class="breakdown-status status-${g.status.toLowerCase()}">${g.status}</span>
                  </td>
                  <td style="font-size: 13px; color: #4b5563;">${g.comment}</td>
                  <td class="breakdown-marks">${g.obtainedMarks} / ${g.maxMarks}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            Generated automatically by AI Evaluation Grader. Authentic spatial marks ledger.
          </div>

          <script>
            window.focus();
            setTimeout(() => {
              window.print();
              window.close();
            }, 600);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };


  const getScoreColor = (percent: number) => {
    if (percent >= 90) return 'text-emerald-500 border-emerald-500 bg-emerald-50';
    if (percent >= 75) return 'text-blue-500 border-blue-500 bg-blue-50';
    if (percent >= 50) return 'text-amber-500 border-amber-500 bg-amber-50';
    return 'text-red-500 border-red-500 bg-red-50';
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'correct':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />;
      case 'partial':
        return <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />;
      case 'incorrect':
        return <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
      default:
        return <Compass className="w-4 h-4 text-gray-400 flex-shrink-0" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'correct':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'partial':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'incorrect':
        return 'bg-red-50 text-red-700 border-red-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Comprehensive Report Top summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider font-mono">
                My Self-Evaluation Match
              </span>
              <button
                onClick={handleExportPDF}
                className="px-2.5 py-1 bg-gray-950 hover:bg-gray-800 text-white rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-xs hover:shadow-sm"
                title="Download customized printable PDF report of student metrics"
              >
                <Printer className="w-3 h-3" />
                Download PDF Report
              </button>
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">{subject || 'Practice Exam'}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-gray-500 font-sans">
              <span className="font-semibold text-gray-800">Assessed by: {studentName || 'Self-Evaluator'}</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span>Checked Date: {examDate}</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span className="font-mono text-[10px]">ID: {evaluation.id}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Visual Circular Gauge */}
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-100"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`transition-all duration-1000 ease-out ${
                    percentage >= 80 ? 'text-emerald-500' : percentage >= 60 ? 'text-blue-500' : 'text-amber-500'
                  }`}
                  strokeDasharray={`${percentage}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center font-sans">
                <span className="text-base font-bold text-gray-900 leading-none">{percentage}%</span>
                <span className="text-[8px] font-medium text-gray-400 mt-0.5">SCORE</span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">My Accuracy</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">
                {score} <span className="text-gray-400 text-sm font-normal">/ {totalMarks}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Analytical overall assessment */}
        <div className="mt-6 border-t border-gray-100 pt-5 text-left leading-relaxed">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 font-mono">
            Analysis Overview
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed font-sans">
            {overallStats || 'The evaluation successfully catalogued and rated all answers.'}
          </p>
        </div>
      </div>

      {/* Pedagogical Glow and Grow blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Glow (Praise) Card */}
        <div className="bg-emerald-50/20 rounded-2xl border border-emerald-100/50 shadow-xs p-5 hover:shadow-sm transition-all text-left">
          <div className="flex items-center gap-2 mb-3.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Award className="w-4.5 h-4.5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 tracking-tight">What I Did Well</h3>
              <p className="text-[10px] text-emerald-600 font-medium">Core achievements and correct logic</p>
            </div>
          </div>
          <p className="text-xs text-gray-700 leading-relaxed font-sans whitespace-pre-line">
            {glow || 'Great structure and formula usage. Clear conceptual logic throughout.'}
          </p>
        </div>

        {/* Grow (Pitfalls) Card */}
        <div className="bg-amber-50/20 rounded-2xl border border-amber-100/50 shadow-xs p-5 hover:shadow-sm transition-all text-left">
          <div className="flex items-center gap-2 mb-3.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50/50 flex items-center justify-center">
              <Zap className="w-4.5 h-4.5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 tracking-tight">Improvement Plan</h3>
              <p className="text-[10px] text-amber-600 font-medium font-mono">Remedial learning targets & fixes</p>
            </div>
          </div>
          <p className="text-xs text-gray-700 leading-relaxed font-sans whitespace-pre-line">
            {grow || 'Mind standard arithmetic notations and carry conversions diligently in formula inputs.'}
          </p>
        </div>
      </div>

      {/* Question paper scoring breakdown list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-left">
        <h3 className="text-sm font-semibold text-gray-900 tracking-tight">
          Question-by-Question Grading Breakdown
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">Itemized scores compared side-by-side with individual points</p>

        <div className="mt-5 border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
          {grades.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              No itemized marks breakdown was produced for this evaluation.
            </div>
          ) : (
            grades.map((item, idx) => (
              <div
                key={idx}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/55 transition-colors font-sans"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-gray-100 border text-gray-800">
                      Question {item.questionNumber}
                    </span>
                    <span className={`text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full border ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 font-medium leading-normal pr-4">
                    {item.comment}
                  </p>
                </div>

                <div className="flex flex-shrink-0 items-center justify-between sm:justify-end gap-x-4 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-gray-50">
                  <div className="flex items-center gap-1">
                    {getStatusIcon(item.status)}
                    <span className="text-xs font-bold text-gray-800">
                      {item.obtainedMarks} <span className="text-gray-400 font-normal leading-none text-[11px]">/ {item.maxMarks} max</span>
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
