import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Smartphone,
  Eye,
  Calendar,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Check,
  X,
  ArrowRight,
  Trash2
} from 'lucide-react';
import api from '../../services/api';

const DEFAULT_OFFLINE_REGISTRATIONS = [];

export default function AdminApprovals() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL | PENDING | APPROVED | REJECTED
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedApp, setSelectedApp] = useState(null); // For details modal
  const [actionModal, setActionModal] = useState({ type: null, item: null }); // type: 'APPROVE' | 'REJECT'
  const [rollNumberInput, setRollNumberInput] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchRegistrations = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await api.get('/approvals');
      if (res.data && res.data.registrations) {
        // Automatically filter out any rejected applications so they never appear
        const cleaned = res.data.registrations.filter((r) => r.status !== 'REJECTED');
        setRegistrations(cleaned);
        localStorage.setItem('hms_cached_approvals', JSON.stringify(cleaned));
      } else {
        loadFallback();
      }
    } catch (err) {
      if (!isBackground) {
        console.warn('Backend /approvals not available, loading fallback cache:', err.message);
        loadFallback();
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const loadFallback = () => {
    try {
      const cached = localStorage.getItem('hms_cached_approvals');
      if (cached) {
        const parsed = JSON.parse(cached).filter((r) => r.status !== 'REJECTED');
        setRegistrations(parsed);
        localStorage.setItem('hms_cached_approvals', JSON.stringify(parsed));
      } else {
        const initial = DEFAULT_OFFLINE_REGISTRATIONS.filter((r) => r.status !== 'REJECTED');
        setRegistrations(initial);
        localStorage.setItem('hms_cached_approvals', JSON.stringify(initial));
      }
    } catch (e) {
      setRegistrations(DEFAULT_OFFLINE_REGISTRATIONS.filter((r) => r.status !== 'REJECTED'));
    }
  };

  useEffect(() => {
    fetchRegistrations();
    // Auto-polling interval: check for new mobile app registrations every 5 seconds
    const interval = setInterval(() => {
      fetchRegistrations(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const notifyChange = (updatedList) => {
    const cleaned = updatedList.filter((r) => r.status !== 'REJECTED');
    setRegistrations(cleaned);
    localStorage.setItem('hms_cached_approvals', JSON.stringify(cleaned));
    window.dispatchEvent(new CustomEvent('hms_approvals_changed', { detail: { list: cleaned } }));
  };

  // Instant / Direct Approve from row
  const handleQuickApprove = async (item, e) => {
    if (e) e.stopPropagation();
    const finalRoll = item.assigned_roll_no || `HMS-${Math.floor(100 + Math.random() * 900)}`;

    // Immediately update local state so Approve/Reject buttons vanish and turn into Approved status
    const updated = registrations.map((r) => {
      if (String(r.id) === String(item.id)) {
        return {
          ...r,
          status: 'APPROVED',
          approved_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
          assigned_roll_no: finalRoll,
          rejection_reason: null
        };
      }
      return r;
    });

    notifyChange(updated);
    showToast(`Approved! ${item.student_name} enrolled with Roll No: ${finalRoll}`);

    try {
      await api.put(`/approvals/${item.id}/approve`, { assigned_roll_no: finalRoll });
    } catch (err) {
      console.warn('Backend approval request failed:', err);
    }
  };

  // Open approve modal (if opened from details modal or custom roll dialog)
  const handleOpenApprove = (item) => {
    const defaultRoll = item.assigned_roll_no || `HMS-${Math.floor(100 + Math.random() * 900)}`;
    setRollNumberInput(defaultRoll);
    setActionModal({ type: 'APPROVE', item });
  };

  // Confirm Approve from modal
  const handleConfirmApprove = async () => {
    if (!actionModal.item) return;
    setSubmitting(true);
    const item = actionModal.item;
    const finalRoll = rollNumberInput.trim() || `HMS-${Math.floor(100 + Math.random() * 900)}`;

    const updated = registrations.map((r) => {
      if (String(r.id) === String(item.id)) {
        return {
          ...r,
          status: 'APPROVED',
          approved_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
          assigned_roll_no: finalRoll,
          rejection_reason: null
        };
      }
      return r;
    });

    notifyChange(updated);
    setSubmitting(false);
    setActionModal({ type: null, item: null });
    showToast(`Approved! ${item.student_name} enrolled with Roll No: ${finalRoll}`);

    try {
      await api.put(`/approvals/${item.id}/approve`, { assigned_roll_no: finalRoll });
    } catch (err) {
      console.warn('Backend approval request failed:', err);
    }
  };

  // Open reject modal
  const handleOpenReject = (item) => {
    setRejectReason('Application declined by administration.');
    setActionModal({ type: 'REJECT', item });
  };

  // Confirm Reject (Permanently deletes and removes the registration immediately)
  const handleConfirmReject = async () => {
    if (!actionModal.item) return;
    setSubmitting(true);
    const item = actionModal.item;

    try {
      await api.delete(`/approvals/${item.id}`);
    } catch (err) {
      try {
        await api.put(`/approvals/${item.id}/reject`, { rejection_reason: rejectReason });
      } catch (err2) {
        console.warn('Backend rejection request failed:', err2);
      }
    }

    // Permanently remove the rejected student application so it vanishes completely
    const updated = registrations.filter((r) => String(r.id) !== String(item.id));

    notifyChange(updated);
    setSubmitting(false);
    setActionModal({ type: null, item: null });
    if (selectedApp && String(selectedApp.id) === String(item.id)) {
      setSelectedApp(null);
    }
    showToast(`Application for ${item.student_name} has been rejected and permanently removed.`, 'info');
  };

  // Direct Delete / Khatam Karein
  const handleDeleteDirect = async (item, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to permanently delete registration for "${item.student_name}"?`)) {
      return;
    }

    try {
      await api.delete(`/approvals/${item.id}`);
    } catch (err) {
      try {
        await api.put(`/approvals/${item.id}/reject`);
      } catch (err2) {
        console.warn('Backend delete request failed:', err2);
      }
    }

    const updated = registrations.filter((r) => String(r.id) !== String(item.id));
    notifyChange(updated);
    if (selectedApp && String(selectedApp.id) === String(item.id)) {
      setSelectedApp(null);
    }
    showToast(`Registration for ${item.student_name} permanently deleted.`);
  };

  // Filtered registrations
  const filtered = registrations.filter((item) => {
    const matchesTab = activeTab === 'ALL' || item.status === activeTab;
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      item.student_name?.toLowerCase().includes(query) ||
      item.father_name?.toLowerCase().includes(query) ||
      item.phone?.includes(query) ||
      item.email?.toLowerCase().includes(query) ||
      item.class_name?.toLowerCase().includes(query);
    const matchesClass = selectedClass === 'ALL' || item.class_name === selectedClass;
    return matchesTab && matchesSearch && matchesClass;
  });

  const pendingCount = registrations.filter((r) => r.status === 'PENDING').length;
  const approvedCount = registrations.filter((r) => r.status === 'APPROVED').length;
  const rejectedCount = registrations.filter((r) => r.status === 'REJECTED').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-200 ${
            toastMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Student Account Approvals
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              <Smartphone className="w-3.5 h-3.5 text-blue-600" />
              Mobile App Requests
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Review, verify, and approve or reject new student registrations submitted from the Highlight Model School mobile app.
          </p>
        </div>

        <button
          onClick={fetchRegistrations}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Requests</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Applications
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              {registrations.length}
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            {registrations.length}
          </p>
          <p className="text-xs text-slate-400 mt-1">Submitted from Mobile / Online</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Pending Review
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-800">{pendingCount}</p>
            {pendingCount > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 animate-pulse">
                Action Required
              </span>
            )}
          </div>
          <p className="text-xs text-amber-600 mt-1">Awaiting Principal approval</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Approved & Enrolled
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-800 mt-2">
            {approvedCount}
          </p>
          <p className="text-xs text-emerald-600 mt-1">Active student credentials created</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200/80 bg-rose-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
              Rejected Requests
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-800 mt-2">
            {rejectedCount}
          </p>
          <p className="text-xs text-rose-600 mt-1">Declined applications</p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl overflow-x-auto">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Requests ({registrations.length})
            </button>
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-800 hover:text-amber-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-300"></span>
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab('APPROVED')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'APPROVED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-800 hover:text-emerald-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
              Approved ({approvedCount})
            </button>
            <button
              onClick={() => setActiveTab('REJECTED')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'REJECTED'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-800 hover:text-rose-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-300"></span>
              Rejected ({rejectedCount})
            </button>
          </div>

          {/* Search & Class Dropdown */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student, father, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder-slate-400"
              />
            </div>

            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Classes</option>
              <option value="Grade 1">Grade 1</option>
              <option value="Grade 2">Grade 2</option>
              <option value="Grade 3">Grade 3</option>
              <option value="Grade 4">Grade 4</option>
              <option value="Grade 5">Grade 5</option>
              <option value="Grade 6">Grade 6</option>
              <option value="Grade 7">Grade 7</option>
              <option value="Grade 8">Grade 8</option>
              <option value="Grade 9">Grade 9</option>
              <option value="Grade 10">Grade 10</option>
            </select>
          </div>
        </div>

        {/* Applications List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Student & Applicant</th>
                <th className="py-3 px-4">Father / Guardian</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Contact Details</th>
                <th className="py-3 px-4">Applied Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions (Approve / Reject)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-600">No registration requests found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {searchTerm ? 'Try adjusting your search criteria.' : 'When students create accounts from the mobile app, they will appear here.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Student Name & Photo */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {item.avatar_url || item.photo_url ? (
                          <img
                            src={item.avatar_url || item.photo_url}
                            alt={item.student_name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs flex-shrink-0"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/uploads/roman_real.png';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs flex-shrink-0">
                            {item.student_name ? item.student_name.slice(0, 2).toUpperCase() : 'ST'}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-900">{item.student_name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded font-medium">
                              <Smartphone className="w-3 h-3" />
                              {item.source || 'Mobile App'}
                            </span>
                            <span className="text-xs text-slate-400">• {item.gender}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Father Name */}
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {item.father_name}
                    </td>

                    {/* Class */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                        {item.class_name}
                      </span>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4">
                      <div className="text-xs space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.phone}</span>
                        </div>
                        {item.email && (
                          <div className="flex items-center gap-1.5 text-slate-500 truncate max-w-[180px]">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate">{item.email}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Applied Date */}
                    <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.applied_date}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Pending Review
                        </span>
                      )}
                      {item.status === 'APPROVED' && (
                        <div>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Approved
                          </span>
                          {item.assigned_roll_no && (
                            <p className="text-[11px] text-emerald-700 font-bold mt-1">
                              Roll: {item.assigned_roll_no}
                            </p>
                          )}
                        </div>
                      )}
                      {item.status === 'REJECTED' && (
                        <div>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            Rejected
                          </span>
                          {item.rejection_reason && (
                            <p className="text-[11px] text-rose-600 mt-1 max-w-[140px] truncate" title={item.rejection_reason}>
                              {item.rejection_reason}
                            </p>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        {/* View Details */}
                        <button
                          onClick={() => setSelectedApp(item)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="View Full Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Direct Delete / Khatam Karein */}
                        <button
                          onClick={(e) => handleDeleteDirect(item, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Permanently Delete Record (Khatam Karein)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        {item.status === 'PENDING' ? (
                          <>
                            {/* Approve Button */}
                            <button
                              onClick={(e) => handleQuickApprove(item, e)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                              title="Click to Enroll Student"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>

                            {/* Reject Button */}
                            <button
                              onClick={() => handleOpenReject(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setSelectedApp(item)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
                          >
                            <span>Details</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                {selectedApp.avatar_url || selectedApp.photo_url ? (
                  <img
                    src={selectedApp.avatar_url || selectedApp.photo_url}
                    alt={selectedApp.student_name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs flex-shrink-0"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/uploads/roman_real.png';
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs flex-shrink-0">
                    {selectedApp.student_name?.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedApp.student_name}</h3>
                  <p className="text-xs text-slate-500">Student Account Application</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-400 font-medium">Status</span>
                  <div className="mt-0.5">
                    {selectedApp.status === 'PENDING' && (
                      <span className="text-amber-800 font-bold">🟡 Pending Review</span>
                    )}
                    {selectedApp.status === 'APPROVED' && (
                      <span className="text-emerald-700 font-bold">
                        🟢 Approved (Roll: {selectedApp.assigned_roll_no})
                      </span>
                    )}
                    {selectedApp.status === 'REJECTED' && (
                      <span className="text-rose-700 font-bold">🔴 Rejected</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Applied Date</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedApp.applied_date}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 font-medium">Father / Guardian</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedApp.father_name}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Class / Grade</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedApp.class_name}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Gender</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedApp.gender || 'Male'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Date of Birth</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedApp.date_of_birth || 'N/A'}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <span className="text-slate-400 font-medium">Contact Phone</span>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedApp.phone}</p>
              </div>

              {selectedApp.email && (
                <div>
                  <span className="text-slate-400 font-medium">Email Address</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedApp.email}</p>
                </div>
              )}

              {selectedApp.serial_no && (
                <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-blue-500 font-semibold text-[10px] uppercase tracking-wider">Admission Register Serial No</span>
                      <p className="font-bold text-blue-900 mt-0.5">{selectedApp.serial_no}</p>
                    </div>
                    {selectedApp.date_of_admission && (
                      <div className="text-right">
                        <span className="text-blue-500 font-semibold text-[10px] uppercase tracking-wider">Admission Date</span>
                        <p className="font-bold text-blue-900 mt-0.5">{selectedApp.date_of_admission}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Official Register Details */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  Official Register Particulars (داخلہ و اخراج رجسٹر)
                </span>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-slate-400">Student Name (Urdu):</span>
                    <p className="font-semibold text-slate-800 text-sm mt-0.5" dir="rtl">{selectedApp.student_name_urdu || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Father Name (Urdu):</span>
                    <p className="font-semibold text-slate-800 text-sm mt-0.5" dir="rtl">{selectedApp.father_name_urdu || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Caste / Tribe (قوم یا قبیلہ):</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{selectedApp.caste_tribe || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Father Occupation:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{selectedApp.father_occupation || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">DOB in Words:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{selectedApp.dob_words || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Arrears Due:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{selectedApp.arrears_due || 'Nil'}</p>
                  </div>
                  {selectedApp.class_withdrawn && (
                    <div>
                      <span className="text-slate-400">Class Withdrawn:</span>
                      <p className="font-semibold text-slate-800 mt-0.5">{selectedApp.class_withdrawn}</p>
                    </div>
                  )}
                  {selectedApp.withdrawal_date && (
                    <div>
                      <span className="text-slate-400">Withdrawal Date:</span>
                      <p className="font-semibold text-slate-800 mt-0.5">{selectedApp.withdrawal_date}</p>
                    </div>
                  )}
                </div>

                {selectedApp.residence && (
                  <div className="pt-1 border-t border-slate-200">
                    <span className="text-slate-400">Residence / مستقل رہائش:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{selectedApp.residence}</p>
                  </div>
                )}
                {selectedApp.remarks && (
                  <div className="pt-1 border-t border-slate-200">
                    <span className="text-slate-400">Remarks:</span>
                    <p className="font-medium text-slate-700 italic mt-0.5">{selectedApp.remarks}</p>
                  </div>
                )}
              </div>

              {selectedApp.address && (
                <div>
                  <span className="text-slate-400 font-medium">Residential Address</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedApp.address}</p>
                </div>
              )}

              {selectedApp.rejection_reason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <span className="text-rose-600 font-semibold">Rejection Reason:</span>
                  <p className="text-rose-800 mt-0.5">{selectedApp.rejection_reason}</p>
                </div>
              )}
            </div>

            {selectedApp.status === 'PENDING' ? (
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 mt-5">
                <button
                  onClick={() => {
                    const app = selectedApp;
                    setSelectedApp(null);
                    handleOpenReject(app);
                  }}
                  className="px-4 py-2 rounded-xl border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-semibold cursor-pointer"
                >
                  Reject & Delete
                </button>
                <button
                  onClick={() => {
                    const app = selectedApp;
                    setSelectedApp(null);
                    handleOpenApprove(app);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Approve Application
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 mt-5">
                <button
                  onClick={() => {
                    const app = selectedApp;
                    handleDeleteDirect(app);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-semibold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Record</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {actionModal.type === 'APPROVE' && actionModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Approve Student Enrollment</h3>
            <p className="text-xs text-slate-500 mt-1">
              You are approving <strong className="text-slate-800">{actionModal.item.student_name}</strong> for{' '}
              <strong className="text-slate-800">{actionModal.item.class_name}</strong>. This will activate their student record.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Assign Roll Number
              </label>
              <input
                type="text"
                value={rollNumberInput}
                onChange={(e) => setRollNumberInput(e.target.value)}
                placeholder="e.g. HMS-049"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                You can keep the auto-generated roll number or enter a specific one.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setActionModal({ type: null, item: null })}
                disabled={submitting}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApprove}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
              >
                {submitting ? 'Approving...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {actionModal.type === 'REJECT' && actionModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Reject & Delete Application</h3>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to decline <strong className="text-slate-800">{actionModal.item.student_name}</strong>'s application? This record will be permanently deleted and removed from the system immediately.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Reason for Rejection
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="State why the application is being rejected..."
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setActionModal({ type: null, item: null })}
                disabled={submitting}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
              >
                {submitting ? 'Removing...' : 'Reject & Delete (Khatam Karein)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
