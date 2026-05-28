import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Set up JSON body payload parsing with larger limit for base64 images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'evaluations.json');

// Initialize data storage directory and file
function initDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (error) {
    console.error('Failed to initialize local JSON database:', error);
  }
}
initDatabase();

// Helper to read database
function getEvaluations() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading from evaluations file, resetting...', err);
    return [];
  }
}

// Helper to write database
function saveEvaluations(data: any[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to evaluations file:', err);
  }
}

// Lazy initialization of Gemini API Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required. Please set it in the Settings.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Get evaluation history
app.get('/api/history', (req, res) => {
  try {
    const items = getEvaluations();
    // Exclude oversized answerSheetBase64 to keep file index quick and lightweight
    const summaries = items.map(({ answerSheetBase64, ...rest }: any) => rest);
    res.json(summaries);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch history', details: error.message });
  }
});

// Get specific evaluation with base64 data to reconstruct canvas
app.get('/api/history/:id', (req, res) => {
  try {
    const items = getEvaluations();
    const item = items.find((evalItem: any) => evalItem.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Evaluation not found' });
      return;
    }
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to details for evaluation', details: error.message });
  }
});

// Delete evaluation history item
app.delete('/api/history/:id', (req, res) => {
  try {
    const items = getEvaluations();
    const updated = items.filter((evalItem: any) => evalItem.id !== req.params.id);
    saveEvaluations(updated);
    res.json({ success: true, message: 'Evaluation removed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete evaluation', details: error.message });
  }
});

