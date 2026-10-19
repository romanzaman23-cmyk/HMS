import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarCheck,
  CalendarCheck2,
  MessageCircle,
  LogIn,
  LogOut,
  ChevronDown,
  Download,
  Printer,
  ArrowLeft,
  Fingerprint
} from 'lucide-react';
import api from '../../services/api';

export default function ParentAttendance() {
  const [filterPeriod, setFilterPeriod] = useState('This Month');
  const [records, setRecords] = useState([]);
  const [punches, setPunches] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load parent's children
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const stuRes = await api.get('/students');
        const stuList = stuRes.data?.students || [];
        setStudents(stuList);

        if (stuList.length > 0) {
          let activeChild = stuList[0];
          try {
            const cached = localStorage.getItem('hms_active_child');
            if (cached) {
              const parsed = JSON.parse(cached);
              const found = stuList.find(c => String(c.id) === String(parsed.id));
              if (found) activeChild = found;
            }
          } catch (e) {}

          setSelectedStudent(activeChild);
          await fetchStudentAttendance(activeChild.id);
        }
      } catch (err) {
        console.error('Error loading parent students:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    const handleChildChanged = (e) => {
      if (e?.detail?.id) {
        setSelectedStudent(prev => {
          return e.detail;
        });
        fetchStudentAttendance(e.detail.id);
      }
    };
    window.addEventListener('hms_active_child_changed', handleChildChanged);
    return () => window.removeEventListener('hms_active_child_changed', handleChildChanged);
  }, []);

  const fetchStudentAttendance = async (childId) => {
    try {
      const res = await api.get(childId ? `/attendance?student_id=${childId}` : '/attendance');
      if (res.data && res.data.success) {
        const attRecords = res.data.records || [];
        const formatted = attRecords.map((r, idx) => ({
          id: r.id || idx,
          rawDate: r.attendance_date,
          date: new Date(r.attendance_date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }),
          sessionNum: r.session_num,
          sessionTitle: r.session_title,
          status: r.status,
          checkIn: r.check_in_time || '-',
          checkOut: r.check_out_time || '-',
          source: r.source || 'Fingerprint'
        }));
        setRecords(formatted);

        if (res.data.punches) {
          setPunches(res.data.punches);
        }
      }
    } catch (err) {
      console.error('Error fetching attendance records:', err);
    }
  };

  const handleChildChange = async (childId) => {
    const found = students.find(s => String(s.id) === String(childId));
    if (found) {
      setSelectedStudent(found);
      await fetchStudentAttendance(found.id);
    }
  };

  const totalDays = records.length;
  const presentDays = records.filter(r => r.status === 'Present' || r.status === 'Checked In' || r.status === 'Checked Out').length;
  const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

  // Filter punches for today
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayPunches = punches.filter(p => p.date === todayStr);

  const handleExportCSV = () => {
    if (records.length === 0) return alert('No attendance records to export.');
    const studentName = selectedStudent ? selectedStudent.full_name : 'Student';
    const headers = ['Date', 'Session', 'Status', 'Check-In Time', 'Check-Out Time', 'Device Source'];
    const rows = records.map(r => [
      `"${r.date || ''}"`,
      `"${r.sessionTitle || ''}"`,
      `"${r.status || ''}"`,
      `"${r.checkIn || '-'}"`,
      `"${r.checkOut || '-'}"`,
      `"${r.source || 'Biometric Fingerprint'}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${studentName.replace(/\s+/g, '_')}_Attendance_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="space-y-4 max-w-full">
      {/* App Header Banner with Clean Mobile Layout (English Only) */}
      <div className="bg-white rounded-3xl p-4 border border-emerald-100 shadow-sm space-y-3">
        {/* Title Row */}
        <div className="flex items-center gap-3">
          <Link
            to="/parent/dashboard"
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex-shrink-0"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 flex-shrink-0">
            <CalendarCheck2 className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                Attendance
              </h2>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                {percentage}% Present
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
              History for <span className="font-bold text-slate-800">{selectedStudent ? selectedStudent.full_name : 'Student'}</span>
            </p>
          </div>
        </div>

        {/* Action Controls Row (Responsive, No Overflow) */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="w-full py-2 px-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="This Month">This Month</option>
            <option value="Last Month">Last Month</option>
            <option value="All Time">All Time</option>
          </select>

          {students.length > 1 ? (
            <select
              value={selectedStudent?.id || ''}
              onChange={(e) => handleChildChange(e.target.value)}
              className="w-full py-2 px-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 truncate"
            >
              {students.map(st => (
                <option key={st.id} value={st.id}>
                  {st.full_name}
                </option>
              ))}
            </select>
          ) : (
            <button
              type="button"
              onClick={handleExportCSV}
              className="w-full py-2 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
          )}
        </div>

        {students.length > 1 && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="w-full py-2 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrintSlip}
              className="w-full py-2 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Slip</span>
            </button>
          </div>
        )}
      </div>

      {/* WhatsApp & Realtime Alert Status Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-emerald-950">
                Automated WhatsApp & Web Alerts Connected
              </p>
              <span className="px-2 py-0.5 bg-emerald-200 text-emerald-800 text-[10px] font-bold rounded-md">
                Direct SMS Active
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              Whenever {selectedStudent ? selectedStudent.full_name : 'your child'} scans their finger at the gate,
              instant Check-in & Check-out notifications are automatically delivered to your phone.
            </p>
          </div>
        </div>
        <span className="self-start sm:self-auto px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[11px] whitespace-nowrap">
          ✓ Sync Active
        </span>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Monthly Attendance</p>
          <p className="text-2xl font-extrabold text-[#1a73e8] mt-0.5">{percentage}%</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Present Days</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">{presentDays} Days</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Absent Days</p>
          <p className="text-2xl font-extrabold text-rose-500 mt-0.5">{Math.max(0, totalDays - presentDays)} Day</p>
        </div>
      </div>

      {/* Attendance Table with Check-in & Check-out */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800">
            Attendance Log Details (Daily Sessions History)
          </h3>
          <span className="text-xs text-slate-400">
            Total records: {records.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6 font-semibold">Date / Session</th>
                <th className="py-4 px-6 font-semibold">Status</th>
                <th className="py-4 px-6 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <LogIn className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Check-In</span>
                  </div>
                </th>
                <th className="py-4 px-6 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <LogOut className="w-3.5 h-3.5 text-blue-600" />
                    <span>Check-Out</span>
                  </div>
                </th>
                <th className="py-4 px-6 font-semibold text-right">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {records.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400 text-xs">
                    No attendance records found yet for this student.
                  </td>
                </tr>
              ) : (
                records.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-800 text-xs">
                        {row.date}
                      </div>
                      {row.sessionNum && (
                        <div className="text-[10px] font-bold text-blue-600 mt-0.5 inline-flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                          <span>Session {row.sessionNum}</span>
                          <span className="text-slate-400">•</span>
                          <span>{row.sessionNum === 1 ? 'Morning' : 'Afternoon'}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {row.status === 'Checked In' || (!row.checkOut || row.checkOut === '-') ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                          Checked In
                        </span>
                      ) : row.status === 'Present' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Present
                        </span>
                      ) : row.status === 'Checked Out' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <LogOut className="w-3.5 h-3.5 text-blue-600" />
                          Checked Out
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          Absent
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs font-semibold">
                      {row.checkIn !== '-' ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
                          <LogIn className="w-3.5 h-3.5 text-emerald-600" />
                          {row.checkIn}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs font-semibold">
                      {row.checkOut && row.checkOut !== '-' ? (
                        <span className="inline-flex items-center gap-1.5 text-blue-700 font-bold">
                          <LogOut className="w-3.5 h-3.5 text-blue-600" />
                          {row.checkOut}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border border-emerald-200">
                          <Clock className="w-3 h-3 text-emerald-600 animate-spin" style={{ animationDuration: '6s' }} />
                          In School
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right font-medium text-xs text-slate-500">
                      {row.source}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
