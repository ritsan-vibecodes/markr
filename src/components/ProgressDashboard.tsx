import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TrendingUp, Award, Layers, BarChart2, Calendar, User, Eye, ArrowRight } from 'lucide-react';
import { StudentProgress, EvaluationResult } from '../types';

interface ProgressDashboardProps {
  analyticsData: {
    subjects: { name: string; averagePercentage: number; examsCount: number }[];
    stats: { totalEvaluations: number; averagePercentage: number; perfectScores: number };
    timeline: {
      id: string;
      date: string;
      score: number;
      totalMarks: number;
      percentage: number;
      subject: string;
      studentName: string;
    }[];
  };
  onSelectReportId: (id: string) => void;
}

export default function ProgressDashboard({ analyticsData, onSelectReportId }: ProgressDashboardProps) {
  const { subjects = [], stats, timeline = [] } = analyticsData;

  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 text-white rounded-lg p-3 text-left shadow-lg border border-gray-800 text-xs">
          <p className="font-bold mb-1">{data.studentName}</p>
          <p className="text-gray-300 font-medium">Subject: <span className="font-bold text-white">{data.subject}</span></p>
          <p className="text-gray-300">Grade: <span className="font-mono font-bold text-emerald-400">{data.score}/{data.totalMarks} ({data.percentage}%)</span></p>
          <p className="text-gray-400 text-[10px] mt-1.5 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {data.date}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Aggregated Statistical Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total evaluations card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-left flex items-start justify-between hover:shadow-xs transition-shadow">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono">
              Total Checked
            </p>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">
              {stats.totalEvaluations}
            </p>
            <p className="text-[10px] text-gray-500 leading-none">Self-evaluated papers completed</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Average accuracy percentage card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-left flex items-start justify-between hover:shadow-xs transition-shadow">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono">
              My Avg Accuracy
            </p>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">
              {stats.averagePercentage}%
            </p>
            <p className="text-[10px] text-gray-500 leading-none">Averaged self-evaluation score</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Flawless count */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-left flex items-start justify-between hover:shadow-xs transition-shadow">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono">
              Flawless Papers
            </p>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">
              {stats.perfectScores}
            </p>
            <p className="text-[10px] text-gray-500 leading-none">100% correct submissions</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main rechart trends panel & list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress chart panel */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm lg:col-span-2 text-left">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900 tracking-tight flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-gray-500" />
              Academic Performance Trend
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Chronological score logs of previous grading evaluations</p>
          </div>

          <div className="w-full h-[280px] mt-4 select-none">
            {timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="percentage"
                    stroke="#111827"
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                    dot={{ r: 4, stroke: '#111827', strokeWidth: 1, fill: '#FFFFFF' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full border border-dashed border-gray-100 bg-gray-50/50 rounded-xl flex items-center justify-center">
                <p className="text-xs text-gray-400">Evaluate a few papers first to generate trends graphs</p>
              </div>
            )}
          </div>
        </div>

        {/* Subject progress panel */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-left">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-500" />
              Accuracy by Subject
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Aggregate performance metrics mapped per topic</p>
          </div>

          <div className="mt-6 space-y-4 max-h-[250px] overflow-y-auto pr-1">
            {subjects.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                No subjects detected. Let AI parse your papers first.
              </div>
            ) : (
              subjects.map((sub, idx) => (
                <div key={idx} className="space-y-1.5 text-left font-sans">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-gray-800 truncate max-w-[140px]">{sub.name}</span>
                    <span className="text-gray-400 font-mono text-[10px] font-normal">
                      {sub.averagePercentage}% ({sub.examsCount} {sub.examsCount === 1 ? 'exam' : 'exams'})
                    </span>
                  </div>
                  {/* Progress ratio track */}
                  <div className="w-full h-2 rounded bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded ${
                        sub.averagePercentage >= 80 ? 'bg-emerald-500' : sub.averagePercentage >= 65 ? 'bg-blue-500' : 'bg-amber-400'
                      }`}
                      style={{ width: `${sub.averagePercentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* History table log */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 text-left shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 tracking-tight">My Self-Correction Logs</h3>
        <p className="text-xs text-gray-500 mt-0.5">Track over time study logs with instant access click triggers</p>

        <div className="mt-5 border border-gray-100 rounded-xl overflow-hidden font-sans">
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse text-left">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100 text-xs font-bold font-mono text-gray-400 uppercase">
                  <th className="p-3.5 pl-5">Date</th>
                  <th className="p-3.5">Assessed Name</th>
                  <th className="p-3.5">Course / Subject</th>
                  <th className="p-3.5">Score Ratio</th>
                  <th className="p-3.5 text-right pr-5">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {timeline.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400">
                      No evaluation history found. Make a submission to begin tracker indices.
                    </td>
                  </tr>
                ) : (
                  timeline.slice().reverse().map((exam) => (
                    <tr key={exam.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-3.5 pl-5 font-mono text-gray-500 font-medium">{exam.date}</td>
                      <td className="p-3.5 font-bold text-gray-800">{exam.studentName}</td>
                      <td className="p-3.5 text-gray-600 font-medium">{exam.subject}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                          exam.percentage >= 80 ? 'bg-emerald-50 text-emerald-800 border border-emerald-120' : exam.percentage >= 65 ? 'bg-blue-50 text-blue-800 border border-blue-120' : 'bg-amber-50 text-amber-800 border border-amber-120'
                        }`}>
                          {exam.score} / {exam.totalMarks} ({exam.percentage}%)
                        </span>
                      </td>
                      <td className="p-3.5 text-right pr-5">
                        <button
                          onClick={() => onSelectReportId(exam.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-900 text-gray-500 hover:text-white transition-all text-[11px] font-medium flex items-center gap-1 ml-auto cursor-pointer border border-gray-200"
                        >
                          <Eye className="w-3 h-3" />
                          View Result
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
