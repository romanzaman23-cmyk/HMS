import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Plus, Eye, Clock, CheckCircle2, XCircle, FileText, Send, ArrowLeft, HeartPulse } from 'lucide-react';
import api from '../../services/api';

export default function ParentLeaves() {
  const [leaves, setLeaves] = useState([
    {
      id: 1,
      start_date: '05 Oct 2025',
      end_date: '06 Oct 2025',
      reason: 'Medical Checkup',
      status: 'Pending',
      additional_details: 'My child is unable to attend school due to a medical appointment with the paediatrician. Kindly approve the leave request.'
    },
    {
      id: 2,
      start_date: '12 Sep 2025',
      end_date: '13 Sep 2025',
      reason: 'Family Function',
      status: 'Approved',
      additional_details: 'Attending an out-of-town wedding ceremony with immediate family.'
    },
    {
      id: 3,
      start_date: '01 Aug 2025',
      end_date: '02 Aug 2025',
      reason: 'Fever',
      status: 'Approved',
      additional_details: 'Suffering from mild seasonal flu and advised bed rest by doctor.'
    }
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date().toISOString().slice(0, 10),
    reason: 'Medical Checkup',
    additional_details: 'My child is unable to attend school due to a medical appointment. Kindly approve the leave request.'
  });
  const [attachment, setAttachment] = useState(null);

  const fetchLeaves = async () => {
    try {
      const res = await api.get('/leaves');
      if (res.data && res.data.success && res.data.leaves.length > 0) {
        setLeaves(res.data.leaves.map(l => ({
          id: l.id,
          start_date: l.start_date,
          end_date: l.end_date,
          reason: l.reason,
          status: l.status,
          additional_details: l.additional_details,
          attachment_url: l.attachment_url,
          admin_remarks: l.admin_remarks
        })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('student_id', '1');
      formData.append('start_date', form.start_date);
      formData.append('end_date', form.end_date);
      formData.append('reason', form.reason);
      formData.append('additional_details', form.additional_details);
      if (attachment) {
        formData.append('attachment', attachment);
      }

      await api.post('/leaves', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setModalOpen(false);
      setAttachment(null);
      fetchLeaves();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-full">
      {/* App Header Banner (English Only) */}
      <div className="bg-white rounded-3xl p-4 border border-rose-100 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <Link
            to="/parent/dashboard"
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex-shrink-0"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20 flex-shrink-0">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                Leave Requests
              </h2>
              <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                {leaves.length} Requests
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
              Submit absence applications to the school
            </p>
          </div>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-rose-600/20 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Leave Request</span>
        </button>
      </div>

      {/* Table matching reference screenshot exactly */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6 font-semibold">Date</th>
                <th className="py-4 px-6 font-semibold">Reason</th>
                <th className="py-4 px-6 font-semibold">Status</th>
                <th className="py-4 px-6 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {leaves.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-900 text-xs">
                    {row.start_date}
                  </td>
                  <td className="py-4 px-6 text-slate-700 text-xs font-medium">
                    {row.reason}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        row.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : row.status === 'Pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => setViewModal(row)}
                      className="px-3 py-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit Leave Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Submit Leave Request
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Notify the principal about child's planned absence.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason</label>
                <select
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                >
                  <option value="Medical Checkup">Medical Checkup</option>
                  <option value="Family Function">Family Function</option>
                  <option value="Fever / Sickness">Fever / Sickness</option>
                  <option value="Urgent Family Matter">Urgent Family Matter</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Application Details</label>
                <textarea
                  rows={3}
                  required
                  value={form.additional_details}
                  onChange={(e) => setForm({ ...form, additional_details: e.target.value })}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Supporting Document (Optional)</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setAttachment(e.target.files[0])}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#1a73e8] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting...' : 'Submit Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              Leave Request Details
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Leave Period:</span>
                <span className="font-bold text-slate-900">{viewModal.start_date} to {viewModal.end_date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Reason:</span>
                <span className="font-bold text-slate-900">{viewModal.reason}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Current Status:</span>
                <span className={`font-bold ${viewModal.status === 'Approved' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {viewModal.status}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block mb-1">Details:</span>
                <p className="p-3 bg-slate-50 rounded-xl text-slate-700 leading-relaxed">
                  {viewModal.additional_details}
                </p>
              </div>

              {viewModal.admin_remarks && (
                <div>
                  <span className="text-slate-400 font-medium block mb-1">Principal's Response:</span>
                  <p className="p-3 bg-emerald-50 text-emerald-800 rounded-xl font-medium">
                    {viewModal.admin_remarks}
                  </p>
                </div>
              )}

              {viewModal.attachment_url && (
                <div>
                  <span className="text-slate-400 font-medium block mb-1">Attachment:</span>
                  <a
                    href={
                      /\.pdf$/i.test(viewModal.attachment_url)
                        ? `/viewer.html?path=${encodeURIComponent(viewModal.attachment_url)}&title=Leave%20Attachment`
                        : viewModal.attachment_url
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 bg-blue-50 text-blue-700 rounded-xl inline-flex items-center gap-2 font-semibold hover:bg-blue-100 text-xs"
                  >
                    <FileText className="w-4 h-4" /> View Supporting Document
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t border-slate-100">
              <button
                onClick={() => setViewModal(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
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
