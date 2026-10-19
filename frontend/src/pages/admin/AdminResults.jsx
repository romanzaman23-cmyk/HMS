import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Upload,
  FileText,
  CheckCircle2,
  Search,
  Filter,
  Trash2,
  Eye,
  Download,
  AlertCircle,
  Loader2,
  Calendar,
  X,
  Paperclip,
  Calculator,
  RotateCcw,
  Printer,
  Sparkles,
  Award,
  ArrowRight,
  MessageSquare,
  Smartphone,
  Bell,
  Check,
  ShieldCheck
} from 'lucide-react';
import api from '../../services/api';

const DEFAULT_7_SUBJECTS = [
  { id: 1, subject: 'English', marks: '', total_marks: 100 },
  { id: 2, subject: 'Urdu', marks: '', total_marks: 100 },
  { id: 3, subject: 'Mathematics', marks: '', total_marks: 100 },
  { id: 4, subject: 'General Science', marks: '', total_marks: 100 },
  { id: 5, subject: 'Islamiat', marks: '', total_marks: 100 },
  { id: 6, subject: 'Social Studies', marks: '', total_marks: 100 },
  { id: 7, subject: 'Computer Studies', marks: '', total_marks: 100 }
];

const getSubjectGrade = (marks, total) => {
  const m = parseFloat(marks);
  const t = parseFloat(total) || 100;
  if (isNaN(m) || marks === '') return '-';
  const pct = t > 0 ? (m / t) * 100 : m;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  return 'F';
};

const getGradeBadgeClass = (grade) => {
  switch (grade) {
    case 'A+':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'A':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'B+':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'B':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'C':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'F':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-500 border-slate-200';
  }
};

