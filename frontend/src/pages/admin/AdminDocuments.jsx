import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Download,
  Eye,
  Plus,
  Calendar,
  ShieldCheck,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
  User,
  GraduationCap,
  HardDrive,
  Tag,
  Printer,
  Award
} from 'lucide-react';
import api from '../../services/api';
import PdfCanvasViewer from '../../components/PdfCanvasViewer';
import DocxViewer from '../../components/DocxViewer';
import BirthCertificateModal from '../../components/BirthCertificateModal';

export default function AdminDocuments() {
  const [documents, setDocuments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteDoc, setDeleteDoc] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [birthCertModalOpen, setBirthCertModalOpen] = useState(false);

  const [form, setForm] = useState({
    student_id: '',
    title: '',
    category: 'Academic Record'
  });
  const [file, setFile] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [docRes, stuRes] = await Promise.allSettled([
        api.get('/documents'),
        api.get('/students')
      ]);
      if (docRes.status === 'fulfilled' && docRes.value.data.success) {
        setDocuments(docRes.value.data.documents || []);
      }
      if (stuRes.status === 'fulfilled' && stuRes.value.data.success) {
        const studentList = stuRes.value.data.students || [];
        setStudents(studentList);
        if (studentList.length > 0) {
          setForm((prev) => ({
            ...prev,
            student_id: prev.student_id || String(studentList[0].id)
          }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleView = (doc) => {
    // Open preview modal showing document details and inline preview
    setPreviewDoc(doc);
  };

  const openInNewTab = (doc) => {
    if (!doc?.id && !doc?.file_path) return;
    const isImage = doc.file_path && /\.(png|jpe?g|webp|gif|svg)$/i.test(doc.file_path);
    if (isImage) {
      const streamUrl = doc.id ? `/api/documents/${doc.id}/download` : doc.file_path;
      window.open(streamUrl, '_blank');
    } else {
      const targetUrl = doc.id
        ? `/viewer.html?id=${doc.id}&title=${encodeURIComponent(doc.title || 'Document')}`
        : `/viewer.html?path=${encodeURIComponent(doc.file_path)}&title=${encodeURIComponent(doc.title || 'Document')}`;
      window.open(targetUrl, '_blank');
    }
  };

  const handleDownload = async (doc) => {
    setActionId(doc.id);
    try {
      const res = await api.get(`/documents/${doc.id}/download?download=1`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], {
        type: res.headers['content-type'] || 'application/octet-stream'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      let downloadName = doc.title || 'Document.pdf';
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
      console.error('Download error:', err);
      // Fallback direct window (no token needed)
      window.open(`/api/documents/${doc.id}/download?download=1`, '_blank');
    } finally {
      setActionId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteDoc) return;
    setActionId(deleteDoc.id);
    try {
      const res = await api.delete(`/documents/${deleteDoc.id}`);
      if (res.data?.success) {
        setFeedback({ type: 'success', message: 'Document deleted successfully.' });
        setTimeout(() => setFeedback(null), 4000);
        setDeleteDoc(null);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setActionId(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert('Please select a document file.');

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('student_id', form.student_id || (students[0]?.id ? String(students[0].id) : '1'));
      formData.append('title', form.title.trim() || file.name);
      formData.append('category', form.category);

      const token = localStorage.getItem('hms_token') || '';
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      const resData = await response.json();

      if (response.ok && resData.success) {
        setModalOpen(false);
        setFile(null);
        setForm({
          student_id: students[0]?.id ? String(students[0].id) : '1',
          title: '',
          category: 'Academic Record'
        });
        setFeedback({ type: 'success', message: 'Document uploaded successfully.' });
        setTimeout(() => setFeedback(null), 4000);
        fetchData();
      } else {
        alert(resData.message || 'Upload failed.');
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleExportDocumentsCSV = () => {
    if (documents.length === 0) return alert('No document records to export.');
    const headers = ['Document Title', 'Student Name', 'Category', 'File Size', 'Upload Date', 'File Format'];
    const rows = documents.map(d => [
      `"${(d.title || '').replace(/"/g, '""')}"`,
      `"${(d.student_name || '').replace(/"/g, '""')}"`,
      `"${d.category || 'Academic Record'}"`,
      `"${d.file_size_formatted || ''}"`,
      `"${d.upload_date || ''}"`,
      `"${d.file_extension || ''}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Highlight_Documents_Registry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintDocuments = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in border ${feedback.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Student Academic Documents
          </h2>
          <p className="text-xs text-slate-500">
            Securely upload certificates, performance assessments, and official school papers
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportDocumentsCSV}
            className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-2"
            title="Download documents registry as CSV"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrintDocuments}
            className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-2"
            title="Print documents registry"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Report</span>
          </button>

          <button
            onClick={() => setBirthCertModalOpen(true)}
            className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 active:scale-95"
            title="Automatically generate, customize and print Date of Birth Certificate"
          >
            <Award className="w-4 h-4" />
            <span>Generate Birth Certificate</span>
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 bg-[#1a73e8] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-slate-400 text-xs">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Loading student documents...</span>
            </div>
          </div>
        ) : documents.length === 0 ? (
          <div className="col-span-3 py-14 text-center">
            <div className="max-w-xs mx-auto space-y-3">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl text-blue-600 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-800">No Academic Documents Uploaded</p>
              <p className="text-[11px] text-slate-400">
                Upload student certificates, exam papers, or official verification documents.
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="px-4 py-2 bg-[#1a73e8] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-2"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Now</span>
              </button>
            </div>
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="p-3 rounded-2xl bg-blue-50 text-[#1a73e8]">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {doc.category || 'Academic Record'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug mb-1">
                  {doc.title}
                </h3>
                <p className="text-xs font-medium text-slate-500">
                  Student: <span className="text-slate-800 font-semibold">{doc.student_name || 'Student'}</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                  Size: {doc.file_size_formatted || '1.8 MB'}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {doc.uploaded_at ? String(doc.uploaded_at).slice(0, 10) : 'Recently'}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleView(doc)}
                    className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1a73e8] text-xs font-bold transition-colors inline-flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownload(doc)}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors inline-flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteDoc(doc)}
                    className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteDoc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Delete Document?
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Are you sure you want to permanently delete <strong className="text-slate-800">"{deleteDoc.title}"</strong>?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteDoc(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionId === deleteDoc.id}
                onClick={confirmDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
              >
                {actionId === deleteDoc.id ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Details & Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-4xl w-full shadow-2xl border border-slate-100 my-auto max-h-[95vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                    ID #{previewDoc.id}
                  </span>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {previewDoc.category || 'Academic Record'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 leading-tight">
                  {previewDoc.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Full Details Grid ("Whole Data") */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-slate-100 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                  <User className="w-3 h-3 text-blue-500" /> Student
                </span>
                <p className="font-bold text-slate-800 mt-1 truncate">
                  {previewDoc.student_name || 'Student'}
                </p>
                {previewDoc.roll_number && (
                  <p className="text-[10px] text-slate-400 font-mono">Roll: {previewDoc.roll_number}</p>
                )}
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                  <GraduationCap className="w-3 h-3 text-indigo-500" /> Class / Grade
                </span>
                <p className="font-bold text-slate-800 mt-1 truncate">
                  {previewDoc.class_name || 'Standard'}
                </p>
                <p className="text-[10px] text-slate-400">Class Record</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-emerald-500" /> File Size
                </span>
                <p className="font-bold text-slate-800 mt-1 font-mono">
                  {previewDoc.file_size_formatted || 'N/A'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {previewDoc.file_path ? previewDoc.file_path.split('.').pop().toUpperCase() : 'PDF'}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-amber-500" /> Uploaded On
                </span>
                <p className="font-bold text-slate-800 mt-1 font-mono">
                  {previewDoc.uploaded_at ? String(previewDoc.uploaded_at).slice(0, 10) : 'Recent'}
                </p>
                <p className="text-[10px] text-slate-400">Official Record</p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between gap-2 py-3">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                Document Content Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openInNewTab(previewDoc)}
                  className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1a73e8] rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in New Tab</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(previewDoc)}
                  disabled={actionId === previewDoc.id}
                  className="px-3.5 py-1.5 bg-[#1a73e8] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-1.5"
                >
                  {actionId === previewDoc.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Document Preview Area */}
            <div className="flex-1 overflow-auto rounded-2xl border border-slate-200 bg-slate-50/50 p-2 min-h-[380px] flex items-center justify-center">
              {((previewDoc.file_path && previewDoc.file_path.toLowerCase().endsWith('.pdf')) || previewDoc.file_type === 'application/pdf') ? (
                <PdfCanvasViewer
                  docId={previewDoc.id}
                  filePath={previewDoc.file_path}
                  url={previewDoc.id ? `/api/documents/${previewDoc.id}/download` : previewDoc.file_path}
                  title={previewDoc.title}
                  onDownload={() => handleDownload(previewDoc)}
                />
              ) : (previewDoc.file_path && /\.(docx|doc)$/i.test(previewDoc.file_path)) ? (
                <DocxViewer
                  url={previewDoc.id ? `/api/documents/${previewDoc.id}/download` : previewDoc.file_path}
                  title={previewDoc.title}
                  onDownload={() => handleDownload(previewDoc)}
                />
              ) : (previewDoc.file_path && /\.(html|htm)$/i.test(previewDoc.file_path)) || previewDoc.file_type === 'text/html' ? (
                <div className="w-full h-[550px] bg-white rounded-xl overflow-hidden shadow-xs border border-slate-200">
                  <iframe
                    src={previewDoc.id ? `/api/documents/${previewDoc.id}/download` : previewDoc.file_path}
                    title={previewDoc.title}
                    className="w-full h-full border-none"
                  />
                </div>
              ) : previewDoc.file_path && /\.(png|jpe?g|webp|gif|svg)$/i.test(previewDoc.file_path) ? (
                <div className="w-full h-[450px] flex items-center justify-center p-4 bg-white rounded-xl">
                  <img
                    src={previewDoc.id ? `/api/documents/${previewDoc.id}/download` : previewDoc.file_path}
                    alt={previewDoc.title}
                    className="max-h-[420px] max-w-full object-contain rounded-xl shadow-xs"
                  />
                </div>
              ) : (
                <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center p-6 text-center bg-white rounded-xl">
                  <FileText className="w-12 h-12 text-slate-400 mb-2" />
                  <p className="text-sm font-bold text-slate-800 mb-1">{previewDoc.title}</p>
                  <p className="text-xs text-slate-500 mb-4">{previewDoc.file_size_formatted || 'File size unknown'}</p>
                  <button
                    type="button"
                    onClick={() => handleDownload(previewDoc)}
                    className="px-4 py-2 bg-[#1a73e8] hover:bg-blue-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File</span>
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>File: {previewDoc.file_path ? previewDoc.file_path.split('/').pop() : 'N/A'}</span>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
{/* Upload Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Upload Student Document
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Securely link an academic certificate or report to a student's profile.
            </p>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Student</label>
                <select
                  value={form.student_id}
                  onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name} ({s.class_name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Annual Character & Conduct Certificate"
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                >
                  <option value="Academic Record">Academic Record</option>
                  <option value="Certificate">Certificate</option>
                  <option value="Medical Report">Medical Report</option>
                  <option value="ID Verification">ID Verification</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Choose File <span className="text-slate-400 font-normal">(Up to 100MB)</span>
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2.5 bg-[#1a73e8] hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <span>Upload Document</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Birth Certificate Generator Modal */}
      <BirthCertificateModal
        isOpen={birthCertModalOpen}
        onClose={() => setBirthCertModalOpen(false)}
        students={students}
        onCertificateSaved={() => {
          fetchData();
          setFeedback({ type: 'success', message: 'Date of Birth Certificate saved to student records!' });
        }}
      />
    </div>
  );
}