// Get student performance and analytics details
app.get('/api/analytics', (req, res) => {
  try {
    const items = getEvaluations();
    if (items.length === 0) {
       res.json({ subjects: [], stats: { totalEvaluations: 0, averageScore: 0, perfectScores: 0 }, timeline: [] });
       return;
    }

    // Process stats
    const totalCount = items.length;
    let earnedSum = 0;
    let totalSum = 0;
    let perfectCount = 0;

    const subjectsMap: Record<string, { totalEarned: number, totalMax: number, exams: number }> = {};
    const timeline = items
      .map((it: any) => ({
        id: it.id,
        date: it.examDate,
        score: it.score,
        totalMarks: it.totalMarks,
        percentage: Math.round((it.score / it.totalMarks) * 100),
        subject: it.subject,
        studentName: it.studentName
      }))
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    items.forEach((it: any) => {
      earnedSum += it.score;
      totalSum += it.totalMarks;
      if (it.score === it.totalMarks) {
        perfectCount++;
      }

      const subName = it.subject || 'General';
      if (!subjectsMap[subName]) {
        subjectsMap[subName] = { totalEarned: 0, totalMax: 0, exams: 0 };
      }
      subjectsMap[subName].totalEarned += it.score;
      subjectsMap[subName].totalMax += it.totalMarks;
      subjectsMap[subName].exams += 1;
    });

    const averagePercent = totalSum > 0 ? Math.round((earnedSum / totalSum) * 100) : 0;

    const subjectsList = Object.entries(subjectsMap).map(([name, data]: [string, any]) => ({
      name,
      averagePercentage: Math.round((data.totalEarned / data.totalMax) * 100),
      examsCount: data.exams
    }));

    res.json({
      subjects: subjectsList,
      stats: {
        totalEvaluations: totalCount,
        averagePercentage: averagePercent,
        perfectScores: perfectCount
      },
      timeline
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load progress analytics', details: error.message });
  }
});

// Evaluate Exam Paper Endpoint
app.post('/api/evaluate', async (req, res) => {
  const {
    questionPaperText,
    questionPaperImgMeta, // { data: string, mimeType: string }
    answerSheetImgMeta,   // { data: string, mimeType: string }
    answerSheetText,
    subjectOverride,
    studentNameOverride
  } = req.body;

  try {
    const ai = getGeminiClient();

    const parts: any[] = [];

    // System Instructions
    const systemInstruction = `You are a professional, rigorous, and highly supportive academic examiner with expertise across subjects including STEM, mathematics, humanities, and sciences.
Your task is to comprehensively evaluate a student's Answer Sheet against the provided Question Paper (which may include marking schemes or rubrics if provided).

Analyze:
1. Complete accuracy: Go step-by-step through any calculations, formulas, reasoning, text proof, and logic.
2. Award points according to the question's max marks and the quality of the answer.
3. Identify mistakes. For each mistake, assign a severity ('high', 'medium', or 'low') and specify the related question number.
4. VISUAL GROUNDING (CRITICAL): If the Answer Sheet is provided as an image, you MUST identify the exact visual boundaries of the error.
   Return a 'box_2d' array representing the bounding box [ymin, xmin, ymax, xmax] of the error on the Answer Sheet image, normalized to a 0-1000 scale.
   - ymin: vertical start coordinate (top is 0)
   - xmin: horizontal start coordinate (left is 0)
   - ymax: vertical end coordinate (bottom is 1000)
   - xmax: horizontal end coordinate (right is 1000)
   Example: [450, 200, 520, 800] marks an error roughly at page center vertically, spanning 20% to 80% width.
   If the Answer Sheet is provided ONLY as plain text or if coordinates are not clear, set 'box_2d' to null.
   
Subject metadata override: ${subjectOverride || 'Automatic detection'}.
Student override: ${studentNameOverride || 'Automatic detection'}.

Maintain an encouraging but rigorous pedagogical standard. Frame feedback constructed around a 'Glow' (areas of correct logic) and 'Grow' (actionable guidance on improvement).`;

    // Add inputs to prompt context
    if (questionPaperText) {
      parts.push({ text: `=== QUESTION PAPER TEXT ===\n${questionPaperText}` });
    }
    if (questionPaperImgMeta && questionPaperImgMeta.data) {
      parts.push({
        inlineData: {
          mimeType: questionPaperImgMeta.mimeType || 'image/jpeg',
          data: questionPaperImgMeta.data.split(',')[1] || questionPaperImgMeta.data
        }
      });
      parts.push({ text: 'The document/image above contains the uploaded Question Paper.' });
    }

    if (answerSheetText) {
      parts.push({ text: `=== STUDENT ANSWER SHEET TEXT ===\n${answerSheetText}` });
    }
    if (answerSheetImgMeta && answerSheetImgMeta.data) {
      parts.push({
        inlineData: {
          mimeType: answerSheetImgMeta.mimeType || 'image/jpeg',
          data: answerSheetImgMeta.data.split(',')[1] || answerSheetImgMeta.data
        }
      });
      parts.push({ text: 'The document/image above contains the uploaded Student Answer Sheet.' });
    }

    parts.push({
      text: 'Please evaluate the Student Answer Sheet in detail against the Question Paper scoring standard. Match question-by-question, and identify specific mistakes with physical bounding box parameters if an answer sheet image is available. Provide a structured review.'
    });

    // Gemini 3.5-flash is ideal for multimodal evaluations and visual layout analysis
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: parts,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            studentName: { type: Type.STRING, description: "Name of the student, or use metadata override if provided or 'Student' if undecipherable." },
            subject: { type: Type.STRING, description: "Subject of evaluation (e.g. Mathematics, Calculus, Chemistry, General)" },
            score: { type: Type.INTEGER, description: "Sum of obtained marks for all questions." },
            totalMarks: { type: Type.INTEGER, description: "Sum of maximum scores possible for all questions." },
            glow: { type: Type.STRING, description: "Pedagogical compliment on what they performed well (formula usage, logic structure, calligraphy, correct steps)." },
            grow: { type: Type.STRING, description: "Clear directions for correcting conceptual model, arithmetic pitfalls or reasoning gaps." },
            overallStats: { type: Type.STRING, description: "A high-level critiquing message of academic feedback." },
            grades: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  questionNumber: { type: Type.STRING, description: "Designation, e.g. '1', '2a', '3'" },
                  maxMarks: { type: Type.INTEGER, description: "Max score" },
                  obtainedMarks: { type: Type.INTEGER, description: "Earned score" },
                  status: { type: Type.STRING, description: "Use strictly: 'correct', 'partial', or 'incorrect'" },
                  comment: { type: Type.STRING, description: "Constructive feedback for this item" }
                },
                required: ['questionNumber', 'maxMarks', 'obtainedMarks', 'status', 'comment']
              }
            },
            mistakes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  questionNumber: { type: Type.STRING, description: "Related question string, e.g. 'Question 1'" },
                  label: { type: Type.STRING, description: "Short title of failure reason e.g. 'Calculation slip'" },
                  comment: { type: Type.STRING, description: "Pedagogical guideline for solving without this mistake again" },
                  severity: { type: Type.STRING, description: "One of: 'high', 'medium', 'low'" },
                  box_2d: {
                    type: Type.ARRAY,
                    items: { type: Type.INTEGER },
                    description: "An array of exactly 4 integers [ymin, xmin, ymax, xmax] relative scale [0-1000] mapping the mistake line on the answer sheet. Return empty or null if text-only evaluation"
                  }
                },
                required: ['questionNumber', 'label', 'comment', 'severity']
              }
            }
          },
          required: ['studentName', 'subject', 'score', 'totalMarks', 'glow', 'grow', 'overallStats', 'grades', 'mistakes']
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty model response received from Gemini.");
    }

    const evaluationData = JSON.parse(resultText);

    // Prepare complete record to save
    const completeRecord = {
      id: `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      studentName: studentNameOverride || evaluationData.studentName || 'Student',
      subject: subjectOverride || evaluationData.subject || 'General Grader',
      examDate: new Date().toISOString().split('T')[0],
      score: evaluationData.score || 0,
      totalMarks: evaluationData.totalMarks || 100,
      glow: evaluationData.glow || 'Good work',
      grow: evaluationData.grow || 'Keep learning',
      overallStats: evaluationData.overallStats || 'Comprehensive report generated.',
      grades: evaluationData.grades || [],
      mistakes: evaluationData.mistakes || [],
      questionPaperText,
      answerSheetFileName: answerSheetImgMeta?.fileName || 'AnswerSheet.jpg',
      answerSheetBase64: answerSheetImgMeta?.data || null // Store base64 so user can look at markings downstream!
    };

    // Save record to local JSON file database
    const currentList = getEvaluations();
    currentList.unshift(completeRecord);
    saveEvaluations(currentList);

    res.json(completeRecord);
  } catch (error: any) {
    console.error('Gemini evaluation failed:', error);
    res.status(500).json({ error: 'AI Evaluation failed. Please check Gemini API Key or inputs.', details: error.message });
  }
});

// Vite middleware setup or Static assets serving

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Evaluator Server listening at http://localhost:${PORT}`);
  });
}

startServer();