export default function AdminResults() {
  const [activeTab, setActiveTab] = useState('documents'); // 'documents' or 'marks'
  const [results, setResults] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTermFilter, setSelectedTermFilter] = useState('ALL');

  // Modals
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState(null);

  // Automated Promotion Modal State
  const [promotionModalOpen, setPromotionModalOpen] = useState(false);
  const [promotionTerm, setPromotionTerm] = useState('Term 1 (2025-26)');
  const [promotionClassId, setPromotionClassId] = useState('');
  const [promotionThreshold, setPromotionThreshold] = useState(40);
  const [processingPromotion, setProcessingPromotion] = useState(false);
  const [promotionAuditResults, setPromotionAuditResults] = useState(null);

  // Feedback banners
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Form states for 7 subjects & attached document
  const [resultForm, setResultForm] = useState({
    student_id: '',
    class_id: '1',
    term: 'Term 1 (2025-26)',
    result_date: new Date().toISOString().slice(0, 10),
    auto_promote: true,
    subjects: DEFAULT_7_SUBJECTS.map((s) => ({ ...s }))
  });
  const [resultAttachFile, setResultAttachFile] = useState(null);
  const [resultDocTitle, setResultDocTitle] = useState('');
  const [savingResult, setSavingResult] = useState(false);
  const [resultError, setResultError] = useState('');

  const [uploadFile, setUploadFile] = useState(null);
  const [uploadStudentId, setUploadStudentId] = useState('');
  const [uploadTerm, setUploadTerm] = useState('Term 1 (2025-26)');
  const [uploadDocTitle, setUploadDocTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resRes, stuRes, clsRes, docRes] = await Promise.allSettled([
        api.get('/results'),
        api.get('/students'),
        api.get('/classes'),
        api.get('/results/documents')
      ]);

      if (resRes.status === 'fulfilled' && resRes.value.data.success) {
        setResults(resRes.value.data.results || []);
      }
      if (stuRes.status === 'fulfilled' && stuRes.value.data.success) {
        const studentList = stuRes.value.data.students || [];
        setStudents(studentList);
        if (studentList.length > 0) {
          setUploadStudentId((prev) => prev || String(studentList[0].id));
          setResultForm((prev) => ({
            ...prev,
            student_id: prev.student_id || String(studentList[0].id)
          }));
        }
      }
      if (clsRes.status === 'fulfilled' && clsRes.value.data.success) {
        setClasses(clsRes.value.data.classes || []);
      }
      if (docRes.status === 'fulfilled' && docRes.value.data.success) {
        setDocuments(docRes.value.data.documents || []);
      }
    } catch (err) {
      console.error('Error fetching results data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle View Document (Streams safely in new browser window)
  const handleViewDocument = (doc) => {
    if (!doc?.file_path && !doc?.id) return;
    const isImage = doc.file_path && /\.(png|jpe?g|webp|gif|svg)$/i.test(doc.file_path);
    if (isImage) {
      const streamUrl = doc.id ? `/api/results/documents/${doc.id}/download` : doc.file_path;
      window.open(streamUrl, '_blank');
    } else {
      const targetUrl = doc.id
        ? `/viewer.html?id=${doc.id}&type=result&title=${encodeURIComponent(doc.title || 'Result Document')}`
        : `/viewer.html?path=${encodeURIComponent(doc.file_path)}&title=${encodeURIComponent(doc.title || 'Result Document')}`;
      window.open(targetUrl, '_blank');
    }
  };

  // Handle Download Document (Downloads exact binary file with original title)
  const handleDownloadDocument = async (doc) => {
    setActionLoadingId(doc.id);
    try {
      const response = await api.get(`/results/documents/${doc.id}/download?download=1`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/octet-stream'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      let downloadName = doc.title || 'Result_Sheet.pdf';
      const fileExt = doc.file_path ? doc.file_path.split('.').pop() : 'pdf';
      if (!downloadName.includes('.')) {
        downloadName = `${downloadName}.${fileExt}`;
      }
      link.setAttribute('download', downloadName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download Document Error:', err);
      // Fallback direct link
      const token = localStorage.getItem('hms_token') || '';
      window.open(`/api/results/documents/${doc.id}/download?download=1&token=${encodeURIComponent(token)}`, '_blank');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Delete Document
  const confirmDelete = async () => {
    if (!deleteConfirmDoc) return;
    const docId = deleteConfirmDoc.id;
    setActionLoadingId(docId);
    try {
      const res = await api.delete(`/results/documents/${docId}`);
      if (res.data?.success) {
        setFeedback({ type: 'success', message: 'Result document deleted successfully.' });
        setTimeout(() => setFeedback(null), 4000);
        setDeleteConfirmDoc(null);
        fetchData();
      } else {
        alert(res.data?.message || 'Delete failed.');
      }
    } catch (err) {
      console.error('Delete Error:', err);
      alert(err.response?.data?.message || err.message || 'Failed to delete document.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStudentChange = (studentId) => {
    const selStudent = students.find((s) => String(s.id) === String(studentId));
    setResultForm((prev) => ({
      ...prev,
      student_id: studentId,
      class_id: selStudent?.class_id ? String(selStudent.class_id) : prev.class_id
    }));
  };

  const handleSubjectChange = (index, field, value) => {
    setResultForm((prev) => {
      const updated = [...prev.subjects];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, subjects: updated };
    });
  };

  const handleAddSubjectRow = () => {
    setResultForm((prev) => ({
      ...prev,
      subjects: [
        ...prev.subjects,
        { id: Date.now(), subject: '', marks: '', total_marks: 100 }
      ]
    }));
  };

  const handleRemoveSubjectRow = (index) => {
    setResultForm((prev) => {
      if (prev.subjects.length <= 1) return prev;
      const updated = prev.subjects.filter((_, i) => i !== index);
      return { ...prev, subjects: updated };
    });
  };

  const handleResetToDefault7 = () => {
    setResultForm((prev) => ({
      ...prev,
      subjects: DEFAULT_7_SUBJECTS.map((s) => ({ ...s }))
    }));
  };

  const handleResultSubmit = async (e) => {
    e.preventDefault();
    setResultError('');

    const filledSubjects = resultForm.subjects
      .filter((s) => s.subject.trim() && s.marks !== '' && !isNaN(parseFloat(s.marks)))
      .map((s) => ({
        subject: s.subject.trim(),
        marks: parseFloat(s.marks),
        total_marks: parseFloat(s.total_marks) || 100,
        grade: getSubjectGrade(s.marks, s.total_marks)
      }));

    if (filledSubjects.length === 0 && !resultAttachFile) {
      setResultError('Please enter marks for at least one subject or attach a result document.');
      return;
    }

    setSavingResult(true);
    try {
      const token = localStorage.getItem('hms_token') || '';
      const formData = new FormData();
      formData.append('student_id', resultForm.student_id || (students[0]?.id ? String(students[0].id) : '1'));
      formData.append('class_id', resultForm.class_id || '1');
      formData.append('term', resultForm.term);
      formData.append('result_date', resultForm.result_date);
      formData.append('auto_promote', resultForm.auto_promote !== false ? 'true' : 'false');
      formData.append('subjects', JSON.stringify(filledSubjects));

      if (resultAttachFile) {
        formData.append('file', resultAttachFile);
        formData.append('document_title', resultDocTitle.trim() || resultAttachFile.name);
      }

      const response = await fetch('/api/results', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const resData = await response.json();

      if (response.ok && resData.success) {
        setResultModalOpen(false);
        setResultAttachFile(null);
        setResultDocTitle('');
        setResultForm((prev) => ({
          ...prev,
          subjects: DEFAULT_7_SUBJECTS.map((s) => ({ ...s }))
        }));
        setFeedback({
          type: 'success',
          message: resData.message || `Recorded marks for ${filledSubjects.length} subjects successfully!`
        });
        setTimeout(() => setFeedback(null), 5000);
        fetchData();
      } else {
        setResultError(resData.message || 'Failed to save results.');
      }
    } catch (err) {
      console.error('Error saving result:', err);
      setResultError(err.message || 'Failed to save results.');
    } finally {
      setSavingResult(false);
    }
  };

  // Reliable native FormData upload handler
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadError('');

    if (!uploadFile) {
      setUploadError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('student_id', uploadStudentId || (students[0]?.id ? String(students[0].id) : '1'));
      formData.append('term', uploadTerm);
      formData.append('title', uploadDocTitle.trim() || uploadFile.name);

      const token = localStorage.getItem('hms_token') || '';

      // Use native browser fetch so the multipart boundary is 100% computed automatically
      const response = await fetch('/api/results/upload-document', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const resData = await response.json();

      if (response.ok && resData.success) {
        setUploadModalOpen(false);
        setUploadFile(null);
        setUploadDocTitle('');
        setActiveTab('documents');
        setFeedback({
          type: 'success',
          message: `Official result document "${resData.document?.title || 'Result Sheet'}" uploaded successfully!`
        });
        setTimeout(() => setFeedback(null), 5000);
        fetchData();
      } else {
        setUploadError(resData.message || 'Upload failed.');
      }
    } catch (err) {
      console.error('Upload Error:', err);
      setUploadError(err.message || 'File upload failed.');
    } finally {
      setUploading(false);
    }
  };

  // Filtered documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      !searchTerm ||
      (doc.title && doc.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.student_name && doc.student_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.class_name && doc.class_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTerm = selectedTermFilter === 'ALL' || doc.term === selectedTermFilter;
    return matchesSearch && matchesTerm;
  });

  // Filtered marks
  const filteredResults = results.filter((r) => {
    const matchesSearch =
      !searchTerm ||
      (r.student_name && r.student_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.subject && r.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.class_name && r.class_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTerm = selectedTermFilter === 'ALL' || r.term === selectedTermFilter;
    return matchesSearch && matchesTerm;
  });

  const handleExportMarksheetCSV = () => {
    const listToExport = filteredResults.length > 0 ? filteredResults : results;
    if (listToExport.length === 0) return alert('No academic result records to export.');

    const headers = ['Student Name', 'Class', 'Term', 'Subject', 'Marks Obtained', 'Total Marks', 'Grade', 'Performance'];
    const rows = listToExport.map(r => [
      `"${(r.student_name || '').replace(/"/g, '""')}"`,
      `"${r.class_name || ''}"`,
      `"${r.term || ''}"`,
      `"${r.subject || ''}"`,
      r.marks !== undefined ? r.marks : '',
      r.total_marks || 100,
      `"${r.grade || ''}"`,
      `"${r.performance_level || ''}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Highlight_School_Marksheet_${selectedTermFilter !== 'ALL' ? selectedTermFilter.replace(/\s+/g, '_') : 'All_Terms'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportDocumentsCSV = () => {
    const listToExport = filteredDocuments.length > 0 ? filteredDocuments : documents;
    if (listToExport.length === 0) return alert('No uploaded result documents to export.');

    const headers = ['Student Name', 'Class', 'Term', 'Document Title', 'File Size', 'Upload Date'];
    const rows = listToExport.map(d => [
      `"${(d.student_name || '').replace(/"/g, '""')}"`,
      `"${d.class_name || ''}"`,
      `"${d.term || ''}"`,
      `"${(d.title || '').replace(/"/g, '""')}"`,
      `"${d.file_size_formatted || ''}"`,
      `"${d.upload_date || ''}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Highlight_Result_Documents_Register.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in slide-in-from-top-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 text-xs px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Academic Results Management
          </h2>
          <p className="text-xs text-slate-500">
            Upload verified term result sheets & report cards for parents, and record subject marks
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Export CSV Button */}
          <button
            onClick={activeTab === 'marks' ? handleExportMarksheetCSV : handleExportDocumentsCSV}
            className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-2"
            title="Download records to CSV spreadsheet"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* Print Report Button */}
          <button
            onClick={handlePrintReport}
            className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-2"
            title="Print examination summary report"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Report</span>
          </button>

          {/* Auto Promote & Parent Alerts Action */}
          <button
            onClick={() => {
              setPromotionAuditResults(null);
              setPromotionModalOpen(true);
            }}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 active:scale-95"
            title="Automated next-class promotion for passing students and retention for failing students"
          >
            <Sparkles className="w-4 h-4" />
            <span>Auto-Promote & Alerts</span>
          </button>

          <button
            onClick={() => {
              setUploadError('');
              setUploadModalOpen(true);
            }}
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Result Sheet PDF</span>
          </button>

          <button
            onClick={() => {
              setResultError('');
              setResultModalOpen(true);
            }}
            className="px-3.5 py-2.5 bg-[#1a73e8] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student Results (7 Subjects + File)</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'documents'
                ? 'bg-[#1a73e8] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Uploaded Result Sheets</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'documents'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {documents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('marks')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'marks'
                ? 'bg-[#1a73e8] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Subject Marks Records</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'marks'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {results.length}
            </span>
          </button>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student, class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-56"
            />
          </div>

          <select
            value={selectedTermFilter}
            onChange={(e) => setSelectedTermFilter(e.target.value)}
            className="py-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none"
          >
            <option value="ALL">All Terms</option>
            <option value="Term 1 (2025-26)">Term 1 (2025-26)</option>
            <option value="Term 2 (2025-26)">Term 2 (2025-26)</option>
            <option value="Final Term (2025-26)">Final Term (2025-26)</option>
          </select>
        </div>
      </div>

      {/* TAB 1: Uploaded Result Documents */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Official Result Documents & PDFs
              </h3>
              <p className="text-xs text-slate-500">
                These verified documents appear directly in the Parent Portal for report viewing and download
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
              {filteredDocuments.length} files available
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6 font-semibold">Student Name</th>
                  <th className="py-4 px-6 font-semibold">Class</th>
                  <th className="py-4 px-6 font-semibold">Term</th>
                  <th className="py-4 px-6 font-semibold">Document Title</th>
                  <th className="py-4 px-6 font-semibold">File Size</th>
                  <th className="py-4 px-6 font-semibold">Uploaded Date</th>
                  <th className="py-4 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400 text-xs">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span>Loading uploaded result documents...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-14 text-center">
                      <div className="max-w-xs mx-auto space-y-3">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl text-blue-600 flex items-center justify-center mx-auto">
                          <FileText className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-slate-800">
                          No Result Sheet Uploaded Yet
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Upload official PDF result sheets so parents can view and download them from their portal.
                        </p>
                        <button
                          onClick={() => {
                            setUploadError('');
                            setUploadModalOpen(true);
                          }}
                          className="px-4 py-2 bg-[#1a73e8] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-2"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Now</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {doc.student_name ? doc.student_name.slice(0, 1).toUpperCase() : 'S'}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-slate-900">
                              {doc.student_name || 'Student'}
                            </p>
                            {doc.roll_number && (
                              <p className="text-[10px] text-slate-400 font-mono">
                                Roll: {doc.roll_number}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-600 text-xs font-medium">
                        {doc.class_name || 'Grade 5'}
                      </td>
                      <td className="py-4 px-6 text-slate-700 text-xs font-medium">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {doc.term}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-800">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-rose-500 flex-shrink-0" />
                          <span className="text-xs truncate max-w-xs">{doc.title}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-xs font-bold text-slate-500 font-mono">
                        {doc.file_size_formatted || '1.2 MB'}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500">
                        {doc.uploaded_at || 'Recently'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Button */}
                          <button
                            type="button"
                            onClick={() => handleViewDocument(doc)}
                            title="View Document in New Window"
                            className="px-2.5 py-1.5 rounded-lg text-blue-600 bg-blue-50/80 hover:bg-blue-100 font-semibold text-xs transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>

                          {/* Download Button */}
                          <button
                            type="button"
                            disabled={actionLoadingId === doc.id}
                            onClick={() => handleDownloadDocument(doc)}
                            title="Download Document to Computer"
                            className="px-2.5 py-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-semibold text-xs transition-colors flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            disabled={actionLoadingId === doc.id}
                            onClick={() => setDeleteConfirmDoc(doc)}
                            title="Delete Document"
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 font-semibold text-xs transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Subject Marks Table */}
      {activeTab === 'marks' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Individual Subject Examination Records
              </h3>
              <p className="text-xs text-slate-500">
                Detailed marks by subject, grade computation, and performance grading
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
              {filteredResults.length} records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6 font-semibold">Student</th>
                  <th className="py-4 px-6 font-semibold">Class</th>
                  <th className="py-4 px-6 font-semibold">Term</th>
                  <th className="py-4 px-6 font-semibold">Subject</th>
                  <th className="py-4 px-6 font-semibold">Marks</th>
                  <th className="py-4 px-6 font-semibold">Grade</th>
                  <th className="py-4 px-6 font-semibold text-right">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400 text-xs">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span>Loading academic records...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400 text-xs">
                      No subject marks found. Click "+ Add Subject Marks" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredResults.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        {r.student_name || 'Ahmed Khan'}
                      </td>
                      <td className="py-4 px-6 text-slate-600 text-xs font-medium">
                        {r.class_name || 'Grade 5'}
                      </td>
                      <td className="py-4 px-6 text-slate-700 text-xs font-medium">
                        {r.term}
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-800">
                        {r.subject}
                      </td>
                      <td className="py-4 px-6 text-xs font-bold text-slate-900 font-mono">
                        {r.marks} / {r.total_marks || 100}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-[#1a73e8]">
                          {r.grade}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right text-xs font-medium text-emerald-600">
                        {r.overall_performance || 'Excellent'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmDoc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Delete Result Document?
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Are you sure you want to permanently delete <strong className="text-slate-800">"{deleteConfirmDoc.title}"</strong> for {deleteConfirmDoc.student_name}? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmDoc(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoadingId === deleteConfirmDoc.id}
                onClick={confirmDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
              >
                {actionLoadingId === deleteConfirmDoc.id ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Document</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add 7-Subjects & Result Document Modal */}
      {resultModalOpen && (() => {
        const filledSubs = resultForm.subjects.filter(
          (s) => s.marks !== '' && !isNaN(parseFloat(s.marks))
        );
        const totalObt = filledSubs.reduce((sum, s) => sum + parseFloat(s.marks), 0);
        const totalMax = filledSubs.reduce((sum, s) => sum + (parseFloat(s.total_marks) || 100), 0);
        const overallPct = totalMax > 0 ? ((totalObt / totalMax) * 100).toFixed(1) : '0';
        const overallGrd = totalMax > 0 ? getSubjectGrade(totalObt, totalMax) : '-';

        return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-5 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95">
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 shadow-xs">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                      Record Student Term Results (7 Subjects)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Enter examination marks across all subjects and optionally attach an official result sheet / report card.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setResultModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form onSubmit={handleResultSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="overflow-y-auto p-5 sm:p-7 space-y-6 flex-1">
                  {/* Error Alert */}
                  {resultError && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{resultError}</span>
                    </div>
                  )}

                  {/* Student, Term & Date Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Select Student
                      </label>
                      <select
                        value={resultForm.student_id}
                        onChange={(e) => handleStudentChange(e.target.value)}
                        className="w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                      >
                        {students.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.full_name} ({s.class_name || 'Grade 5'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Term / Examination
                      </label>
                      <select
                        value={resultForm.term}
                        onChange={(e) => setResultForm({ ...resultForm, term: e.target.value })}
                        className="w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                      >
                        <option value="Term 1 (2025-26)">Term 1 (2025-26)</option>
                        <option value="Term 2 (2025-26)">Term 2 (2025-26)</option>
                        <option value="Final Term (2025-26)">Final Term (2025-26)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Result / Exam Date
                      </label>
                      <input
                        type="date"
                        value={resultForm.result_date}
                        onChange={(e) => setResultForm({ ...resultForm, result_date: e.target.value })}
                        className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* 7 Subjects Table Section */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <span>Subject Examination Marks</span>
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold">
                            {resultForm.subjects.length} Subjects
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Pre-filled with 7 standard curriculum subjects. Modify names or add/remove rows as needed.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleResetToDefault7}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset 7 Default</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleAddSubjectRow}
                          className="px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Add Subject</span>
                        </button>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                              <th className="py-3 px-3 w-10 text-center">#</th>
                              <th className="py-3 px-4 font-bold">Subject Name</th>
                              <th className="py-3 px-4 font-bold w-36">Marks Obtained</th>
                              <th className="py-3 px-4 font-bold w-28">Total Marks</th>
                              <th className="py-3 px-4 font-bold w-24 text-center">Grade</th>
                              <th className="py-3 px-3 w-12 text-center"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {resultForm.subjects.map((sub, idx) => {
                              const grade = getSubjectGrade(sub.marks, sub.total_marks);
                              return (
                                <tr key={sub.id || idx} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="py-2.5 px-3 text-center text-slate-400 font-mono font-bold text-xs">
                                    {idx + 1}
                                  </td>
                                  <td className="py-2.5 px-4">
                                    <input
                                      type="text"
                                      required
                                      value={sub.subject}
                                      onChange={(e) => handleSubjectChange(idx, 'subject', e.target.value)}
                                      placeholder="e.g. Mathematics"
                                      className="w-full py-1.5 px-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                                    />
                                  </td>
                                  <td className="py-2.5 px-4">
                                    <input
                                      type="number"
                                      step="0.5"
                                      min="0"
                                      max={sub.total_marks || 100}
                                      value={sub.marks}
                                      onChange={(e) => handleSubjectChange(idx, 'marks', e.target.value)}
                                      placeholder="e.g. 85"
                                      className="w-full py-1.5 px-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                                    />
                                  </td>
                                  <td className="py-2.5 px-4">
                                    <input
                                      type="number"
                                      min="1"
                                      value={sub.total_marks}
                                      onChange={(e) => handleSubjectChange(idx, 'total_marks', e.target.value)}
                                      className="w-full py-1.5 px-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                                    />
                                  </td>
                                  <td className="py-2.5 px-4 text-center">
                                    <span
                                      className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${getGradeBadgeClass(
                                        grade
                                      )}`}
                                    >
                                      {grade}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    {resultForm.subjects.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveSubjectRow(idx)}
                                        title="Remove subject"
                                        className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Live Calculation Summary Banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-100">
                    <div className="p-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Subjects Filled
                      </span>
                      <p className="text-base font-extrabold text-slate-800">
                        {filledSubs.length} / {resultForm.subjects.length}
                      </p>
                    </div>

                    <div className="p-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Total Marks
                      </span>
                      <p className="text-base font-extrabold text-slate-900 font-mono">
                        {totalObt} <span className="text-xs text-slate-400 font-normal">/ {totalMax}</span>
                      </p>
                    </div>

                    <div className="p-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Percentage
                      </span>
                      <p className="text-base font-extrabold text-blue-700 font-mono">
                        {overallPct}%
                      </p>
                    </div>

                    <div className="p-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Overall Grade
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`px-3 py-1 rounded-xl text-xs font-black border ${getGradeBadgeClass(
                            overallGrd
                          )}`}
                        >
                          {overallGrd}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Automatic Promotion & Parent Alerts Toggle */}
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-xs">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <span>Automatic Promotion & WhatsApp / Web Alert</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                            Active
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Student pass ($\ge 40\%$) hone par automatically agli class me promote hoga; fail hone par usi class me rahega. Parent ko Web Notification aur WhatsApp/SMS alert foran dispatch hoga.
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={resultForm.auto_promote !== false}
                        onChange={(e) => setResultForm({ ...resultForm, auto_promote: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {/* File Attachment Section */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-blue-600" />
                        <h4 className="text-xs font-bold text-slate-900">
                          Attach Result Sheet / Marksheet Document (PDF / Image)
                        </h4>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          Optional
                        </span>
                      </div>
                      {resultAttachFile && (
                        <button
                          type="button"
                          onClick={() => {
                            setResultAttachFile(null);
                            setResultDocTitle('');
                          }}
                          className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                        >
                          Remove File
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500">
                      Attach the verified exam sheet, report card PDF, or scanned result document. Parents will be able to view and download it directly.
                    </p>

                    {!resultAttachFile ? (
                      <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-white rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                        <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-600 mb-1.5 transition-colors" />
                        <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600">
                          Click to select Result Sheet PDF or Image
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1">
                          Supported: PDF, PNG, JPG, JPEG, WebP, Word Doc (Up to 100MB)
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files[0];
                            if (f) {
                              setResultAttachFile(f);
                              if (!resultDocTitle) setResultDocTitle(f.name);
                            }
                          }}
                        />
                      </label>
                    ) : (
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {resultAttachFile.name}
                            </p>
                            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                              ✓ {(resultAttachFile.size / (1024 * 1024) > 1
                                ? `${(resultAttachFile.size / (1024 * 1024)).toFixed(1)} MB`
                                : `${Math.round(resultAttachFile.size / 1024)} KB`)} • Attached and ready
                            </p>
                          </div>
                        </div>

                        <div className="sm:w-64">
                          <input
                            type="text"
                            placeholder="Document Title (e.g. Final Term Marksheet)"
                            value={resultDocTitle}
                            onChange={(e) => setResultDocTitle(e.target.value)}
                            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sticky Modal Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
                  <span className="text-xs text-slate-500 hidden sm:inline">
                    {filledSubs.length} of {resultForm.subjects.length} subjects have marks entered
                  </span>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      disabled={savingResult}
                      onClick={() => setResultModalOpen(false)}
                      className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200/50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingResult}
                      className="px-6 py-2.5 bg-[#1a73e8] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                      {savingResult ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving & Publishing Results...</span>
                        </>
                      ) : (
                        <>
                          <GraduationCap className="w-4 h-4" />
                          <span>Save & Publish All Results</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Upload Document / PDF Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Upload Official Result Sheet
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Attach verified PDF report cards, exam papers, or scanned marksheets for parents.
            </p>

            {uploadError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Student</label>
                <select
                  value={uploadStudentId}
                  onChange={(e) => setUploadStudentId(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.class_name || 'Grade 5'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Term</label>
                <select
                  value={uploadTerm}
                  onChange={(e) => setUploadTerm(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="Term 1 (2025-26)">Term 1 (2025-26)</option>
                  <option value="Term 2 (2025-26)">Term 2 (2025-26)</option>
                  <option value="Final Term (2025-26)">Final Term (2025-26)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Title <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Term 1 Official Marksheet.pdf"
                  value={uploadDocTitle}
                  onChange={(e) => setUploadDocTitle(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Choose PDF / Image / Document <span className="text-slate-400 font-normal">(Up to 100MB)</span>
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                  onChange={(e) => {
                    const f = e.target.files[0];
                    setUploadFile(f || null);
                    if (f && !uploadDocTitle) {
                      setUploadDocTitle(f.name);
                    }
                  }}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {uploadFile && (
                  <p className="mt-1 text-[11px] text-emerald-600 font-mono">
                    Selected: {uploadFile.name} ({(uploadFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => {
                    setUploadModalOpen(false);
                    setUploadError('');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading & Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload & Publish</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Automated Promotion & Results Processing Modal */}
      {promotionModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500 text-white rounded-2xl shadow-xs">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Automated Class Promotion & Parent Alerts
                  </h3>
                  <p className="text-xs text-slate-500">
                    Automatic next grade promotion for passing students and class retention for failing students
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPromotionModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Config Form */}
            <div className="space-y-4 my-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Examination Term
                  </label>
                  <select
                    value={promotionTerm}
                    onChange={(e) => setPromotionTerm(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    <option value="Term 1 (2025-26)">Term 1 (2025-26)</option>
                    <option value="Term 2 (2025-26)">Term 2 (2025-26)</option>
                    <option value="Final Term (2025-26)">Final Term (2025-26)</option>
                    <option value="Annual Exam (2025-26)">Annual Exam (2025-26)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Class Scope
                  </label>
                  <select
                    value={promotionClassId}
                    onChange={(e) => setPromotionClassId(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    <option value="">All School Classes ({classes.length} Classes)</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} {cls.section ? `(${cls.section})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Passing Percentage Threshold (% Marks to Promote)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="30"
                    max="60"
                    value={promotionThreshold}
                    onChange={(e) => setPromotionThreshold(parseInt(e.target.value, 10) || 40)}
                    className="w-28 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 text-center"
                  />
                  <span className="text-xs text-slate-500 font-medium">
                    Students scoring $\ge$ {promotionThreshold}% with no failed subjects will be <strong>PROMOTED</strong>.
                  </span>
                </div>
              </div>

              {/* Information Alert Box */}
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs space-y-2">
                <div className="font-bold flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span>Automatic Notifications Behavior:</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-blue-800">
                  <li><strong>Agar Bacha Pass Ho:</strong> Agli class me promote hoga aur Walidain ko WhatsApp SMS + In-app notification mubarakbaad ke sath jayegi.</li>
                  <li><strong>Agar Bacha Fail Ho:</strong> Wahi class repeat karega aur Walidain ko WhatsApp SMS + In-app notification alert jayegi taake mazeed tawajjo dein.</li>
                </ul>
              </div>

              {/* Action Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  disabled={processingPromotion}
                  onClick={async () => {
                    setProcessingPromotion(true);
                    setPromotionAuditResults(null);
                    try {
                      const res = await api.post('/results/process-promotion', {
                        term: promotionTerm,
                        class_id: promotionClassId || undefined,
                        passing_percentage: promotionThreshold
                      });
                      if (res.data.success) {
                        setPromotionAuditResults(res.data);
                        fetchData();
                        setFeedback({
                          type: 'success',
                          message: res.data.message
                        });
                      }
                    } catch (err) {
                      console.error('Promotion Processing Error:', err);
                      alert(err.response?.data?.message || err.message || 'Failed to process promotions.');
                    } finally {
                      setProcessingPromotion(false);
                    }
                  }}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 active:scale-95"
                >
                  {processingPromotion ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing Term Results & Dispatching Alerts...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Run Auto-Promotion & Send Parent Alerts</span>
                    </>
                  )}
                </button>
              </div>

              {/* Promotion Results Breakdown */}
              {promotionAuditResults && (
                <div className="mt-6 pt-5 border-t border-slate-200 space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Evaluated</div>
                      <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
                        {promotionAuditResults.evaluated_count}
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                      <div className="text-[10px] font-bold text-emerald-600 uppercase">Promoted</div>
                      <div className="text-lg font-black text-emerald-700 font-mono mt-0.5">
                        {promotionAuditResults.promoted_count}
                      </div>
                    </div>
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl">
                      <div className="text-[10px] font-bold text-rose-600 uppercase">Retained</div>
                      <div className="text-lg font-black text-rose-700 font-mono mt-0.5">
                        {promotionAuditResults.retained_count}
                      </div>
                    </div>
                  </div>

                  {/* Student Table */}
                  <div className="overflow-x-auto max-h-60 rounded-2xl border border-slate-200">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] sticky top-0">
                        <tr>
                          <th className="p-2.5">Student</th>
                          <th className="p-2.5">Class Transition</th>
                          <th className="p-2.5 text-center">Marks %</th>
                          <th className="p-2.5 text-center">Status</th>
                          <th className="p-2.5 text-right">Alerts</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(promotionAuditResults.results || []).map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-2.5 font-bold text-slate-900">
                              {item.student_name}
                              <span className="block text-[10px] font-mono text-slate-400">Roll: {item.roll_number}</span>
                            </td>
                            <td className="p-2.5 font-medium">
                              <span className="text-slate-500">{item.previous_class}</span>
                              <span className="mx-1 text-slate-300">➔</span>
                              <span className={`font-bold ${item.is_passed ? 'text-emerald-700' : 'text-slate-700'}`}>
                                {item.new_class}
                              </span>
                            </td>
                            <td className="p-2.5 text-center font-mono font-bold">
                              {item.percentage}% ({item.grade})
                            </td>
                            <td className="p-2.5 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  item.is_passed
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td className="p-2.5 text-right">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                                <Check className="w-3 h-3" /> Web & WA Sent
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setPromotionModalOpen(false)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
