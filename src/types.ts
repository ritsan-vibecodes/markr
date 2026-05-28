export interface GradeItem {
  questionNumber: string;
  maxMarks: number;
  obtainedMarks: number;
  status: 'correct' | 'partial' | 'incorrect';
  comment: string;
}

export interface MistakeItem {
  questionNumber: string;
  label: string;
  comment: string;
  severity: 'high' | 'medium' | 'low';
  box_2d: [number, number, number, number] | null; // [ymin, xmin, ymax, xmax] on a 0-1000 scale
}

export interface EvaluationResult {
  id: string;
  studentName: string;
  subject: string;
  examDate: string;
  score: number;
  totalMarks: number;
  glow: string;
  grow: string;
  overallStats: string;
  grades: GradeItem[];
  mistakes: MistakeItem[];
  questionPaperText?: string;
  answerSheetFileName?: string;
  answerSheetBase64?: string; // Base64 representation to re-display
}

export interface StudentProgress {
  subject: string;
  averageScore: number;
  totalExams: number;
  history: {
    id: string;
    examDate: string;
    score: number;
    totalMarks: number;
    percentage: number;
  }[];
}
