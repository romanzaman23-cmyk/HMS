import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, FileText, Download, Eye, Award, CheckCircle2, Printer, Sparkles, AlertCircle, Smartphone, ArrowLeft, Star } from 'lucide-react';
import api from '../../services/api';

export default function ParentResults() {
  const [selectedTerm, setSelectedTerm] = useState('Term 1 (2025-26)');
  const [subjects, setSubjects] = useState([
    { id: 1, subject: 'English', marks: 85, grade: 'A' },
    { id: 2, subject: 'Mathematics', marks: 92, grade: 'A+' },
    { id: 3, subject: 'Science', marks: 88, grade: 'A' },
    { id: 4, subject: 'Urdu', marks: 90, grade: 'A+' },
    { id: 5, subject: 'Social Studies', marks: 86, grade: 'A' }
  ]);
  const [summary, setSummary] = useState({
    percentage: 88,
    overallGrade: 'A+',
    performanceLevel: 'Excellent'
  });
  const [uploadedPaper, setUploadedPaper] = useState({
    title: 'Term 1 Result Sheet.pdf',
    file_path: '/uploads/sample-term1-result.pdf',
    file_size_formatted: '2.4 MB'
  });
  const [childInfo, setChildInfo] = useState({ name: 'Ahmed Khan', class: 'Grade 5', roll_no: '025' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadResults() {
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

        const childId = child?.id || '1';
        if (child) {
          setChildInfo({ name: child.full_name, class: child.class_name, roll_no: child.roll_number });
        }
        const res = await api.get(`/results/student/${childId}?term=${encodeURIComponent(selectedTerm)}`);
        if (res.data && res.data.success) {
          if (res.data.subjects?.length > 0) {
            setSubjects(res.data.subjects);
          }
          if (res.data.performanceSummary) {
            setSummary(res.data.performanceSummary);
          }
          if (res.data.uploadedDocument) {
            setUploadedPaper(res.data.uploadedDocument);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadResults();

    const handleChildChanged = () => {
      loadResults();
    };
    window.addEventListener('hms_active_child_changed', handleChildChanged);
    return () => window.removeEventListener('hms_active_child_changed', handleChildChanged);
  }, [selectedTerm]);

  const handleView = (paper) => {
    if (!paper?.file_path && !paper?.id) return;
    const isImage = paper.file_path && /\.(png|jpe?g|webp|gif|svg)$/i.test(paper.file_path);
    if (isImage) {
      const streamUrl = paper.id ? `/api/results/documents/${paper.id}/download` : paper.file_path;
      window.open(streamUrl, '_blank');
    } else {
      const targetUrl = paper.id
        ? `/viewer.html?id=${paper.id}&type=result&title=${encodeURIComponent(paper.title || 'Result Sheet')}`
        : `/viewer.html?path=${encodeURIComponent(paper.file_path)}&title=${encodeURIComponent(paper.title || 'Result Sheet')}`;
      window.open(targetUrl, '_blank');
    }
  };

  const handleDownload = async (paper) => {
    if (!paper) return;
    try {
      if (paper.id) {
        const res = await api.get(`/results/documents/${paper.id}/download?download=1`, {
          responseType: 'blob'
        });
        const blob = new Blob([res.data], {
          type: res.headers['content-type'] || 'application/octet-stream'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        let downloadName = paper.title || 'Result_Sheet.pdf';
        const fileExt = paper.file_path ? paper.file_path.split('.').pop() : 'pdf';
        if (!downloadName.includes('.')) {
          downloadName = `${downloadName}.${fileExt}`;
        }
        link.setAttribute('download', downloadName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else if (paper.file_path) {
        window.open(paper.file_path, '_blank');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to download document.');
    }
  };

  const handleExportCSV = () => {
    if (subjects.length === 0) return alert('No subject marks to export.');
    const headers = ['Subject', 'Marks Obtained', 'Total Marks', 'Grade'];
    const rows = subjects.map(s => [
      `"${s.subject}"`,
      s.marks,
      s.total_marks || 100,
      `"${s.grade}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${childInfo.name.replace(/\s+/g, '_')}_${selectedTerm.replace(/\s+/g, '_')}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-4 max-w-full">
      {/* App Header Banner (English Only, Clean Mobile Layout) */}
      <div className="bg-white rounded-3xl p-4 border border-amber-100 shadow-sm space-y-3">
        {/* Title Row */}
        <div className="flex items-center gap-3">
          <Link
            to="/parent/dashboard"
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex-shrink-0"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white flex items-center justify-center shadow-md shadow-amber-500/20 flex-shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                Exam Results
              </h2>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-700" />
                <span>Grade {summary?.overallGrade || 'A+'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
              Report card for <span className="font-bold text-slate-800">{childInfo.name}</span>
            </p>
          </div>
        </div>

        {/* Action Controls Row (Responsive, No Overflow) */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="w-full py-2 px-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="Term 1 (2025-26)">Term 1 (2025-26)</option>
            <option value="Term 2 (2025-26)">Term 2 (2025-26)</option>
            <option value="Final Term (2025-26)">Final Term (2025-26)</option>
          </select>

          <button
            type="button"
            onClick={handleExportCSV}
            className="w-full py-2 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handlePrintReport}
          className="w-full py-2 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
        >
          <Printer className="w-3.5 h-3.5 text-slate-500" />
          <span>Print Report Card</span>
        </button>
      </div>

      {/* Promotion / Retention Status Announcement Banner */}
      {summary.percentage >= 40 ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  Mubarak Ho! Student Promoted to Next Class
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  PASSED & PROMOTED
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {childInfo.name} ne {selectedTerm} me shandar kamyabi ({summary.percentage}% • Grade {summary.overallGrade}) hasil kar li hai aur agli class ({childInfo.class}) me automatically promote ho gaye hain.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-white/80 px-3 py-1.5 rounded-xl border border-emerald-200 flex-shrink-0">
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp & Web Alert Dispatched</span>
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-rose-500 text-white rounded-2xl shadow-sm">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  Academic Status: Retained in Same Class
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                  NEEDS IMPROVEMENT
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {childInfo.name} {selectedTerm} me mutlooba passing marks hasil nahi kar sake ({summary.percentage}%). School policy ke mutabiq bacha isi class ({childInfo.class}) me repeat karega taake kamzor mazameen par mazeed tawajjo de sake.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-700 bg-white/80 px-3 py-1.5 rounded-xl border border-rose-200 flex-shrink-0">
            <Smartphone className="w-3.5 h-3.5 text-rose-600" />
            <span>Parent Alert Dispatched</span>
          </div>
        </div>
      )}

      {/* Main Grid: Subjects Table (Left) + Performance & Uploaded Papers (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Subjects Table (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              {selectedTerm}
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
              5 Subjects
            </span>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6 font-semibold">Subject</th>
                <th className="py-4 px-6 font-semibold">Marks</th>
                <th className="py-4 px-6 font-semibold text-right">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {subjects.map((sub) => (
                <tr key={sub.id || sub.subject} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-900">
                    {sub.subject}
                  </td>
                  <td className="py-4 px-6 font-mono text-xs font-bold text-slate-700">
                    {sub.marks}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-[#1a73e8]">
                      {sub.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right Column: Performance Summary (Top) & Uploaded Papers (Bottom) (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Performance Summary Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-center">
            <h3 className="text-sm font-bold text-slate-900 mb-6 text-left">
              Performance Summary
            </h3>

            {/* Circular Progress Gauge */}
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#1a73e8"
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * summary.percentage) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {summary.percentage}%
                </span>
              </div>
            </div>

            <p className="text-xs font-semibold text-slate-500 mt-4 uppercase tracking-wider">
              Overall Performance
            </p>
            <div className="mt-1">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                {summary.performanceLevel || 'Excellent'}
              </span>
            </div>
          </div>

          {/* Uploaded Papers Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">
              Uploaded Papers
            </h3>

            {uploadedPaper ? (
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center flex-shrink-0 border border-rose-100">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {uploadedPaper.title}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {uploadedPaper.file_size_formatted || '1.2 MB'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleView(uploadedPaper)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1a73e8] rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownload(uploadedPaper)}
                    className="px-3 py-1.5 bg-[#1a73e8] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">
                No official report card uploaded for this term yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
