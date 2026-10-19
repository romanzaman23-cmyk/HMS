import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Download,
  Eye,
  Calendar,
  X,
  ExternalLink,
  Loader2,
  HardDrive,
  Award,
  ArrowLeft,
  BookOpen
} from 'lucide-react';
import api from '../../services/api';
import PdfCanvasViewer from '../../components/PdfCanvasViewer';
import DocxViewer from '../../components/DocxViewer';

export default function ParentDocuments() {
  const [documents, setDocuments] = useState([]);
  const [childInfo, setChildInfo] = useState({ name: 'Student' });
  const [loading, setLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    async function loadDocs() {
      setLoading(true);
      try {
        const stuRes = await api.get('/students');
        const stuList = stuRes.data?.students || [];
        let child = stuList[0];
        try {
          const cached = localStorage.getItem('hms_active_child');
          if (cached) {
            const parsed = JSON.parse(cached);
            const found = stuList.find(c => String(c.id) === String(parsed.id));
            if (found) child = found;
          }
        } catch (e) {}

        if (child) {
          setChildInfo({ name: child.full_name });
        }
        const res = await api.get('/documents');
        if (res.data && res.data.success) {
          setDocuments(res.data.documents || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDocs();

    const handleChildChanged = () => {
      loadDocs();
    };
    window.addEventListener('hms_active_child_changed', handleChildChanged);
    return () => window.removeEventListener('hms_active_child_changed', handleChildChanged);
  }, []);

  const handleView = (doc) => {
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
    setDownloadingId(doc.id);
    try {
      if (doc.id) {
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
      } else if (doc.file_path) {
        window.open(doc.file_path, '_blank');
      }
    } catch (err) {
      console.error(err);
      if (doc?.id) {
        window.open(`/api/documents/${doc.id}/download?download=1`, '_blank');
      } else {
        alert('Failed to download document.');
      }
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-4 max-w-full">
      {/* App Header Banner (English Only) */}
      <div className="bg-white rounded-3xl p-4 border border-cyan-100 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/parent/dashboard"
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex-shrink-0"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-500 text-white flex items-center justify-center shadow-md shadow-cyan-500/20 flex-shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                Books & Documents
              </h2>
              <span className="text-[10px] font-bold text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded-full">
                {documents.length} Files
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
              Syllabus and documents for <span className="font-bold text-slate-800">{childInfo.name}</span>
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          Loading certificates and reports...
        </div>
      ) : documents.length === 0 ? (
        <div className="py-14 text-center bg-white rounded-2xl border border-slate-100 p-8">
          <div className="w-12 h-12 bg-blue-50 text-[#1a73e8] rounded-2xl flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-800">No Documents Uploaded Yet</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Official certificates and school reports will appear here once published by the administration.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {documents.map((doc) => (
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
                    {doc.category || 'School Document'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug mb-1">
                  {doc.title}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-1">
                  File size: {doc.file_size_formatted || '1.2 MB'}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {doc.uploaded_at ? String(doc.uploaded_at).slice(0, 10) : 'Recently'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleView(doc)}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1a73e8] text-xs font-bold transition-all inline-flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownload(doc)}
                    disabled={downloadingId === doc.id}
                    className="px-3 py-1.5 rounded-xl bg-[#1a73e8] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {downloadingId === doc.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document View / Preview Modal with Full Data */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-100 text-[#1a73e8]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {previewDoc.title || 'Document Details'}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-semibold text-slate-500">
                      Category: {previewDoc.category || 'Official Document'}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      ID: #{previewDoc.id}
                    </span>
                  </div>
                </div>
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

            {/* Document Full Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-6 py-4 border-b border-slate-100 text-xs bg-slate-50/30">
              <div className="p-3 rounded-2xl bg-white border border-slate-100">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                  <Award className="w-3 h-3 text-indigo-500" /> Category
                </span>
                <p className="font-bold text-slate-800 mt-1 truncate">
                  {previewDoc.category || 'Academic Record'}
                </p>
                <p className="text-[10px] text-slate-400">Official Document</p>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-slate-100">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-emerald-500" /> File Size & Type
                </span>
                <p className="font-bold text-slate-800 mt-1 font-mono">
                  {previewDoc.file_size_formatted || 'N/A'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {previewDoc.file_path ? previewDoc.file_path.split('.').pop().toUpperCase() : 'PDF'}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-slate-100 col-span-2 sm:col-span-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-amber-500" /> Published Date
                </span>
                <p className="font-bold text-slate-800 mt-1 font-mono">
                  {previewDoc.uploaded_at ? String(previewDoc.uploaded_at).slice(0, 10) : 'Recent'}
                </p>
                <p className="text-[10px] text-slate-400">School Record</p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100">
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
                  disabled={downloadingId === previewDoc.id}
                  className="px-3.5 py-1.5 bg-[#1a73e8] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {downloadingId === previewDoc.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Document Preview Area */}
            <div className="flex-1 overflow-auto p-4 min-h-[380px] flex items-center justify-center bg-slate-50/50">
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
              ) : previewDoc.file_path && /\.(png|jpe?g|webp|gif|svg)$/i.test(previewDoc.file_path) ? (
                <div className="w-full h-[450px] flex items-center justify-center p-4 bg-white rounded-2xl border border-slate-200">
                  <img
                    src={previewDoc.id ? `/api/documents/${previewDoc.id}/download` : previewDoc.file_path}
                    alt={previewDoc.title}
                    className="max-h-[420px] max-w-full object-contain rounded-xl shadow-xs"
                  />
                </div>
              ) : (
                <div className="text-center p-8 bg-white rounded-2xl border border-dashed border-slate-200">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Preview not supported for this file format</p>
                  <p className="text-[11px] text-slate-400 mt-1 mb-4">Please download the file to inspect its content.</p>
                  <button
                    type="button"
                    onClick={() => handleDownload(previewDoc)}
                    className="px-4 py-2 bg-[#1a73e8] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
