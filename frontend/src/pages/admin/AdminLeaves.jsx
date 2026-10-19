import React, { useState, useEffect } from 'react';
import { CalendarDays, CheckCircle2, XCircle, Clock, Eye, AlertCircle, FileText, Download, Printer } from 'lucide-react';
import api from '../../services/api';

export default function AdminLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await api.get('/leaves');
      if (res.data && res.data.success) {
        setLeaves(res.data.leaves || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleApprove = async (id) => {
    setActionLoading(true);
    try {
      await api.put(`/leaves/${id}/approve`, { admin_remarks: remarks || 'Approved by Principal' });
      setSelectedLeave(null);
      setRemarks('');
      fetchLeaves();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    setActionLoading(true);
    try {
      await api.put(`/leaves/${id}/reject`, { admin_remarks: remarks || 'Declined by Administration' });
      setSelectedLeave(null);
      setRemarks('');
      fetchLeaves();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportLeavesCSV = () => {
    if (leaves.length === 0) return alert('No leave records to export.');
    const headers = ['Student Name', 'Roll Number', 'Parent Name', 'Start Date', 'End Date', 'Reason', 'Status', 'Submitted Date', 'Admin Remarks'];
    const rows = leaves.map(l => [
      `"${(l.student_name || '').replace(/"/g, '""')}"`,
      `"${l.roll_number || ''}"`,
      `"${(l.parent_name || '').replace(/"/g, '""')}"`,
      `"${l.start_date || ''}"`,
      `"${l.end_date || ''}"`,
      `"${(l.reason || '').replace(/"/g, '""')}"`,
      `"${l.status || 'Pending'}"`,
      `"${l.created_at ? l.created_at.slice(0, 10) : ''}"`,
      `"${(l.admin_remarks || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Highlight_School_Leave_Register_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintLeaves = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Leave Management
          </h2>
          <p className="text-xs text-slate-500">
            Review parent leave submissions, verify reason and approve or decline requests
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportLeavesCSV}
            className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-2"
            title="Download leaves register to CSV"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrintLeaves}
            className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-2"
            title="Print leave application records"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6 font-semibold">Student</th>
                <th className="py-4 px-6 font-semibold">Parent</th>
                <th className="py-4 px-6 font-semibold">Leave Dates</th>
                <th className="py-4 px-6 font-semibold">Reason</th>
                <th className="py-4 px-6 font-semibold">Submitted</th>
                <th className="py-4 px-6 font-semibold">Status</th>
                <th className="py-4 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 text-xs">
                    Loading leave requests...
                  </td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 text-xs">
                    No leave requests found.
                  </td>
                </tr>
              ) : (
                leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      {l.student_name}
                      <span className="block text-[11px] text-slate-400 font-normal">Roll: {l.roll_number || '025'}</span>
                    </td>
                    <td className="py-4 px-6 text-slate-700 text-xs">
                      {l.parent_name}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600 font-medium">
                      {l.start_date} <span className="text-slate-400">to</span> {l.end_date}
                    </td>
                    <td className="py-4 px-6 text-xs font-semibold text-slate-800">
                      {l.reason}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400 font-mono">
                      {l.submitted_at ? String(l.submitted_at).slice(0, 10) : '2025-10-01'}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        l.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : l.status === 'Pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => { setSelectedLeave(l); setRemarks(''); }}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leave Details / Decision Modal */}
      {selectedLeave && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                Leave Request Application
              </h3>
              <button
                onClick={() => setSelectedLeave(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 py-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Student</span>
                  <span className="text-slate-900 font-bold">{selectedLeave.student_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Parent</span>
                  <span className="text-slate-900 font-bold">{selectedLeave.parent_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Duration</span>
                  <span className="text-slate-900 font-medium">{selectedLeave.start_date} → {selectedLeave.end_date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Reason</span>
                  <span className="text-slate-900 font-bold">{selectedLeave.reason}</span>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Application Statement / Details
                </p>
                <div className="p-3 bg-slate-50 rounded-xl text-slate-700 leading-relaxed border border-slate-200">
                  {selectedLeave.additional_details || 'No additional explanation provided.'}
                </div>
              </div>

              {selectedLeave.attachment_url && (
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Attachment
                  </p>
                  <a
                    href={
                      /\.pdf$/i.test(selectedLeave.attachment_url)
                        ? `/viewer.html?path=${encodeURIComponent(selectedLeave.attachment_url)}&title=Leave%20Document`
                        : selectedLeave.attachment_url
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 bg-blue-50 text-blue-700 rounded-xl inline-flex items-center gap-2 font-semibold hover:bg-blue-100"
                  >
                    <FileText className="w-4 h-4" /> View Supporting Medical/Leave Document
                  </a>
                </div>
              )}

              {/* Administrative Remarks input */}
              {selectedLeave.status === 'Pending' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Principal's Remarks / Note (Sent to parent)
                  </label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Approved. Ensure homework is caught up upon return."
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedLeave(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Close
              </button>

              {selectedLeave.status === 'Pending' && (
                <>
                  <button
                    onClick={() => handleReject(selectedLeave.id)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedLeave.id)}
                    disabled={actionLoading}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    Approve Request
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
