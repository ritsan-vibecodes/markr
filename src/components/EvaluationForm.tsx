import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Sparkles, BookOpen, User, Eye, Trash2 } from 'lucide-react';

interface EvaluationFormProps {
  onEvaluate: (payload: {
    questionPaperText: string;
    questionPaperImgMeta: { data: string; mimeType: string; fileName: string } | null;
    answerSheetImgMeta: { data: string; mimeType: string; fileName: string } | null;
    answerSheetText: string;
    subjectOverride: string;
    studentNameOverride: string;
  }) => Promise<void>;
  loading: boolean;
  importedData: {
    questionPaperText: string;
    questionPaperImgMeta: { data: string; mimeType: string; fileName: string } | null;
    answerSheetImgMeta: { data: string; mimeType: string; fileName: string } | null;
    answerSheetText: string;
    studentName: string;
    subject: string;
  } | null;
}

export default function EvaluationForm({ onEvaluate, loading, importedData }: EvaluationFormProps) {
  // Overrides
  const [studentName, setStudentName] = useState('');
  const [subject, setSubject] = useState('');

  // Question Paper tab & state
  const [qpType, setQpType] = useState<'text' | 'image'>('text');
  const [qpText, setQpText] = useState('');
  const [qpImage, setQpImage] = useState<string | null>(null);
  const [qpImageName, setQpImageName] = useState('');
  const [qpImageMime, setQpImageMime] = useState('');

  // Answer Sheet tab & state
  const [asType, setAsType] = useState<'image' | 'text'>('image');
  const [asImage, setAsImage] = useState<string | null>(null);
  const [asImageName, setAsImageName] = useState('');
  const [asImageMime, setAsImageMime] = useState('');
  const [asText, setAsText] = useState('');

  useEffect(() => {
    if (importedData) {
      if (importedData.studentName) setStudentName(importedData.studentName);
      if (importedData.subject) setSubject(importedData.subject);

      if (importedData.questionPaperImgMeta) {
        setQpType('image');
        setQpImage(importedData.questionPaperImgMeta.data);
        setQpImageName(importedData.questionPaperImgMeta.fileName);
        setQpImageMime(importedData.questionPaperImgMeta.mimeType);
        setQpText('');
      } else if (importedData.questionPaperText) {
        setQpType('text');
        setQpText(importedData.questionPaperText);
        setQpImage(null);
        setQpImageName('');
        setQpImageMime('');
      }

      if (importedData.answerSheetImgMeta) {
        setAsType('image');
        setAsImage(importedData.answerSheetImgMeta.data);
        setAsImageName(importedData.answerSheetImgMeta.fileName);
        setAsImageMime(importedData.answerSheetImgMeta.mimeType);
        setAsText('');
      } else if (importedData.answerSheetText) {
        setAsType('text');
        setAsText(importedData.answerSheetText);
        setAsImage(null);
        setAsImageName('');
        setAsImageMime('');
      }
    }
  }, [importedData]);

  const qpFileInputRef = useRef<HTMLInputElement>(null);
  const asFileInputRef = useRef<HTMLInputElement>(null);

  const handleQpFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setQpImageName(file.name);
      setQpImageMime(file.type);
      const reader = new FileReader();
      reader.onloadend = () => {
        setQpImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAsImageName(file.name);
      setAsImageMime(file.type);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAsImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleQpDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      setQpImageName(file.name);
      setQpImageMime(file.type);
      const reader = new FileReader();
      reader.onloadend = () => {
        setQpImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAsDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      setAsImageName(file.name);
      setAsImageMime(file.type);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAsImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerEvaluation = () => {
    onEvaluate({
      questionPaperText: qpType === 'text' ? qpText : '',
      questionPaperImgMeta: qpType === 'image' && qpImage ? { data: qpImage, mimeType: qpImageMime, fileName: qpImageName } : null,
      answerSheetImgMeta: asType === 'image' && asImage ? { data: asImage, mimeType: asImageMime, fileName: asImageName } : null,
      answerSheetText: asType === 'text' ? asText : '',
      subjectOverride: subject.trim(),
      studentNameOverride: studentName.trim()
    });
  };

  const isFormValid = () => {
    const hasQp = qpType === 'text' ? qpText.trim().length > 0 : !!qpImage;
    const hasAs = asType === 'text' ? asText.trim().length > 0 : !!asImage;
    return hasQp && hasAs;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-gray-500" />
            Evaluation Setup
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Initialize grading schema and upload submissions</p>
        </div>
        <div className="bg-gray-50 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium text-gray-500 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
          AI-PRO READY
        </div>
      </div>

      <div className="space-y-6">
        {/* Overrides block */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gray-400" />
              Student Name <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Auto-detects from handwriting, or type here"
              className="w-full text-sm px-3.5 py-2.5 bg-gray-50/50 hover:bg-gray-50 focus:bg-white rounded-lg border border-gray-200 outline-none focus:border-gray-900 transition-all font-sans placeholder-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-gray-400" />
              Subject / Topic <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. calculus exam, physics rubric"
              className="w-full text-sm px-3.5 py-2.5 bg-gray-50/50 hover:bg-gray-50 focus:bg-white rounded-lg border border-gray-200 outline-none focus:border-gray-900 transition-all font-sans placeholder-gray-400"
            />
          </div>
        </div>

        {/* Question Paper Card */}
        <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 tracking-tight">
              1. Question Paper or Answer Key
            </h3>
            <div className="flex rounded-lg bg-gray-100 p-0.5">
              <button
                onClick={() => setQpType('text')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  qpType === 'text' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Text
              </button>
              <button
                onClick={() => setQpType('image')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  qpType === 'image' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Image / PDF
              </button>
            </div>
          </div>

          {qpType === 'text' ? (
            <textarea
              value={qpText}
              onChange={(e) => setQpText(e.target.value)}
              placeholder="Paste the question text, solutions, or marking scheme guidelines here..."
              rows={4}
              className="w-full text-sm p-3 bg-white border border-gray-200 rounded-lg outline-none focus:border-gray-900 transition-all font-sans placeholder-gray-400 resize-none"
            />
          ) : (
            <div
              onDragOver={handleDragOver}
              onDrop={handleQpDrop}
              onClick={() => qpFileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl bg-white p-6 text-center cursor-pointer hover:border-gray-900 transition-all group"
            >
              <input
                type="file"
                ref={qpFileInputRef}
                onChange={handleQpFileChange}
                accept="image/*,application/pdf"
                className="hidden"
              />
              {qpImage ? (
                <div className="flex flex-col items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <div className="relative w-56 h-32 rounded-lg border border-gray-100 overflow-hidden shadow-xs mb-1 flex items-center justify-center bg-gray-50">
                    {qpImage.startsWith('data:application/pdf') ? (
                      <div className="flex flex-col items-center justify-center p-3 text-center">
                        <FileText className="w-8 h-8 text-red-500 mb-1" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase">PDF Document</span>
                      </div>
                    ) : (
                      <img src={qpImage} alt="Question Paper Preview" className="w-full h-full object-cover" />
                    )}
                    <button
                      onClick={() => setQpImage(null)}
                      className="absolute top-1.5 right-1.5 bg-white/95 shadow-xs hover:bg-red-50 hover:text-red-600 p-1 rounded-md transition-all z-10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xs font-medium text-gray-700 truncate max-w-xs">{qpImageName}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-2">
                  <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-105 transition-all">
                    <Upload className="w-5 h-5 text-gray-400 group-hover:text-gray-900" />
                  </div>
                  <p className="text-xs font-semibold text-gray-800">Drag Question Paper image/PDF here or select file</p>
                  <p className="text-[10px] text-gray-400 mt-1">Accepts PNG, JPG, JPEG, PDF up to 10MB</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Student Answer paper Card */}
        <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/20 w-full">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 tracking-tight">
              2. Student Answer Sheet
            </h3>
            <div className="flex rounded-lg bg-gray-100 p-0.5">
              <button
                onClick={() => setAsType('image')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  asType === 'image' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Image / PDF
              </button>
              <button
                onClick={() => setAsType('text')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  asType === 'text' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Text
              </button>
            </div>
          </div>

          {asType === 'text' ? (
            <textarea
              value={asText}
              onChange={(e) => setAsText(e.target.value)}
              placeholder="Type or copy-paste the student's handwritten transcript or digital answers here..."
              rows={4}
              className="w-full text-sm p-3 bg-white border border-gray-200 rounded-lg outline-none focus:border-gray-900 transition-all font-sans placeholder-gray-400 resize-none"
            />
          ) : (
            <div
              onDragOver={handleDragOver}
              onDrop={handleAsDrop}
              onClick={() => asFileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl bg-white p-6 text-center cursor-pointer hover:border-gray-900 transition-all group"
            >
              <input
                type="file"
                ref={asFileInputRef}
                onChange={handleAsFileChange}
                accept="image/*,application/pdf"
                className="hidden"
              />
              {asImage ? (
                <div className="flex flex-col items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <div className="relative w-56 h-32 rounded-lg border border-gray-100 overflow-hidden shadow-xs mb-1 flex items-center justify-center bg-gray-50">
                    {asImage.startsWith('data:application/pdf') ? (
                      <div className="flex flex-col items-center justify-center p-3 text-center">
                        <FileText className="w-8 h-8 text-red-500 mb-1" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase">PDF Document</span>
                      </div>
                    ) : (
                      <img src={asImage} alt="Answer Sheet Preview" className="w-full h-full object-cover" />
                    )}
                    <button
                      onClick={() => setAsImage(null)}
                      className="absolute top-1.5 right-1.5 bg-white/90 shadow-xs hover:bg-red-50 hover:text-red-600 p-1 rounded-md transition-all z-10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xs font-medium text-gray-700 truncate max-w-xs">{asImageName}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-2">
                  <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-105 transition-all">
                    <Upload className="w-5 h-5 text-gray-400 group-hover:text-gray-900" />
                  </div>
                  <p className="text-xs font-semibold text-gray-800">Drag Answer Sheet image/PDF here or select file</p>
                  <p className="text-[10px] text-gray-400 mt-1">Accepts PNG, JPG, JPEG, PDF up to 10MB</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit button */}
        <button
          onClick={triggerEvaluation}
          disabled={loading || !isFormValid()}
          className={`w-full py-3 px-4 rounded-xl font-medium text-sm transition-all focus:outline-none flex items-center justify-center gap-2 ${
            loading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              : isFormValid()
              ? 'bg-gray-900 hover:bg-gray-800 text-white cursor-pointer active:scale-99/100 shadow-sm'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
          }`}
        >
          <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin text-gray-400' : 'text-amber-400'}`} />
          {loading ? 'AI Grader Evaluating Submissions...' : 'Analyze & Evaluate Papers'}
        </button>
      </div>
    </div>
  );
}
