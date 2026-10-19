import React, { useState, useEffect, useRef } from 'react';
import { Users, Plus, Search, Edit2, Trash2, Fingerprint, Phone, Mail, CheckCircle, Shield, Eye, EyeOff, KeyRound, Download, Upload, FileSpreadsheet, AlertCircle, Award, Camera, Calendar, MapPin, Activity, Sparkles } from 'lucide-react';
import api from '../../services/api';
import BirthCertificateModal from '../../components/BirthCertificateModal';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');

  // Modals & Actions
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deleteModalStudent, setDeleteModalStudent] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showParentPassword, setShowParentPassword] = useState(false);

  // Avatar / Photo upload state
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const avatarInputRef = useRef(null);

  // Bulk Import CSV State
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importParsedStudents, setImportParsedStudents] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccessMessage, setImportSuccessMessage] = useState('');

  // Birth Certificate Modal State
  const [birthCertModalOpen, setBirthCertModalOpen] = useState(false);
  const [selectedCertStudent, setSelectedCertStudent] = useState(null);

  // Sibling / Multi-Child Registration State ("ek ghar k 2 bachy be hoskty hai 3 b hoskty hai")
  const [linkExistingParent, setLinkExistingParent] = useState(false);
  const [selectedParentKey, setSelectedParentKey] = useState('');

  const [form, setForm] = useState({
    full_name: '',
    roll_number: '',
    class_id: '1',
    gender: 'Male',
    father_name: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    parent_password: '',
    dob: '2018-03-10',
    address: 'Highlight Model School Area, Islamabad',
    blood_group: 'B+ Positive',
    emergency_contact: '',
    fingerprint_device_id: '',
    status: 'Active',
    avatar_url: ''
  });

  // Extract unique families/parents across enrolled students
  const existingParents = React.useMemo(() => {
    const map = new Map();
    students.forEach(s => {
      const email = s.parent_email?.toLowerCase().trim();
      const phone = s.parent_phone?.trim();
      const name = s.parent_name?.trim();
      const key = email || phone || name;
      if (key && !map.has(key)) {
        map.set(key, {
          parent_name: name || 'Parent',
          parent_phone: phone || '',
          parent_email: email || '',
          children: [s.full_name]
        });
      } else if (key && map.has(key)) {
        if (!map.get(key).children.includes(s.full_name)) {
          map.get(key).children.push(s.full_name);
        }
      }
    });
    return Array.from(map.values());
  }, [students]);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [stuRes, clsRes] = await Promise.allSettled([
        api.get('/students'),
        api.get('/classes')
      ]);
      if (stuRes.status === 'fulfilled' && stuRes.value.data.success) {
        setStudents(stuRes.value.data.students || []);
      }
      if (clsRes.status === 'fulfilled' && clsRes.value.data.success) {
        setClasses(clsRes.value.data.classes || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setShowParentPassword(false);
    setLinkExistingParent(false);
    setSelectedParentKey('');
    setAvatarFile(null);
    setAvatarPreview('');
    const nextRoll = `HMS-0${students.length + 1}`;
    setForm({
      full_name: '',
      roll_number: nextRoll,
      class_id: '1',
      gender: 'Male',
      father_name: '',
      parent_name: '',
      parent_phone: '',
      parent_email: `parent.${nextRoll.toLowerCase()}@highlight.school`,
      parent_password: 'Parent@123',
      dob: '2018-03-10',
      address: 'Highlight Model School Area, Islamabad',
      blood_group: 'B+ Positive',
      emergency_contact: '',
      fingerprint_device_id: `FP-${nextRoll}`,
      status: 'Active',
      avatar_url: ''
    });
    setModalOpen(true);
  };

  const handleSelectExistingParent = (parentKey) => {
    setSelectedParentKey(parentKey);
    const found = existingParents.find(p => (p.parent_email || p.parent_phone || p.parent_name) === parentKey);
    if (found) {
      setForm(prev => ({
        ...prev,
        father_name: found.parent_name,
        parent_name: found.parent_name,
        parent_phone: found.parent_phone,
        parent_email: found.parent_email,
        parent_password: 'Parent@123'
      }));
    }
  };

  const handleEnrollAndAddSibling = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.roll_number || !form.class_id) {
      alert('Student name, roll number, and class are required.');
      return;
    }
    try {
      const res = await api.post('/students', form);
      const enrolledName = form.full_name;
      const savedStudentId = res.data?.student?.id;
      if (avatarFile && savedStudentId) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        await api.post(`/students/${savedStudentId}/avatar`, formData);
      }

      setToastMessage(`Student "${enrolledName}" enroll ho gaya! Ab is ke doosray bhai/behen (Sibling) ki details darj karein.`);
      setTimeout(() => setToastMessage(''), 5000);
      await fetchData(true);

      // Keep parent credentials intact and prepare for next child
      const numMatch = form.roll_number.match(/\d+/);
      const nextNum = numMatch ? String(parseInt(numMatch[0], 10) + 1).padStart(numMatch[0].length, '0') : `${Date.now()}`.slice(-3);
      setAvatarFile(null);
      setAvatarPreview('');
      setForm(prev => ({
        ...prev,
        full_name: '',
        roll_number: `HMS-${nextNum}`,
        fingerprint_device_id: `FP-${nextNum}`,
        avatar_url: ''
      }));
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Operation failed');
    }
  };

  const handleOpenEdit = (stu) => {
    setEditingStudent(stu);
    setShowParentPassword(false);
    setLinkExistingParent(false);
    setSelectedParentKey('');
    setAvatarFile(null);
    setAvatarPreview(stu.avatar_url || stu.photo_url || '');

    let resolvedClassId = stu.class_id ? String(stu.class_id) : '1';
    if (stu.class_name) {
      const matched = classes.find(c => c.name.toLowerCase() === stu.class_name.toLowerCase());
      if (matched) resolvedClassId = String(matched.id);
    }

    setForm({
      full_name: stu.full_name || '',
      roll_number: stu.roll_number || '',
      class_id: resolvedClassId,
      gender: stu.gender || 'Male',
      father_name: stu.father_name || stu.parent_name || '',
      parent_name: stu.parent_name || stu.father_name || '',
      parent_phone: stu.parent_phone || '',
      parent_email: stu.parent_email || `parent.${stu.roll_number}@highlight.school`,
      parent_password: '',
      dob: stu.dob || stu.date_of_birth || '',
      address: stu.address || '',
      blood_group: stu.blood_group || 'B+ Positive',
      emergency_contact: stu.emergency_contact || stu.parent_phone || '',
      fingerprint_device_id: stu.fingerprint_device_id || '',
      status: stu.status || 'Active',
      avatar_url: stu.avatar_url || ''
    });
    setModalOpen(true);
  };

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // If editing existing student, immediately upload and persist to backend
    if (editingStudent?.id) {
      try {
        setUploadingAvatar(true);
        const formData = new FormData();
        formData.append('avatar', file);
        const res = await api.post(`/students/${editingStudent.id}/avatar`, formData);
        if (res.data?.success && res.data.avatar_url) {
          const freshUrl = `${res.data.avatar_url}?t=${Date.now()}`;
          setAvatarPreview(freshUrl);
          setForm(prev => ({ ...prev, avatar_url: res.data.avatar_url }));
          setStudents(prev => prev.map(s => String(s.id) === String(editingStudent.id) ? { ...s, avatar_url: res.data.avatar_url } : s));
          setToastMessage('Student photo updated and saved successfully!');
          setTimeout(() => setToastMessage(''), 3000);
        }
      } catch (err) {
        console.error('Instant avatar upload error:', err);
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let savedStudentId = editingStudent ? editingStudent.id : null;
      if (editingStudent) {
        const res = await api.put(`/students/${editingStudent.id}`, form);
        if (res.data?.student?.id) savedStudentId = res.data.student.id;
      } else {
        const res = await api.post('/students', form);
        if (res.data?.student?.id) savedStudentId = res.data.student.id;
      }

      if (avatarFile && savedStudentId) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        await api.post(`/students/${savedStudentId}/avatar`, formData);
      }

      setToastMessage(editingStudent ? `Student "${form.full_name}" details updated successfully!` : `Student "${form.full_name}" registered successfully!`);
      setTimeout(() => setToastMessage(''), 4000);
      setModalOpen(false);
      setEditingStudent(null);
      setAvatarFile(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Operation failed');
    }
  };

  const confirmDelete = async () => {
    if (!deleteModalStudent) return;
    setDeleting(true);
    try {
      const targetId = deleteModalStudent.id;
      const deletedName = deleteModalStudent.full_name;
      await api.delete(`/students/${targetId}`);
      // Optimistic local update so row disappears instantly
      setStudents(prev => prev.filter(s => String(s.id) !== String(targetId)));
      setDeleteModalStudent(null);
      setToastMessage(`Student "${deletedName}" has been deleted successfully.`);
      setTimeout(() => setToastMessage(''), 4000);
      await fetchData(true);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete student');
    } finally {
      setDeleting(false);
    }
  };

  // Export Students to CSV
  const handleExportCSV = () => {
    const listToExport = filtered.length > 0 ? filtered : students;
    if (listToExport.length === 0) {
      alert('No student records to export.');
      return;
    }

    const headers = [
      'Roll Number',
      'Student Name',
      'Class',
      'Gender',
      'Fingerprint ID',
      'Parent Name',
      'Parent Phone',
      'Parent Email',
      'Status'
    ];

    const rows = listToExport.map(s => [
      `"${s.roll_number || ''}"`,
      `"${(s.full_name || '').replace(/"/g, '""')}"`,
      `"${s.class_name || ''}"`,
      `"${s.gender || 'Male'}"`,
      `"${s.fingerprint_device_id || ''}"`,
      `"${(s.parent_name || '').replace(/"/g, '""')}"`,
      `"${s.parent_phone || ''}"`,
      `"${s.parent_email || ''}"`,
      `"${s.status || 'Active'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Highlight_Students_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download Sample CSV Template
  const handleDownloadSampleTemplate = () => {
    const templateHeaders = [
      'Roll Number',
      'Student Name',
      'Class',
      'Gender',
      'Fingerprint ID',
      'Parent Name',
      'Parent Phone',
      'Parent Email',
      'Status'
    ];
    const sampleRows = [
      ['030', 'Zaid Khan', 'Grade 8', 'Male', 'FP-030', 'Kamran Khan', '+92 300 1112233', 'kamran.khan@gmail.com', 'Active'],
      ['031', 'Fatima Noor', 'Grade 5', 'Female', 'FP-031', 'Noor Muhammad', '+92 300 4445566', 'noor.m@gmail.com', 'Active'],
      ['032', 'Bilal Ahmed', 'Grade 6', 'Male', 'FP-032', 'Ahmed Farooq', '+92 300 7778899', 'ahmed.farooq@gmail.com', 'Active']
    ];

    const csvContent = '\uFEFF' + [templateHeaders.join(','), ...sampleRows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_students_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Parse CSV File on upload
  const handleCSVFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportError('');
    setImportSuccessMessage('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
          setImportError('CSV file must contain a header row and at least one student data row.');
          return;
        }

        const parseCSVLine = (line) => {
          const values = [];
          let current = '';
          let insideQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
              values.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          values.push(current.trim());
          return values.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
        };

        const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
        const parsedStudents = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i]);
          if (cols.length === 0 || !cols.some(c => c)) continue;

          const rollIndex = headers.findIndex(h => h.includes('roll'));
          const nameIndex = headers.findIndex(h => h.includes('name') && !h.includes('parent'));
          const classIndex = headers.findIndex(h => h.includes('class'));
          const genderIndex = headers.findIndex(h => h.includes('gender'));
          const fpIndex = headers.findIndex(h => h.includes('fingerprint') || h.includes('fp') || h.includes('device'));
          const parentNameIndex = headers.findIndex(h => h.includes('parent') && h.includes('name'));
          const parentPhoneIndex = headers.findIndex(h => h.includes('phone') || h.includes('contact'));
          const parentEmailIndex = headers.findIndex(h => h.includes('email') || h.includes('mail'));

          const rollNumber = rollIndex !== -1 ? cols[rollIndex] : cols[0];
          const fullName = nameIndex !== -1 ? cols[nameIndex] : cols[1];
          const className = classIndex !== -1 ? cols[classIndex] : (cols[2] || 'Grade 5');
          const gender = genderIndex !== -1 ? cols[genderIndex] : (cols[3] || 'Male');
          const fpId = fpIndex !== -1 ? cols[fpIndex] : (cols[4] || `FP-${rollNumber}`);
          const parentName = parentNameIndex !== -1 ? cols[parentNameIndex] : (cols[5] || `Parent of ${fullName}`);
          const parentPhone = parentPhoneIndex !== -1 ? cols[parentPhoneIndex] : (cols[6] || '+92 300 0000000');
          const parentEmail = parentEmailIndex !== -1 ? cols[parentEmailIndex] : (cols[7] || `parent.${rollNumber}@highlight.school`);

          if (fullName && rollNumber) {
            parsedStudents.push({
              roll_number: rollNumber,
              full_name: fullName,
              class_name: className,
              gender: gender || 'Male',
              fingerprint_device_id: fpId || `FP-${rollNumber}`,
              parent_name: parentName,
              parent_phone: parentPhone,
              parent_email: parentEmail,
              status: 'Active'
            });
          }
        }

        if (parsedStudents.length === 0) {
          setImportError('No valid student rows found. Please check column headers.');
          return;
        }

        setImportParsedStudents(parsedStudents);
      } catch (err) {
        setImportError(`Failed to parse CSV file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Submit Bulk Import
  const handleConfirmImport = async () => {
    if (importParsedStudents.length === 0) return;
    setImporting(true);
    setImportError('');
    try {
      const res = await api.post('/students/bulk', { students: importParsedStudents });
      if (res.data?.success) {
        setImportSuccessMessage(res.data.message || `Imported ${res.data.count} students successfully!`);
        setToastMessage(`Bulk Import Successful: Processed ${res.data.count} students.`);
        setTimeout(() => setToastMessage(''), 4000);
        await fetchData(true);
        setTimeout(() => {
          setImportModalOpen(false);
          setImportParsedStudents([]);
          setImportSuccessMessage('');
        }, 1200);
      } else {
        setImportError(res.data?.message || 'Import failed.');
      }
    } catch (err) {
      setImportError(err.response?.data?.message || err.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  const filtered = students.filter(s => {
    const q = search.toLowerCase().trim();
    const cleanId = q.replace(/^id[:\s#]*/i, '').trim();
    const matchesSearch = !q ||
      (cleanId && (String(s.id) === cleanId || String(s.id).includes(cleanId))) ||
      s.full_name?.toLowerCase().includes(q) ||
      s.roll_number?.toLowerCase().includes(q) ||
      s.fingerprint_device_id?.toLowerCase().includes(q) ||
      s.parent_name?.toLowerCase().includes(q);
    const matchesClass = !classFilter || String(s.class_id) === String(classFilter);
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="text-emerald-700 hover:text-emerald-900 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Header with Import, Export & Add Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Student Management
          </h2>
          <p className="text-xs text-slate-500">
            Enroll students, assign classes, and link biometric fingerprint identifiers
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-2"
            title="Export student directory to CSV spreadsheet"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* Import CSV Button */}
          <button
            onClick={() => {
              setImportError('');
              setImportSuccessMessage('');
              setImportParsedStudents([]);
              setImportModalOpen(true);
            }}
            className="px-3.5 py-2.5 bg-white border border-blue-200 hover:bg-blue-50/50 text-blue-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-2"
            title="Import student roster in bulk from CSV file"
          >
            <Upload className="w-4 h-4 text-blue-600" />
            <span>Import CSV</span>
          </button>

          {/* Birth Certificate Button */}
          <button
            onClick={() => {
              setSelectedCertStudent(null);
              setBirthCertModalOpen(true);
            }}
            className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 active:scale-95"
            title="Generate and print official Date of Birth Certificate"
          >
            <Award className="w-4 h-4" />
            <span>Birth Certificate</span>
          </button>

          {/* Add Student Button */}
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-[#1a73e8] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Student</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student ID (#), name, roll number, or fingerprint..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="py-2 px-3 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 w-full sm:w-auto"
        >
          <option value="">All Classes</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6 font-semibold">Roll No</th>
                <th className="py-4 px-6 font-semibold">Student Name</th>
                <th className="py-4 px-6 font-semibold">Class</th>
                <th className="py-4 px-6 font-semibold">Fingerprint ID</th>
                <th className="py-4 px-6 font-semibold">Parent / Contact</th>
                <th className="py-4 px-6 font-semibold">Status</th>
                <th className="py-4 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 text-xs">
                    Loading student directory...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 text-xs">
                    No students found matching your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((stu) => (
                  <tr key={stu.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs font-bold text-slate-600">
                      {stu.roll_number}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 shadow-2xs">
                          {stu.avatar_url || stu.photo_url ? (
                            <img
                              src={stu.avatar_url || stu.photo_url}
                              alt={stu.full_name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/uploads/roman_profile.png';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-xs bg-slate-200">
                              {stu.full_name?.charAt(0) || 'S'}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{stu.full_name}</span>
                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                              ID #{stu.id}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {stu.gender} • DOB: {stu.dob || stu.date_of_birth || '2018-03-10'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-700 text-xs font-medium">
                      {stu.class_name}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-[#1a73e8] font-mono text-xs font-semibold">
                        <Fingerprint className="w-3.5 h-3.5" />
                        {stu.fingerprint_device_id || 'Not Enrolled'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-800">{stu.father_name || stu.parent_name || 'Guardian'}</span>
                        {(() => {
                          const siblings = students.filter(s => s.id !== stu.id && (
                            (s.parent_email && stu.parent_email && s.parent_email.toLowerCase() === stu.parent_email.toLowerCase()) ||
                            (s.parent_phone && stu.parent_phone && s.parent_phone === stu.parent_phone)
                          ));
                          if (siblings.length > 0) {
                            return (
                              <span
                                className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5"
                                title={`Siblings: ${siblings.map(s => s.full_name).join(', ')}`}
                              >
                                <span>👨‍👩‍👧</span>
                                <span>+{siblings.length} sibling</span>
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div className="text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {stu.parent_phone || '+1 555-0100'}
                      </div>
                      <div className="text-blue-600 flex items-center gap-1 mt-0.5 text-[11px] font-mono">
                        <Mail className="w-3 h-3" /> {stu.parent_email || `parent.${stu.roll_number}@highlight.school`}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${stu.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                        {stu.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedCertStudent(stu);
                            setBirthCertModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Generate Date of Birth Certificate"
                        >
                          <Award className="w-4 h-4 text-amber-500" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(stu)}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1a73e8] rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-blue-200"
                          title="Edit Student Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteModalStudent(stu)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Student"
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

      {/* Add / Edit Student Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {editingStudent ? 'Edit Student Details' : 'Register New Student'}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Enter academic credentials and biometric enrollment token.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Student Photo / Avatar Section */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white border-2 border-blue-500 shadow-sm flex items-center justify-center">
                    {avatarPreview || form.avatar_url ? (
                      <img
                        src={avatarPreview || form.avatar_url}
                        alt="Student Avatar"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/uploads/roman_real.png';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50 text-blue-600">
                        <Users className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 p-1.5 bg-[#1a73e8] text-white rounded-xl shadow-md hover:bg-blue-700 transition-transform active:scale-95"
                    title="Upload / Change Photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <h4 className="text-xs font-bold text-slate-800">Student Profile Photo</h4>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Official passport-size portrait for ID Cards, Documents, and Portal.
                  </p>
                  <input
                    type="file"
                    ref={avatarInputRef}
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <button
                      type="button"
                      disabled={uploadingAvatar}
                      onClick={() => avatarInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>{uploadingAvatar ? 'Uploading & Saving...' : (avatarFile ? 'Change Selected' : 'Upload New Photo')}</span>
                    </button>
                    {uploadingAvatar ? (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 animate-pulse">
                        ⏳ Uploading...
                      </span>
                    ) : avatarFile && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        ✓ Photo Updated & Saved
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Student Name & Roll Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="e.g. Roman zaman"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Roll Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.roll_number}
                    onChange={(e) => setForm({ ...form, roll_number: e.target.value })}
                    placeholder="e.g. HMS-01"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono font-bold focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Father Name & Date of Birth */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Father's / Guardian Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.father_name || form.parent_name}
                    onChange={(e) => setForm({ ...form, father_name: e.target.value, parent_name: e.target.value })}
                    placeholder="e.g. Khalid"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Date of Birth (DOB)</span>
                    <span className="text-[10px] text-blue-600 font-mono font-normal">{form.dob || 'YYYY-MM-DD'}</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="date"
                      value={form.dob}
                      onChange={(e) => setForm({ ...form, dob: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Class & Gender */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Class / Grade</label>
                  <select
                    value={form.class_id}
                    onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              {/* Residential Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Residential Address
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="e.g. Highlight Model School Area, Islamabad"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Blood Group, Emergency Phone, Biometric, Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
                  <select
                    value={form.blood_group}
                    onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
                  >
                    <option value="B+ Positive">B+ Positive</option>
                    <option value="A+ Positive">A+ Positive</option>
                    <option value="O+ Positive">O+ Positive</option>
                    <option value="AB+ Positive">AB+ Positive</option>
                    <option value="B- Negative">B- Negative</option>
                    <option value="A- Negative">A- Negative</option>
                    <option value="O- Negative">O- Negative</option>
                    <option value="AB- Negative">AB- Negative</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white"
                  >
                    <option value="Active">Active (Enrolled)</option>
                    <option value="Inactive">Inactive / Suspended</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fingerprint Biometric ID</label>
                  <input
                    type="text"
                    value={form.fingerprint_device_id}
                    onChange={(e) => setForm({ ...form, fingerprint_device_id: e.target.value })}
                    placeholder="e.g. FP-025"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={form.parent_phone}
                    onChange={(e) => setForm({ ...form, parent_phone: e.target.value })}
                    placeholder="+92 300 1234567"
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Parent Portal Login Credentials */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#1a73e8] text-white flex items-center justify-center flex-shrink-0">
                    <KeyRound className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">
                      Parent Portal Login Access
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      Parent will use this email & password to sign in to the Parent Portal
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Parent Login Email
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        value={form.parent_email}
                        onChange={(e) => setForm({ ...form, parent_email: e.target.value })}
                        placeholder="parent@highlight.school"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Parent Portal Password
                    </label>
                    <div className="relative">
                      <input
                        type={showParentPassword ? "text" : "password"}
                        value={form.parent_password}
                        onChange={(e) => setForm({ ...form, parent_password: e.target.value })}
                        placeholder={editingStudent ? "Leave blank to keep current" : "Default: Parent@123"}
                        className="w-full pl-3 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowParentPassword(!showParentPassword)}
                        className="absolute right-2 top-1.5 p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                        title={showParentPassword ? "Hide password" : "Show password"}
                      >
                        {showParentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 mr-auto"
                >
                  Cancel
                </button>
                {!editingStudent && (
                  <button
                    type="button"
                    onClick={handleEnrollAndAddSibling}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                    title="Enroll this child and immediately enter details for the next sibling under the same family"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Enroll & Add Sibling (+1 Bacha Aur)</span>
                  </button>
                )}
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#1a73e8] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  {editingStudent ? 'Save Changes' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Delete Student?
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-900">{deleteModalStudent.full_name}</span> (Roll: {deleteModalStudent.roll_number})? This action cannot be undone and will remove all linked attendance and performance records.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl mb-5 text-xs text-slate-600 space-y-1">
              <p><span className="text-slate-400">Class:</span> <span className="font-semibold text-slate-800">{deleteModalStudent.class_name}</span></p>
              <p><span className="text-slate-400">Biometric ID:</span> <span className="font-mono font-semibold text-blue-600">{deleteModalStudent.fingerprint_device_id || 'None'}</span></p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteModalStudent(null)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Bulk Import Students (CSV)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Upload a CSV file to enroll multiple students and create parent accounts automatically.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setImportModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            {/* Template Download Banner */}
            <div className="my-5 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-slate-800">Need a format guide?</p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Download our pre-formatted template with standard headers and sample data.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadSampleTemplate}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold flex items-center gap-1.5 shadow-2xs self-start sm:self-auto whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Download Sample CSV</span>
              </button>
            </div>

            {/* Error Message */}
            {importError && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {/* Success Message */}
            {importSuccessMessage && (
              <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{importSuccessMessage}</span>
              </div>
            )}

            {/* File Upload Box */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Select CSV Spreadsheet File (.csv)
              </label>
              <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors group text-center">
                <FileSpreadsheet className="w-8 h-8 text-slate-400 group-hover:text-blue-500 mb-2 transition-colors" />
                <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600">
                  Click to choose file or drag & drop here
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  Supported format: .csv (Comma Separated Values)
                </span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleCSVFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Preview of Parsed Rows */}
            {importParsedStudents.length > 0 && (
              <div className="mb-5 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>File Parsed: {importParsedStudents.length} Students Detected</span>
                  <span className="text-emerald-600 font-semibold text-[11px]">Ready to import</span>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-48 text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 text-[10px] text-slate-500 uppercase sticky top-0">
                      <tr>
                        <th className="p-2">Roll No</th>
                        <th className="p-2">Student Name</th>
                        <th className="p-2">Class</th>
                        <th className="p-2">Parent</th>
                        <th className="p-2">Phone</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {importParsedStudents.slice(0, 5).map((stu, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-2 font-mono font-bold text-slate-700">{stu.roll_number}</td>
                          <td className="p-2 font-semibold text-slate-800">{stu.full_name}</td>
                          <td className="p-2 text-slate-600">{stu.class_name}</td>
                          <td className="p-2 text-slate-600">{stu.parent_name}</td>
                          <td className="p-2 font-mono text-slate-600">{stu.parent_phone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importParsedStudents.length > 5 && (
                    <div className="p-2 text-center text-[11px] text-slate-400 bg-slate-50 border-t border-slate-100">
                      + {importParsedStudents.length - 5} more student rows in file
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={importParsedStudents.length === 0 || importing}
                onClick={handleConfirmImport}
                className="px-5 py-2.5 bg-[#1a73e8] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {importing ? 'Importing...' : `Import ${importParsedStudents.length > 0 ? importParsedStudents.length : ''} Students`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Birth Certificate Generator Modal */}
      <BirthCertificateModal
        isOpen={birthCertModalOpen}
        onClose={() => {
          setBirthCertModalOpen(false);
          setSelectedCertStudent(null);
        }}
        preselectedStudent={selectedCertStudent}
        students={students}
        onCertificateSaved={() => {
          setToastMessage('Date of Birth Certificate saved to student records!');
        }}
      />
    </div>
  );
}
