import React, { useState, useEffect } from 'react';
import {
  Download,
  Upload,
  Printer,
  Calendar,
  Filter,
  Plus,
  CheckCircle2,
  XCircle,
  Search,
  MessageCircle,
  FileSpreadsheet,
  AlertCircle,
  X,
  FileText
} from 'lucide-react';
import api from '../../services/api';

export default function AdminAttendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [feedback, setFeedback] = useState(null);

  // Manual Attendance Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    student_id: '',
    attendance_date: new Date().toISOString().slice(0, 10),
    status: 'Present',
    check_in_time: '08:00 AM',
    check_out_time: '02:00 PM'
  });

  // Bulk Import Modal States
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importParsedRecords, setImportParsedRecords] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccessMessage, setImportSuccessMessage] = useState('');

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      let query = `?date=${selectedDate}`;
      if (selectedClass) query += `&class_id=${selectedClass}`;
      if (selectedStatus) query += `&status=${selectedStatus}`;

      const [attRes, clsRes, stuRes] = await Promise.allSettled([
        api.get(`/attendance${query}`),
        api.get('/classes'),
        api.get('/students')
      ]);

      if (attRes.status === 'fulfilled' && attRes.value.data.success) {
        setRecords(attRes.value.data.records || []);
      }
      if (clsRes.status === 'fulfilled' && clsRes.value.data.success) {
        setClasses(clsRes.value.data.classes || []);
      }
      if (stuRes.status === 'fulfilled' && stuRes.value.data.success) {
        setStudents(stuRes.value.data.students || []);
      }
    } catch (err) {
      console.error('Fetch attendance error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, selectedClass, selectedStatus]);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/attendance/manual', manualForm);
      setModalOpen(false);
      setFeedback({
        type: 'success',
        message: res.data?.message || 'Attendance recorded. Web & WhatsApp alert dispatched to parent.'
      });
      setTimeout(() => setFeedback(null), 5000);
      fetchAttendance();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Error recording attendance');
    }
  };

  const handleExportCSV = () => {
    if (records.length === 0) return alert('No records to export');
    const headers = ['Student Name', 'Class', 'Date', 'Status', 'Check-In Time', 'Check-Out Time', 'Source'];
    const rows = records.map(r => [
      `"${(r.student_name || '').replace(/"/g, '""')}"`,
      `"${r.class_name || ''}"`,
      `"${r.attendance_date || selectedDate}"`,
      `"${r.status || 'Present'}"`,
      `"${r.check_in_time || '-'}"`,
      `"${r.check_out_time || '-'}"`,
      `"${r.source || 'Biometric Device'}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Highlight_Attendance_Report_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintReport = () => {
    window.print();
  };

  // Download Sample Attendance CSV Template
  const handleDownloadSampleTemplate = () => {
    const headers = [
      'Roll Number',
      'Student Name',
      'Date',
      'Check-In Time',
      'Check-Out Time',
      'Status'
    ];
    const sampleRows = [
      ['025', 'Ahmed Khan', selectedDate, '07:55 AM', '01:45 PM', 'Present'],
      ['026', 'Fatima Zahra', selectedDate, '08:02 AM', '01:50 PM', 'Present'],
      ['027', 'Muhammad Bilal', selectedDate, '08:20 AM', '', 'Late'],
      ['028', 'Ayesha Siddiqua', selectedDate, '', '', 'Absent']
    ];
    const csvContent = '\uFEFF' + [headers.join(','), ...sampleRows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_attendance_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Parse Uploaded Attendance CSV
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportError('');
    setImportSuccessMessage('');
    setImportParsedRecords([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
          setImportError('CSV file must have a header row and at least one attendance record.');
          return;
        }

        const parseCsvLine = (line) => {
          const result = [];
          let cur = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"' || char === "'") {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(cur.trim().replace(/^["']|["']$/g, ''));
              cur = '';
            } else {
              cur += char;
            }
          }
          result.push(cur.trim().replace(/^["']|["']$/g, ''));
          return result;
        };

        const headerLine = parseCsvLine(lines[0]);
        const headerNorm = headerLine.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

        const rollIdx = headerNorm.findIndex(h => h.includes('roll') || h.includes('id'));
        const nameIdx = headerNorm.findIndex(h => h.includes('student') || h.includes('name'));
        const dateIdx = headerNorm.findIndex(h => h.includes('date'));
        const checkInIdx = headerNorm.findIndex(h => h.includes('checkin') || h.includes('in'));
        const checkOutIdx = headerNorm.findIndex(h => h.includes('checkout') || h.includes('out'));
        const statusIdx = headerNorm.findIndex(h => h.includes('status'));

        const parsed = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = parseCsvLine(lines[i]);
          if (cols.length === 0 || cols.every(c => c === '')) continue;

          const rollNo = rollIdx !== -1 ? cols[rollIdx] : (cols[0] || '');
          const studentName = nameIdx !== -1 ? cols[nameIdx] : (cols[1] || '');
          const attDate = dateIdx !== -1 ? cols[dateIdx] : (cols[2] || selectedDate);
          const checkIn = checkInIdx !== -1 ? cols[checkInIdx] : (cols[3] || '08:00 AM');
          const checkOut = checkOutIdx !== -1 ? cols[checkOutIdx] : (cols[4] || '');
          const status = statusIdx !== -1 ? cols[statusIdx] : (cols[5] || 'Present');

          if (rollNo || studentName) {
            parsed.push({
              roll_number: rollNo,
              student_name: studentName,
              attendance_date: attDate || selectedDate,
              check_in_time: checkIn,
              check_out_time: checkOut,
              status: status || 'Present'
            });
          }
        }

        if (parsed.length === 0) {
          setImportError('No valid attendance rows found. Please check column format.');
          return;
        }

        setImportParsedRecords(parsed);
      } catch (err) {
        setImportError(`Failed to parse CSV file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Submit Bulk Attendance Import
  const handleConfirmImport = async () => {
    if (importParsedRecords.length === 0) return;
    setImporting(true);
    setImportError('');
    try {
      const res = await api.post('/attendance/bulk', { records: importParsedRecords });
      if (res.data?.success) {
        setImportSuccessMessage(res.data.message || `Imported ${res.data.count} attendance records successfully!`);
        setFeedback({
          type: 'success',
          message: `Bulk Attendance Import Complete: Processed ${res.data.count} student records.`
        });
        setTimeout(() => setFeedback(null), 5000);
        await fetchAttendance();
        setTimeout(() => {
          setImportModalOpen(false);
          setImportParsedRecords([]);
          setImportSuccessMessage('');
        }, 1200);
      } else {
        setImportError(res.data?.message || 'Import failed.');
      }
    } catch (err) {
      setImportError(err.response?.data?.message || err.message || 'Error executing bulk import.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Feedback */}
      {feedback && (
        <div className="p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in bg-emerald-50 text-emerald-800 border border-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Header and Filter Bar matching screenshot */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Attendance
          </h2>
          <p className="text-xs text-slate-500">
            Real-time biometric attendance records and manual entries
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="py-2 px-3 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Class Dropdown */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="py-2 px-3 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
            title="Download attendance as CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* Import CSV Button */}
          <button
            onClick={() => {
              setImportError('');
              setImportSuccessMessage('');
              setImportParsedRecords([]);
              setImportModalOpen(true);
            }}
            className="px-3.5 py-2 bg-white border border-blue-200 hover:bg-blue-50/50 text-blue-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
            title="Bulk import attendance from CSV file"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>Import CSV</span>
          </button>

          {/* Print / Report Button */}
          <button
            onClick={handlePrintReport}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
            title="Print daily attendance report"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Report</span>
          </button>

          {/* Manual Entry Button */}
          <button
            onClick={() => setModalOpen(true)}
            className="px-3.5 py-2 bg-[#1a73e8] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Mark Manual</span>
          </button>
        </div>
      </div>

      {/* Main Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6 font-semibold">Check-In</th>
                <th className="py-4 px-6 font-semibold">Check-Out</th>
                <th className="py-4 px-6 font-semibold">Student Name</th>
                <th className="py-4 px-6 font-semibold">Class</th>
                <th className="py-4 px-6 font-semibold">Status</th>
                <th className="py-4 px-6 font-semibold text-right">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 text-xs">
                    Loading attendance records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 text-xs">
                    No attendance records found for this date/filter.
                  </td>
                </tr>
              ) : (
                records.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 text-emerald-700 text-xs font-mono font-semibold">
                      {row.check_in_time || '-'}
                    </td>
                    <td className="py-4 px-6 text-blue-700 text-xs font-mono font-semibold">
                      {row.check_out_time || '-'}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      {row.student_name}
                    </td>
                    <td className="py-4 px-6 text-slate-600 text-xs font-medium">
                      {row.class_name}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          row.status === 'Checked In'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold'
                            : row.status === 'Checked Out'
                            ? 'bg-blue-100 text-blue-700'
                            : row.status === 'Present'
                            ? 'bg-emerald-100/80 text-emerald-700'
                            : 'bg-rose-100/80 text-rose-700'
                        }`}
                      >
                        {row.status === 'Checked In' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>}
                        {row.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right text-xs font-medium text-slate-500">
                      {row.source}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Attendance Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Mark Attendance Manually
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Record attendance for students unable to scan biometric fingerprint.
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Student
                </label>
                <select
                  required
                  value={manualForm.student_id}
                  onChange={(e) => setManualForm({ ...manualForm, student_id: e.target.value })}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} (Roll: {s.roll_number} - {s.class_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={manualForm.attendance_date}
                  onChange={(e) => setManualForm({ ...manualForm, attendance_date: e.target.value })}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Check-in Time
                  </label>
                  <input
                    type="text"
                    value={manualForm.check_in_time}
                    onChange={(e) => setManualForm({ ...manualForm, check_in_time: e.target.value })}
                    placeholder="08:00 AM"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Check-out Time
                  </label>
                  <input
                    type="text"
                    value={manualForm.check_out_time}
                    onChange={(e) => setManualForm({ ...manualForm, check_out_time: e.target.value })}
                    placeholder="02:00 PM"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setManualForm({ ...manualForm, status: 'Present' })}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                      manualForm.status === 'Present'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    Present
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualForm({ ...manualForm, status: 'Checked Out' })}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                      manualForm.status === 'Checked Out'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    Checked Out
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualForm({ ...manualForm, status: 'Absent' })}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                      manualForm.status === 'Absent'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    Absent
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 flex items-start gap-2.5">
                <MessageCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p>
                  Marking <strong>Present</strong> or <strong>Checked Out</strong> automatically triggers a real-time <strong>Parent Portal Notification</strong> and dispatches an official <strong>WhatsApp SMS Alert</strong> to the parent's phone.
                </p>
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
                  className="px-5 py-2.5 bg-[#1a73e8] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Attendance Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Bulk Import Attendance (CSV)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Upload daily attendance sheets from biometric machines or offline spreadsheets
                  </p>
                </div>
              </div>
              <button
                onClick={() => setImportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Sample Template Download Box */}
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs text-blue-900">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Need the correct columns layout? Download the standardized CSV template:</span>
                </div>
                <button
                  onClick={handleDownloadSampleTemplate}
                  className="px-3 py-1.5 bg-white border border-blue-200 hover:bg-blue-100/50 text-blue-700 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 flex-shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Template</span>
                </button>
              </div>

              {/* File Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Attendance CSV File
                </label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100/80 cursor-pointer border border-slate-200 rounded-xl bg-slate-50/40 p-1"
                />
              </div>

              {/* Error Notice */}
              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Success Notice */}
              {importSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{importSuccessMessage}</span>
                </div>
              )}

              {/* Preview Table */}
              {importParsedRecords.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Parsed Attendance Rows Preview ({importParsedRecords.length} records ready):</span>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100/80 sticky top-0 text-[11px] font-semibold text-slate-600 uppercase">
                        <tr>
                          <th className="py-2 px-3">Roll No</th>
                          <th className="py-2 px-3">Student Name</th>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3">Check-In</th>
                          <th className="py-2 px-3">Check-Out</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importParsedRecords.slice(0, 15).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="py-2 px-3 font-semibold text-slate-800">{row.roll_number || '-'}</td>
                            <td className="py-2 px-3 text-slate-700">{row.student_name || '-'}</td>
                            <td className="py-2 px-3 text-slate-600">{row.attendance_date}</td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                row.status === 'Present' ? 'bg-emerald-50 text-emerald-700' :
                                row.status === 'Absent' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                              }`}>
                                {row.status}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-emerald-700 font-mono text-[11px]">{row.check_in_time || '-'}</td>
                            <td className="py-2 px-3 text-blue-700 font-mono text-[11px]">{row.check_out_time || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {importParsedRecords.length > 15 && (
                    <p className="text-[11px] text-slate-400 text-right">
                      ...and {importParsedRecords.length - 15} more records
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={importing || importParsedRecords.length === 0}
                className="px-5 py-2.5 bg-[#1a73e8] hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
              >
                {importing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload {importParsedRecords.length > 0 ? `(${importParsedRecords.length}) Records` : 'Attendance'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
