import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  FolderOpen,
  User,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  LogOut,
  X,
  FileText,
  AlertTriangle,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { googleSignIn, logout, getAccessToken, auth } from '../lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';

interface ClassroomImportProps {
  onClose: () => void;
  onImport: (data: {
    questionPaperText: string;
    questionPaperImgMeta: { data: string; mimeType: string; fileName: string } | null;
    answerSheetImgMeta: { data: string; mimeType: string; fileName: string } | null;
    answerSheetText: string;
    studentName: string;
    subject: string;
  }) => void;
}

export default function ClassroomImport({ onClose, onImport }: ClassroomImportProps) {
  // Authentication status
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Classroom API loading states
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingWork, setLoadingWork] = useState(false);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [loadingFile, setLoadingFile] = useState<string | null>(null);

  // Fetched data state
  const [courses, setCourses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [studentsMap, setStudentsMap] = useState<Record<string, string>>({}); // userId -> fullName

  // Selection state
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedAssignment, setSelectedAssignment] = useState<string>('');
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);

  // File targets
  const [selectedQpFileId, setSelectedQpFileId] = useState<string>('');
  const [selectedQpFileName, setSelectedQpFileName] = useState<string>('');
  const [selectedAsFileId, setSelectedAsFileId] = useState<string>('');
  const [selectedAsFileName, setSelectedAsFileName] = useState<string>('');

  // Error logging
  const [errMessage, setErrMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Handle Firebase auth baseline
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        const token = getAccessToken();
        if (token) {
          setAccessToken(token);
          fetchCourses(token);
        } else {
          // If in-memory token is gone on refresh, guide user to login again
          setCurrentUser(null);
          setAccessToken(null);
        }
      } else {
        setCurrentUser(null);
        setAccessToken(null);
      }
    });
    return () => unsub();
  }, []);

  const handleSignIn = async () => {
    setAuthLoading(true);
    setErrMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        setAccessToken(result.accessToken);
        fetchCourses(result.accessToken);
      }
    } catch (err: any) {
      setErrMessage(err.message || 'Google authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    setErrMessage(null);
    try {
      await logout();
      setCourses([]);
      setAssignments([]);
      setSubmissions([]);
      setSelectedCourse('');
      setSelectedAssignment('');
      setSelectedSubmission(null);
    } catch (err: any) {
      setErrMessage(err.message);
    }
  };

  // Google Classroom APIs
  const fetchCourses = async (token: string) => {
    setLoadingCourses(true);
    setErrMessage(null);
    try {
      const res = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('API Classroom Courses lookup forbidden. Double-check scopes.');
      const data = await res.json();
      setCourses(data.courses || []);
    } catch (err: any) {
      setErrMessage(err.message);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId);
    setSelectedAssignment('');
    setSelectedSubmission(null);
    setAssignments([]);
    setSubmissions([]);
    setStudentsMap({});
    if (courseId && accessToken) {
      fetchAssignments(courseId, accessToken);
      fetchStudents(courseId, accessToken);
    }
  };

  const fetchAssignments = async (courseId: string, token: string) => {
    setLoadingWork(true);
    setErrMessage(null);
    try {
      const res = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/courseWork`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Could not retrieve coursework entries.');
      const data = await res.json();
      setAssignments(data.courseWork || []);
    } catch (err: any) {
      setErrMessage(err.message);
    } finally {
      setLoadingWork(false);
    }
  };

  const fetchStudents = async (courseId: string, token: string) => {
    try {
      const res = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, string> = {};
        const list = data.students || [];
        list.forEach((st: any) => {
          if (st.userId && st.profile?.name?.fullName) {
            map[st.userId] = st.profile.name.fullName;
          }
        });
        setStudentsMap(map);
      }
    } catch (err) {
      console.warn('Student profile name lookup omitted.', err);
    }
  };

  const handleAssignmentChange = (workId: string) => {
    setSelectedAssignment(workId);
    setSelectedSubmission(null);
    setSubmissions([]);
    setSelectedQpFileId('');
    setSelectedQpFileName('');
    setSelectedAsFileId('');
    setSelectedAsFileName('');

    // Pre-populate potential coursework Question material
    const workItem = assignments.find(w => w.id === workId);
    if (workItem?.materials && workItem.materials.length > 0) {
      // Find first Drive material file
      for (const mat of workItem.materials) {
        const fileObj = mat.driveFile?.driveFile || mat.driveFile;
        if (fileObj?.id) {
          setSelectedQpFileId(fileObj.id);
          setSelectedQpFileName(fileObj.title || 'Assignment Document');
          break;
        }
      }
    }

    if (workId && accessToken) {
      fetchSubmissions(selectedCourse, workId, accessToken);
    }
  };

  const fetchSubmissions = async (courseId: string, workId: string, token: string) => {
    setLoadingSubmissions(true);
    setErrMessage(null);
    try {
      const res = await fetch(
        `https://classroom.googleapis.com/v1/courses/${courseId}/courseWork/${workId}/studentSubmissions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Could not download student solutions metrics list.');
      const data = await res.json();
      setSubmissions(data.studentSubmissions || []);
    } catch (err: any) {
      setErrMessage(err.message);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleSubmissionSelect = (sub: any) => {
    setSelectedSubmission(sub);
    setSelectedAsFileId('');
    setSelectedAsFileName('');

    // Pre-select first Drive attachment upload found
    const attachments = sub.assignmentSubmission?.attachments || [];
    for (const att of attachments) {
      const fileObj = att.driveFile;
      if (fileObj?.id) {
        setSelectedAsFileId(fileObj.id);
        setSelectedAsFileName(fileObj.title || 'Student Uploaded Answer Sheet');
        break;
      }
    }
  };

  // Convert Google Drive File metadata + raw streams to base64 Data URLs
  const downloadDriveFileBase64 = async (fileId: string, token: string) => {
    // 1. Fetch file schema profile to confirm MIME types
    const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=mimeType,name`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!metaRes.ok) throw new Error(`Could not access Drive file properties [ID: ${fileId}].`);
    const meta = await metaRes.json();
    const mimeType = meta.mimeType || 'image/jpeg';

    // 2. Download raw media chunks
    const altRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!altRes.ok) throw new Error(`Could not load Drive media contents [ID: ${fileId}].`);
    const fileBlob = await altRes.blob();

    // 3. Read raw chunks to Base64
    return new Promise<{ data: string; mimeType: string; name: string }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          data: reader.result as string,
          mimeType,
          name: meta.name || 'document'
        });
      };
      reader.onerror = () => reject(new Error('Base64 conversion failed.'));
      reader.readAsDataURL(fileBlob);
    });
  };

  const executeImport = async () => {
    if (!accessToken) return;
    setStatusMessage('Syncing Classroom details to grader desks...');
    setErrMessage(null);

    let qpImgMeta: any = null;
    let asImgMeta: any = null;
    let qpText = '';
    let asText = '';

    try {
      // 1. Fetch Question Paper if file target selected
      if (selectedQpFileId) {
        setLoadingFile('question');
        try {
          const fileData = await downloadDriveFileBase64(selectedQpFileId, accessToken);
          // Check if image or document
          if (fileData.mimeType.startsWith('image/') || fileData.mimeType === 'application/pdf') {
            qpImgMeta = {
              data: fileData.data,
              mimeType: fileData.mimeType,
              fileName: fileData.name
            };
          } else {
            // Assume plain text / doc file fallback
            qpText = `Imported questions from document: ${fileData.name}`;
          }
        } catch (err: any) {
          throw new Error(`Question Import Error: ${err.message}`);
        }
      } else {
        // Fallback to coursework instruction text
        const currentWork = assignments.find(w => w.id === selectedAssignment);
        qpText = currentWork?.description || 'Class Assignment Question Set';
      }

      // 2. Fetch Answer Sheet File target
      if (selectedAsFileId) {
        setLoadingFile('answer');
        try {
          const fileData = await downloadDriveFileBase64(selectedAsFileId, accessToken);
          if (fileData.mimeType.startsWith('image/') || fileData.mimeType === 'application/pdf') {
            asImgMeta = {
              data: fileData.data,
              mimeType: fileData.mimeType,
              fileName: fileData.name
            };
          } else {
            asText = `Imported text answer from document: ${fileData.name}`;
          }
        } catch (err: any) {
          throw new Error(`Answer Import Error: ${err.message}`);
        }
      } else {
        throw new Error('Please select at least one student submission attachment file to grade.');
      }

      // Identify student and course properties
      const sName = studentsMap[selectedSubmission?.userId] || `Google Classroom User (${selectedSubmission?.userId || 'Unknown'})`;
      const courseObj = courses.find(c => c.id === selectedCourse);
      const assignmentObj = assignments.find(w => w.id === selectedAssignment);
      const subject = `${courseObj?.name || 'Classroom Course'} - ${assignmentObj?.title || 'Assignment'}`;

      setStatusMessage(null);
      // Execute parent callback state loading pipeline
      onImport({
        questionPaperText: qpText,
        questionPaperImgMeta: qpImgMeta,
        answerSheetImgMeta: asImgMeta,
        answerSheetText: asText,
        studentName: sName,
        subject: subject
      });

      // Done
      onClose();
    } catch (err: any) {
      setErrMessage(err.message || 'File import failed.');
      setStatusMessage(null);
    } finally {
      setLoadingFile(null);
    }
  };

  const getStudentText = (userId: string) => {
    return studentsMap[userId] || `Student ID: ${userId.substring(0, 8)}...`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col text-left font-sans animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header bar */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gray-900 rounded-lg flex items-center justify-center text-white">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 tracking-tight">Import from Google Classroom</h3>
              <p className="text-[10px] text-gray-500 font-medium font-mono uppercase mt-0.5">Workspace Academic Portal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-950 rounded-lg transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Panel scroll area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {errMessage && (
            <div className="bg-red-50 border border-red-100/50 rounded-xl p-3.5 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{errMessage}</span>
            </div>
          )}

          {statusMessage && (
            <div className="bg-amber-50 border border-amber-100/50 rounded-xl p-3.5 text-xs text-amber-700 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-amber-600 flex-shrink-0" />
              <span className="font-medium">{statusMessage}</span>
            </div>
          )}

          {/* Panel 1: Check Auth Status */}
          {!currentUser ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto text-gray-400">
                <Lock className="w-7 h-7" />
              </div>
              <div className="max-w-sm mx-auto">
                <h4 className="text-sm font-bold text-gray-900">Authorize Classroom & Drive</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Sign in with your Google account to authorize secure loading of assignments and student file attachments directly from Google Classroom with permission.
                </p>
              </div>

              {/* standard materials Google Sign in button */}
              <button
                onClick={handleSignIn}
                className="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-medium text-xs transition-all active:scale-98/100 shadow-xs cursor-pointer"
              >
                {authLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white/80" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                )}
                Connect Google Account
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Connected details */}
              <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3 border border-gray-100 text-xs">
                <div className="flex items-center gap-2">
                  <img
                    src={currentUser.photoURL || ''}
                    alt={currentUser.displayName || ''}
                    className="w-6 h-6 rounded-full border border-gray-200"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="font-semibold text-gray-800">{currentUser.displayName}</span>
                    <span className="text-gray-400 font-mono text-[10px] ml-2">({currentUser.email})</span>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>

              {/* Wizard Selector Flow */}
              <div className="space-y-4">
                {/* 1. Course Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    1. Select Classroom Course
                  </label>
                  {loadingCourses ? (
                    <div className="flex items-center gap-2 py-2.5 text-xs text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-900" />
                      Loading active academic courses...
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        value={selectedCourse}
                        onChange={(e) => handleCourseChange(e.target.value)}
                        className="w-full text-xs px-3 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg outline-none cursor-pointer focus:border-gray-900 appearance-none font-medium"
                      >
                        <option value="">-- Choose active class course --</option>
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.section ? `(${c.section})` : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  )}
                </div>

                {/* 2. Assignment Selection */}
                {selectedCourse && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      2. Select Assignment (Coursework)
                    </label>
                    {loadingWork ? (
                      <div className="flex items-center gap-2 py-2.5 text-xs text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-900" />
                        Fetching course objectives and rubrics...
                      </div>
                    ) : (
                      <div className="relative">
                        <select
                          value={selectedAssignment}
                          onChange={(e) => handleAssignmentChange(e.target.value)}
                          className="w-full text-xs px-3 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg outline-none cursor-pointer focus:border-gray-900 appearance-none font-medium"
                        >
                          <option value="">-- Choose assignment coursework --</option>
                          {assignments.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.title}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Student Submissions List */}
                {selectedAssignment && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                    {/* Student List */}
                    <div className="space-y-1.5 text-left">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                        3. Identify Student Submission
                      </label>
                      {loadingSubmissions ? (
                        <div className="flex items-center gap-2 py-4 text-xs text-gray-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Pulling submitted sheets...
                        </div>
                      ) : submissions.length === 0 ? (
                        <div className="text-xs text-gray-400 bg-gray-50/50 p-4 border border-dashed rounded-lg text-center">
                          No student submissions found/submitted yet.
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                          {submissions.map((sub) => {
                            const isSelected = selectedSubmission?.id === sub.id;
                            const attachmentsCount = sub.assignmentSubmission?.attachments?.length || 0;

                            return (
                              <button
                                key={sub.id}
                                onClick={() => handleSubmissionSelect(sub)}
                                className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between ${
                                  isSelected
                                    ? 'bg-gray-900 text-white border-gray-900 shadow-xs'
                                    : 'bg-white border-gray-150 hover:bg-gray-50/50'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <User className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                                  <span className="font-semibold truncate">{getStudentText(sub.userId)}</span>
                                </div>
                                <span className={`text-[9px] font-mono whitespace-nowrap leading-none ${
                                  isSelected ? 'text-gray-200' : 'text-gray-400'
                                }`}>
                                  {attachmentsCount} attachments
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* File Attachment Target Selector */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                          4. Grading Targets Alignment
                        </label>

                        {selectedSubmission ? (
                          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 space-y-3 text-xs text-left">
                            {/* Question Paper Selector */}
                            <div>
                              <span className="text-[9px] font-mono font-bold text-gray-400 block uppercase mb-1">
                                Align Question Paper
                              </span>
                              {selectedQpFileName ? (
                                <div className="flex items-center gap-1.5 text-gray-800 font-semibold bg-white border rounded px-2.5 py-1.5 text-[11px] truncate">
                                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                                  <span className="truncate">{selectedQpFileName}</span>
                                </div>
                              ) : (
                                <div className="text-[10px] text-gray-400 italic">
                                  No file attached to assignment. Will automatically import assignment description guidelines instead.
                                </div>
                              )}
                            </div>

                            {/* Answer Sheet Selector */}
                            <div>
                              <span className="text-[9px] font-mono font-bold text-gray-400 block uppercase mb-1">
                                Align Answer Sheet
                              </span>
                              {selectedSubmission?.assignmentSubmission?.attachments &&
                              selectedSubmission.assignmentSubmission.attachments.length > 0 ? (
                                <div className="relative">
                                  <select
                                    value={selectedAsFileId}
                                    onChange={(e) => {
                                      const fid = e.target.value;
                                      setSelectedAsFileId(fid);
                                      const original = selectedSubmission.assignmentSubmission.attachments.find(
                                        (a: any) => a.driveFile?.id === fid
                                      );
                                      setSelectedAsFileName(original?.driveFile?.title || 'Answer Sheet');
                                    }}
                                    className="w-full text-[11px] px-2 py-1.5 bg-white border rounded outline-none focus:border-gray-900 font-medium"
                                  >
                                    {selectedSubmission.assignmentSubmission.attachments.map((att: any, index: number) => (
                                      <option key={index} value={att.driveFile?.id || ''}>
                                        {att.driveFile?.title || `File attachment ${index + 1}`}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ) : (
                                <div className="text-[10px] text-red-500 font-medium flex items-center gap-1 mt-1">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  Student has not submitted any attachments.
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="border border-dashed border-gray-200 rounded-xl p-6 bg-gray-50/50 text-center text-xs text-gray-400 select-none">
                            Select a student on the left to align files
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Area */}
        <div className="p-5 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            OAUTH CLASSRROOM SECURED
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 hover:bg-gray-100 text-gray-700 bg-white rounded-lg text-xs font-semibold select-none cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={executeImport}
              disabled={!selectedSubmission || !selectedAsFileId || !!loadingFile}
              className="px-4 py-2 rounded-lg bg-gray-950 text-white hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-400 text-xs font-semibold flex items-center gap-2 select-none cursor-pointer"
            >
              {loadingFile ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Downloading {loadingFile === 'question' ? 'Questions...' : 'Answer paper...'}
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Import Selected Files
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
