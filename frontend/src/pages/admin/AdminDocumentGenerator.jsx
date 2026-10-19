import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  CreditCard,
  FileText,
  GraduationCap,
  Printer,
  Download,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Palette,
  CheckCircle2,
  Calendar,
  Users,
  User,
  Filter,
  Layers,
  Settings2,
  QrCode,
  RefreshCw,
  Eye,
  Trash2,
  ShieldCheck,
  Building,
  School,
  Loader2,
  SlidersHorizontal,
  FileCheck,
  Search,
  Send,
  ExternalLink,
  Edit2
} from 'lucide-react';
import api from '../../services/api';

// Date to words helper
const ORDINAL_DAYS = [
  '',
  'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth',
  'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth', 'Fifteenth', 'Sixteenth', 'Seventeenth', 'Eighteenth', 'Nineteenth', 'Twentieth',
  'Twenty-First', 'Twenty-Second', 'Twenty-Third', 'Twenty-Fourth', 'Twenty-Fifth', 'Twenty-Sixth', 'Twenty-Seventh', 'Twenty-Eighth', 'Twenty-Ninth', 'Thirtieth',
  'Thirty-First'
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const TEENS = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertYearToWords(year) {
  const y = parseInt(year, 10);
  if (isNaN(y)) return '';
  if (y >= 2000 && y < 2100) {
    const remainder = y - 2000;
    if (remainder === 0) return 'Two Thousand';
    if (remainder < 10) return `Two Thousand ${ONES[remainder]}`;
    if (remainder < 20) return `Two Thousand ${TEENS[remainder - 10]}`;
    const tenPart = TENS[Math.floor(remainder / 10)];
    const onePart = ONES[remainder % 10];
    return `Two Thousand ${tenPart}${onePart ? ' ' + onePart : ''}`;
  }
  if (y >= 1900 && y < 2000) {
    const remainder = y - 1900;
    if (remainder === 0) return 'Nineteen Hundred';
    if (remainder < 10) return `Nineteen Hundred ${ONES[remainder]}`;
    if (remainder < 20) return `Nineteen ${TEENS[remainder - 10]}`;
    const tenPart = TENS[Math.floor(remainder / 10)];
    const onePart = ONES[remainder % 10];
    return `Nineteen ${tenPart}${onePart ? ' ' + onePart : ''}`;
  }
  return String(year);
}

function parseDateRobust(dateString) {
  if (!dateString) return null;
  const s = String(dateString).trim();
  let day = 10, month = 3, year = 2018;

  // Handle slashes: DD/MM/YYYY or YYYY/MM/DD
  if (s.includes('/')) {
    const p = s.split('/');
    if (p.length === 3) {
      if (p[0].length === 4) {
        year = parseInt(p[0], 10);
        month = parseInt(p[1], 10);
        day = parseInt(p[2], 10);
      } else if (p[2].length === 4) {
        year = parseInt(p[2], 10);
        day = parseInt(p[0], 10);
        month = parseInt(p[1], 10);
      }
    }
  } else if (s.includes('-')) {
    const p = s.split('-');
    if (p.length === 3) {
      if (p[0].length === 4) {
        year = parseInt(p[0], 10);
        month = parseInt(p[1], 10);
        day = parseInt(p[2], 10);
      } else if (p[2].length === 4) {
        year = parseInt(p[2], 10);
        day = parseInt(p[0], 10);
        month = parseInt(p[1], 10);
      }
    }
  } else {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      year = d.getFullYear();
      month = d.getMonth() + 1;
      day = d.getDate();
    }
  }

  if (isNaN(year) || year < 1920 || year > 2050) year = 2018;
  if (isNaN(month) || month < 1 || month > 12) month = 3;
  if (isNaN(day) || day < 1 || day > 31) day = 10;

  const yStr = String(year);
  const mStr = String(month).padStart(2, '0');
  const dStr = String(day).padStart(2, '0');

  return {
    year,
    month,
    day,
    iso: `${yStr}-${mStr}-${dStr}`,
    display: `${dStr}-${mStr}-${yStr}`
  };
}

function convertDateToWords(dateString) {
  const parsed = parseDateRobust(dateString);
  if (!parsed) return '';
  const dayWord = ORDINAL_DAYS[parsed.day] || `${parsed.day}th`;
  const monthWord = MONTH_NAMES[parsed.month - 1] || '';
  const yearWord = convertYearToWords(parsed.year);

  return `${dayWord} of ${monthWord}, ${yearWord}`;
}

function formatDobLikeCertificate(dateString) {
  const parsed = parseDateRobust(dateString);
  if (!parsed) return 'Tenth March Two Thousand Eighteen';
  const dayWord = ORDINAL_DAYS[parsed.day] || `${parsed.day}th`;
  const monthWord = MONTH_NAMES[parsed.month - 1] || '';
  const yearWord = convertYearToWords(parsed.year);

  return `${dayWord} ${monthWord} ${yearWord}`;
}

function getDobDigits(dateString) {
  const parsed = parseDateRobust(dateString) || { year: 2018, month: 3, day: 10 };
  const dStr = String(parsed.day).padStart(2, '0');
  const mStr = String(parsed.month).padStart(2, '0');
  const yStr = String(parsed.year).padStart(4, '2018');
  return {
    d: [dStr[0] || '1', dStr[1] || '0'],
    m: [mStr[0] || '0', mStr[1] || '3'],
    y: [yStr[0] || '2', yStr[1] || '0', yStr[2] || '1', yStr[3] || '8']
  };
}

// Preset themes config
const THEMES = {
  gold: {
    id: 'gold',
    name: 'Royal Gold & Navy',
    primary: '#78350f',
    secondary: '#b45309',
    accent: '#fef3c7',
    border: '#d97706',
    cardBg: '#fffdfa',
    badge: 'bg-amber-100 text-amber-900 border-amber-300'
  },
  navy: {
    id: 'navy',
    name: 'Executive Navy',
    primary: '#0f172a',
    secondary: '#1e3a8a',
    accent: '#dbeafe',
    border: '#1d4ed8',
    cardBg: '#f8fafc',
    badge: 'bg-blue-100 text-blue-900 border-blue-300'
  },
  emerald: {
    id: 'emerald',
    name: 'Prestige Emerald',
    primary: '#064e3b',
    secondary: '#047857',
    accent: '#d1fae5',
    border: '#059669',
    cardBg: '#f0fdf4',
    badge: 'bg-emerald-100 text-emerald-900 border-emerald-300'
  },
  maroon: {
    id: 'maroon',
    name: 'Academic Maroon',
    primary: '#881337',
    secondary: '#9f1239',
    accent: '#ffe4e6',
    border: '#be123c',
    cardBg: '#fff1f2',
    badge: 'bg-rose-100 text-rose-900 border-rose-300'
  }
};

// Default DMC Subjects
const DEFAULT_SUBJECTS = [
  { name: 'English Language & Lit.', maxMarks: 100, passMarks: 40, obtained: 88 },
  { name: 'Urdu Language', maxMarks: 100, passMarks: 40, obtained: 85 },
  { name: 'Mathematics', maxMarks: 100, passMarks: 40, obtained: 94 },
  { name: 'General Science', maxMarks: 100, passMarks: 40, obtained: 91 },
  { name: 'Social / Pakistan Studies', maxMarks: 50, passMarks: 20, obtained: 46 },
  { name: 'Islamiat / Religious Studies', maxMarks: 50, passMarks: 20, obtained: 48 },
  { name: 'Computer & IT Studies', maxMarks: 50, passMarks: 20, obtained: 47 }
];

export default function AdminDocumentGenerator() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Document Type: 'birth_cert' | 'id_card' | 'school_leaving' | 'dmc'
  const [docType, setDocType] = useState('birth_cert');

  // Generation Scope: 'single' | 'class' | 'all'
  const [scope, setScope] = useState('single');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Design Customization
  const [themeKey, setThemeKey] = useState('gold');
  const [customBgImage, setCustomBgImage] = useState(null);
  const [showStudentPhoto, setShowStudentPhoto] = useState(true);
  const [idCardOrientation, setIdCardOrientation] = useState('vertical'); // 'vertical' | 'horizontal'
  const [showWatermarkSeal, setShowWatermarkSeal] = useState(true);

  // Institutional Details
  const [schoolName, setSchoolName] = useState('Highlight Model School');
  const [tagline, setTagline] = useState('Better Learning | Brighter Future');
  const [principalName, setPrincipalName] = useState('Principal Farman Ullah');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [academicSession, setAcademicSession] = useState('2025-2026');

  // SLC Specific (Exact Replica of Official Printed Certificate)
  const [slcRegNo, setSlcRegNo] = useState('21224');
  const [slcFileNo, setSlcFileNo] = useState('0427');
  const [slcAdmnNo, setSlcAdmnNo] = useState('');
  const [slcIssueDateFormatted, setSlcIssueDateFormatted] = useState('23-04-2026');
  const [slcAttendedFrom, setSlcAttendedFrom] = useState('08-05-2023');
  const [slcAttendedTo, setSlcAttendedTo] = useState('18-04-2026');
  const [slcAttendance, setSlcAttendance] = useState('90%');
  const [slcPromotionClass, setSlcPromotionClass] = useState('4th / Fourth');
  const [slcDateOfAdmission, setSlcDateOfAdmission] = useState('05-05-2023');
  const [slcDateOfWithdrawal, setSlcDateOfWithdrawal] = useState('20-04-2026');
  const [slcProgress, setSlcProgress] = useState('Excellent');
  const [slcConduct, setSlcConduct] = useState('Good');
  const [slcOfficeContact, setSlcOfficeContact] = useState('0301-8323146');
  const [slcPreparedBy, setSlcPreparedBy] = useState('');
  const [slcCheckedBy, setSlcCheckedBy] = useState('');

  // DMC Specific
  const [examName, setExamName] = useState('Annual Examination');

  // Custom student photos uploaded in session
  const [uploadedPhotos, setUploadedPhotos] = useState({});

  // Active student preview index in batch
  const [previewIndex, setPreviewIndex] = useState(0);
  const [viewMode, setViewMode] = useState('single_preview'); // 'single_preview' | 'batch_overview'

  // Action states
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Quick Edit Student Modal
  const [quickEditOpen, setQuickEditOpen] = useState(false);
  const [quickEditSaving, setQuickEditSaving] = useState(false);
  const [quickEditForm, setQuickEditForm] = useState({
    full_name: '',
    father_name: '',
    roll_number: '',
    class_id: '1',
    dob: '',
    address: '',
    parent_phone: ''
  });

  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);

  const currentTheme = THEMES[themeKey] || THEMES.gold;

  // Load students & classes
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [stuRes, clsRes] = await Promise.allSettled([
          api.get('/students'),
          api.get('/classes')
        ]);
        if (stuRes.status === 'fulfilled' && stuRes.value.data.success) {
          const list = stuRes.value.data.students || [];
          setStudents(list);
          if (list.length > 0) {
            setSelectedStudentId(String(list[0].id));
          }
        }
        if (clsRes.status === 'fulfilled' && clsRes.value.data.success) {
          const clsList = clsRes.value.data.classes || [];
          setClasses(clsList);
          if (clsList.length > 0) {
            setSelectedClassId(String(clsList[0].id));
          }
        }
      } catch (err) {
        console.error('Failed to load generator data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filtered target students based on scope
  const targetStudents = React.useMemo(() => {
    if (scope === 'single') {
      const found = students.find(s => String(s.id) === String(selectedStudentId));
      return found ? [found] : (students[0] ? [students[0]] : []);
    }
    if (scope === 'class') {
      const filtered = students.filter(s => String(s.class_id) === String(selectedClassId));
      return filtered.length > 0 ? filtered : [];
    }
    if (scope === 'all') {
      return students;
    }
    return students;
  }, [students, scope, selectedStudentId, selectedClassId]);

  // Current candidates for searching & picking in this scope
  const scopedStudents = React.useMemo(() => {
    if (scope === 'class') {
      return targetStudents;
    }
    return students;
  }, [scope, targetStudents, students]);

  // Search filtering for student selection (ByName, ByID, ByRoll, ByParent)
  const filteredStudentsBySearch = React.useMemo(() => {
    if (!studentSearchQuery.trim()) return scopedStudents;
    const q = studentSearchQuery.toLowerCase().trim();
    // Allow prefixes like "id: 5", "id:5", "#5", "id 5" or just "5"
    const cleanId = q.replace(/^id[:\s#]*/i, '').trim();

    const matches = scopedStudents.filter(s => {
      const idStr = String(s.id);
      const rollStr = s.roll_number ? String(s.roll_number).toLowerCase() : '';
      const nameStr = s.full_name ? s.full_name.toLowerCase() : '';
      const parentStr = s.parent_name ? s.parent_name.toLowerCase() : '';
      const classStr = s.class_name ? s.class_name.toLowerCase() : '';
      const biometricStr = s.fingerprint_device_id ? String(s.fingerprint_device_id).toLowerCase() : '';

      const matchExactId = cleanId && idStr === cleanId;
      const matchPartialId = cleanId && idStr.includes(cleanId);
      const matchRoll = rollStr && (rollStr === q || rollStr.includes(q));
      const matchName = nameStr.includes(q);
      const matchParent = parentStr.includes(q);
      const matchClass = classStr.includes(q);
      const matchBiometric = biometricStr && biometricStr.includes(q);

      return matchExactId || matchPartialId || matchRoll || matchName || matchParent || matchClass || matchBiometric;
    });

    // Prioritize exact ID match, then exact roll number match, then names
    return matches.sort((a, b) => {
      const aIdStr = String(a.id);
      const bIdStr = String(b.id);
      const aExactId = cleanId && aIdStr === cleanId;
      const bExactId = cleanId && bIdStr === cleanId;
      if (aExactId && !bExactId) return -1;
      if (!aExactId && bExactId) return 1;

      const aExactRoll = a.roll_number && String(a.roll_number).toLowerCase() === q;
      const bExactRoll = b.roll_number && String(b.roll_number).toLowerCase() === q;
      if (aExactRoll && !bExactRoll) return -1;
      if (!aExactRoll && bExactRoll) return 1;

      return 0;
    });
  }, [scopedStudents, studentSearchQuery]);

  const handleSelectStudent = (studentId) => {
    setSelectedStudentId(String(studentId));
    if (scope !== 'single') {
      const idx = targetStudents.findIndex(s => String(s.id) === String(studentId));
      if (idx !== -1) {
        setPreviewIndex(idx);
      }
    }
  };

  const handleSearchChange = (val) => {
    setStudentSearchQuery(val);
    const q = val.toLowerCase().trim();
    const cleanId = q.replace(/^id[:\s#]*/i, '').trim();

    const exactIdMatch = cleanId ? scopedStudents.find(s => String(s.id) === cleanId) : null;
    const exactRollMatch = scopedStudents.find(s => s.roll_number && String(s.roll_number).toLowerCase() === q);
    const nameMatch = scopedStudents.find(s => s.full_name && s.full_name.toLowerCase().includes(q));
    const partialMatch = scopedStudents.find(s =>
      (cleanId && String(s.id).includes(cleanId)) ||
      (s.roll_number && String(s.roll_number).toLowerCase().includes(q)) ||
      (s.parent_name && s.parent_name.toLowerCase().includes(q))
    );

    const bestMatch = exactIdMatch || exactRollMatch || nameMatch || partialMatch;
    if (bestMatch) {
      handleSelectStudent(bestMatch.id);
    }
  };

  // Keep preview index in bounds
  useEffect(() => {
    if (previewIndex >= targetStudents.length) {
      setPreviewIndex(0);
    }
  }, [targetStudents.length, previewIndex]);

  const activeStudent = targetStudents[previewIndex] || targetStudents[0] || null;

  // Automatically synchronize fields when activeStudent changes
  useEffect(() => {
    if (activeStudent) {
      if (activeStudent.roll_number) {
        setSlcAdmnNo(activeStudent.roll_number);
      }
      if (activeStudent.admission_date) {
        setSlcDateOfAdmission(activeStudent.admission_date);
      }
      const clsName = activeStudent.class_name || '';
      const numMatch = clsName.match(/\d+/);
      if (numMatch) {
        const nextNum = parseInt(numMatch[0], 10) + 1;
        setSlcPromotionClass(`Grade ${nextNum}`);
      } else if (clsName.toLowerCase().includes('nursery')) {
        setSlcPromotionClass('Prep');
      } else if (clsName.toLowerCase().includes('prep')) {
        setSlcPromotionClass('Grade 1');
      }
    }
  }, [activeStudent?.id, activeStudent?.roll_number, activeStudent?.class_name]);

  // Background upload handler
  const handleBgUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCustomBgImage(reader.result);
      setFeedback({ type: 'success', message: 'Custom template/background image uploaded!' });
    };
    reader.readAsDataURL(file);
  };

  // Student photo upload handler with permanent backend sync
  const handleStudentPhotoUpload = async (e, studentId) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedPhotos(prev => ({
        ...prev,
        [studentId]: reader.result
      }));
    };
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.post(`/students/${studentId}/avatar`, formData);
      if (res.data?.success && res.data.avatar_url) {
        setStudents(prev => prev.map(s => String(s.id) === String(studentId) ? { ...s, avatar_url: res.data.avatar_url } : s));
        setFeedback({ type: 'success', message: 'Student photo permanently saved to profile!' });
      } else {
        setFeedback({ type: 'success', message: 'Student photo applied for preview!' });
      }
    } catch (uploadErr) {
      console.warn('Avatar server upload warning:', uploadErr);
      setFeedback({ type: 'success', message: 'Student photo applied for this session preview!' });
    }
  };

  const getStudentPhotoUrl = (student) => {
    if (!student) return null;
    if (uploadedPhotos[student.id]) return uploadedPhotos[student.id];
    if (student.avatar_url && !student.avatar_url.includes('photo-1544717305-2782549b5136')) {
      return student.avatar_url;
    }
    if (student.photo_url) return student.photo_url;
    if (student.photo) return student.photo;
    if (student.image_url) return student.image_url;
    return `/uploads/roman_real.png`;
  };

  // Quick edit student details handlers
  const handleOpenQuickEdit = (student) => {
    if (!student) return;
    let resolvedClassId = student.class_id ? String(student.class_id) : '1';
    if (student.class_name) {
      const matched = classes.find(c => c.name.toLowerCase() === student.class_name.toLowerCase());
      if (matched) resolvedClassId = String(matched.id);
    }

    setQuickEditForm({
      full_name: student.full_name || '',
      father_name: student.father_name || student.parent_name || '',
      roll_number: student.roll_number || '',
      class_id: resolvedClassId,
      dob: student.dob || student.date_of_birth || '2018-03-10',
      address: student.address || '',
      parent_phone: student.parent_phone || ''
    });
    setQuickEditOpen(true);
  };

  const handleSaveQuickEdit = async (e) => {
    e.preventDefault();
    if (!activeStudent) return;
    setQuickEditSaving(true);
    try {
      const res = await api.put(`/students/${activeStudent.id}`, quickEditForm);
      if (res.data?.success) {
        const updatedClass = classes.find(c => String(c.id) === String(quickEditForm.class_id))?.name || activeStudent.class_name;
        setStudents(prev => prev.map(s => String(s.id) === String(activeStudent.id) ? {
          ...s,
          ...quickEditForm,
          class_name: updatedClass
        } : s));
        setFeedback({ type: 'success', message: `Details for ${quickEditForm.full_name} updated successfully!` });
        setQuickEditOpen(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update student details');
    } finally {
      setQuickEditSaving(false);
    }
  };

  // 1-Click Print
  const handlePrint = () => {
    window.print();
  };

  // Save / Issue document to student records
  const handleSaveToRecords = async () => {
    if (targetStudents.length === 0) {
      alert('No students selected to issue document.');
      return;
    }
    setSaving(true);
    setFeedback(null);

    const docCategoryMap = {
      birth_cert: 'Birth Certificate',
      id_card: 'Student ID Card',
      school_leaving: 'School Leaving Certificate',
      dmc: 'Detailed Marks Certificate'
    };

    const category = docCategoryMap[docType] || 'Academic Document';

    try {
      if (targetStudents.length === 1) {
        const stu = targetStudents[0];
        const stuDob = stu.dob || stu.date_of_birth || '2018-03-10';
        const stuPhoto = getStudentPhotoUrl(stu);
        const stuFather = stu.father_name || stu.parent_name || 'Guardian';
        const stuRoll = stu.roll_number || String(stu.id).slice(-3);
        const stuClass = stu.class_name || 'Grade 1';

        const res = await api.post('/documents/certificate', {
          student_id: stu.id,
          title: `Official ${category} - ${stu.full_name} (${stuRoll})`,
          category,
          metadata: {
            student_name: stu.full_name,
            parent_name: stuFather,
            father_name: stuFather,
            roll_number: stuRoll,
            class_name: stuClass,
            dob: stuDob,
            dob_words: convertDateToWords(stuDob),
            photo_url: stuPhoto,
            avatar_url: stuPhoto,
            issue_date: slcIssueDateFormatted || issueDate,
            principal_name: principalName,
            ref_no: `HMS/${docType.toUpperCase()}/${new Date().getFullYear()}/${stuRoll}`,
            file_no: slcFileNo,
            admn_no: slcAdmnNo || stuRoll,
            reg_no: slcRegNo,
            attended_from: slcAttendedFrom,
            attended_to: slcAttendedTo,
            attendance: slcAttendance,
            promotion_class: slcPromotionClass,
            date_of_admission: slcDateOfAdmission || stu.admission_date || '05-05-2023',
            date_of_withdrawal: slcDateOfWithdrawal,
            progress: slcProgress,
            conduct: slcConduct,
            office_contact: slcOfficeContact || stu.parent_phone || '0301-8323146'
          }
        });
        if (res.data.success) {
          setFeedback({
            type: 'success',
            message: `Official ${category} successfully issued to ${stu.full_name}! It is now available in the Student Portal & Parent Mobile App.`
          });
        }
      } else {
        // Bulk batch save
        const batchPayload = targetStudents.map(stu => {
          const stuDob = stu.dob || stu.date_of_birth || '2018-03-10';
          const stuPhoto = getStudentPhotoUrl(stu);
          const stuFather = stu.father_name || stu.parent_name || 'Guardian';
          const stuRoll = stu.roll_number || String(stu.id).slice(-3);
          const stuClass = stu.class_name || 'Grade 1';
          return {
            student_id: stu.id,
            title: `Official ${category} - ${stu.full_name} (${stuRoll})`,
            category,
            metadata: {
              student_name: stu.full_name,
              parent_name: stuFather,
              father_name: stuFather,
              roll_number: stuRoll,
              class_name: stuClass,
              dob: stuDob,
              dob_words: convertDateToWords(stuDob),
              photo_url: stuPhoto,
              avatar_url: stuPhoto,
              issue_date: slcIssueDateFormatted || issueDate,
              principal_name: principalName,
              ref_no: `HMS/${docType.toUpperCase()}/${new Date().getFullYear()}/${stuRoll}`,
              file_no: slcFileNo,
              admn_no: slcAdmnNo || stuRoll,
              reg_no: slcRegNo,
              attended_from: slcAttendedFrom,
              attended_to: slcAttendedTo,
              attendance: slcAttendance,
              promotion_class: slcPromotionClass,
              date_of_admission: slcDateOfAdmission || stu.admission_date || '05-05-2023',
              date_of_withdrawal: slcDateOfWithdrawal,
              progress: slcProgress,
              conduct: slcConduct,
              office_contact: slcOfficeContact || stu.parent_phone || '0301-8323146'
            }
          };
        });

        const res = await api.post('/documents/certificate', {
          batch_documents: batchPayload
        });
        if (res.data.success) {
          setFeedback({
            type: 'success',
            message: `Successfully issued ${targetStudents.length} ${category}s! All students and parents can now view and download their copies from the portal & mobile app.`
          });
        }
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to issue documents.' });
    } finally {
      setSaving(false);
    }
  };

  // Render Certificate / Card template for a student
  const renderStudentDocument = (student, index) => {
    if (!student) return null;
    const photoUrl = getStudentPhotoUrl(student);
    const rawDob = student.dob || student.date_of_birth || '2018-03-10';
    const parsedDob = parseDateRobust(rawDob);
    const dobString = parsedDob ? parsedDob.iso : '2018-03-10';
    const dobInWords = convertDateToWords(rawDob);
    const isMale = student.gender !== 'Female';
    const relationTitle = isMale ? 'son of Mr.' : 'daughter of Mr.';
    const pronounHeShe = isMale ? 'He' : 'She';
    const pronounHisHer = isMale ? 'his' : 'her';
    const studentRoll = student.roll_number || String(student.id).slice(-3);
    const studentFather = student.father_name || student.parent_name || 'Guardian';
    const studentClass = student.class_name || 'Grade 1';
    const studentPhone = student.parent_phone || student.phone || '0301-8323146';
    const refNumber = `HMS/${docType.toUpperCase()}/${new Date().getFullYear()}/${studentRoll}`;

    // 1. BIRTH CERTIFICATE
    if (docType === 'birth_cert') {
      return (
        <div
          key={student.id}
          className="print-page w-full max-w-[800px] mx-auto bg-[#fffdfa] rounded-2xl shadow-xl border-8 border-double p-8 sm:p-12 relative overflow-hidden transition-all text-slate-800"
          style={{
            borderColor: currentTheme.primary,
            backgroundImage: customBgImage ? `url(${customBgImage})` : 'radial-gradient(#f8fafc 1px, transparent 1px)',
            backgroundSize: customBgImage ? 'cover' : '20px 20px',
            backgroundPosition: 'center',
            backgroundColor: currentTheme.cardBg
          }}
        >
          {/* Watermark Seal */}
          {showWatermarkSeal && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06]">
              <img src="/logo.png" alt="Highlight Model School Watermark" className="w-80 h-96 object-contain" />
            </div>
          )}

          {/* Header */}
          <div className="text-center border-b-2 pb-5 relative" style={{ borderColor: `${currentTheme.primary}33` }}>
            <div className="flex items-center justify-center gap-4 mb-1">
              <div className="bg-white rounded-2xl p-1.5 shadow-md border border-slate-200/80 flex-shrink-0">
                <img
                  src="/logo.png"
                  alt="Highlight Model School Emblem"
                  className="w-16 h-20 object-contain"
                />
              </div>
              <div className="text-left">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase" style={{ color: currentTheme.primary }}>
                  {schoolName}
                </h1>
                <div className="text-xs font-bold tracking-widest uppercase text-amber-600">
                  Saraghundi Thall
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Registered & Recognized Secondary Education Institution • KPK, Pakistan
                </div>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Registered & Recognized Secondary Education Institution • KPK, Pakistan
            </div>

            {/* Document Title Banner */}
            <div className="mt-5 inline-block">
              <span
                className="px-6 py-2 rounded-full font-serif font-black text-sm sm:text-base tracking-wider uppercase border shadow-2xs"
                style={{ backgroundColor: currentTheme.accent, color: currentTheme.primary, borderColor: currentTheme.border }}
              >
                Date of Birth & Character Certificate
              </span>
            </div>
          </div>

          {/* Meta Bar */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 my-5 font-mono px-2">
            <div>Ref No: <span style={{ color: currentTheme.primary }}>{refNumber}</span></div>
            <div>Issue Date: <span>{issueDate}</span></div>
          </div>

          {/* Certificate Body */}
          <div className="space-y-4 text-justify font-serif text-sm sm:text-base leading-relaxed my-6 px-2 text-slate-800">
            <div className="flex items-start gap-4">
              {showStudentPhoto && photoUrl && (
                <div className="float-right ml-4 mb-2 flex-shrink-0">
                  <img
                    src={photoUrl}
                    alt={student.full_name}
                    className="w-24 h-28 object-cover rounded-xl border-2 shadow-sm"
                    style={{ borderColor: currentTheme.primary }}
                  />
                  <div className="text-[9px] text-center font-mono font-bold text-slate-500 mt-1">Roll {studentRoll}</div>
                </div>
              )}
              <p>
                This is to certify that <u><strong className="text-slate-900">{student.full_name}</strong></u>, {relationTitle} <u><strong className="text-slate-900">{studentFather}</strong></u>, bearing School Roll Number <strong>{studentRoll}</strong>, is a bona fide regular student of this institution studying in <strong>Class {studentClass}</strong>.
              </p>
            </div>

            <p>
              According to the official admission and withdrawal register of Highlight Model School, {pronounHisHer} officially recorded Date of Birth is:
            </p>

            {/* DOB Highlight Box */}
            <div
              className="p-4 rounded-xl text-center border shadow-xs my-4"
              style={{ backgroundColor: currentTheme.accent, borderColor: currentTheme.border }}
            >
              <div className="text-xl sm:text-2xl font-bold font-mono tracking-wider text-slate-900">
                {dobString}
              </div>
              <div className="text-xs sm:text-sm font-semibold italic mt-1" style={{ color: currentTheme.primary }}>
                (In Words: "{dobInWords || 'Not Specified'}")
              </div>
            </div>

            <p>
              To the best of our knowledge and records, {pronounHisHer} moral character, attendance, and conduct have been <strong>Exemplary & Good</strong>. {pronounHeShe} bears no record of misconduct. We wish {pronounHisHer} the highest success in {pronounHisHer} future academic endeavors.
            </p>
          </div>

          {/* Signatures & Seal Footer */}
          <div className="grid grid-cols-3 items-end text-center mt-12 pt-6 border-t border-slate-200">
            <div>
              <div className="w-32 border-b-2 border-slate-900 mx-auto mb-1"></div>
              <div className="text-xs font-bold text-slate-800">Class Incharge</div>
              <div className="text-[10px] text-slate-500">Highlight Model School</div>
            </div>

            <div className="flex flex-col items-center justify-center">
              <div
                className="w-20 h-24 rounded-2xl border-2 border-dashed flex items-center justify-center p-1 bg-white/70 shadow-2xs"
                style={{ borderColor: currentTheme.primary }}
              >
                <img src="/logo.png" alt="Official Seal" className="w-full h-full object-contain opacity-85" />
              </div>
              <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mt-1">Official School Seal</span>
            </div>

            <div>
              <div className="w-36 border-b-2 border-slate-900 mx-auto mb-1"></div>
              <div className="text-xs font-bold text-slate-800">{principalName}</div>
              <div className="text-[10px] font-bold" style={{ color: currentTheme.primary }}>Head Principal & Director</div>
            </div>
          </div>
        </div>
      );
    }

    // 2. STUDENT ID CARD
    if (docType === 'id_card') {
      return (
        <div
          key={student.id}
          className={`print-card mx-auto bg-white rounded-3xl shadow-xl border overflow-hidden transition-all text-slate-800 ${
            idCardOrientation === 'vertical' ? 'w-full max-w-[320px]' : 'w-full max-w-[480px]'
          }`}
          style={{ borderColor: currentTheme.border }}
        >
          {/* Card Top Header */}
          <div
            className="p-4 text-white text-center relative overflow-hidden"
            style={{ backgroundColor: currentTheme.primary }}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-8 h-10 bg-white rounded-lg p-0.5 shadow-xs flex-shrink-0 flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="text-left">
                <h2 className="text-xs font-black tracking-wide uppercase leading-tight">{schoolName}</h2>
                <div className="text-[8px] text-amber-300 font-bold tracking-wider uppercase">Saraghundi Thall</div>
              </div>
            </div>
            <div className="text-[9px] text-slate-200 tracking-wider uppercase font-semibold">{tagline}</div>
            <div className="text-[8px] opacity-80 mt-0.5">STUDENT IDENTITY CARD • {academicSession}</div>
          </div>

          {/* Card Body */}
          <div className="p-5 text-center">
            {/* Student Photo */}
            <div className="relative inline-block mb-3">
              <img
                src={photoUrl}
                alt={student.full_name}
                className="w-24 h-28 object-cover rounded-2xl mx-auto border-3 shadow-md"
                style={{ borderColor: currentTheme.primary }}
              />
              <span
                className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-[9px] font-bold shadow-xs text-white"
                style={{ backgroundColor: currentTheme.secondary }}
              >
                {studentClass}
              </span>
            </div>

            {/* Student Name & Roll */}
            <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
              {student.full_name}
            </h3>
            <div className="text-xs font-mono font-bold mt-0.5" style={{ color: currentTheme.primary }}>
              Roll No: {studentRoll}
            </div>

            {/* Info Grid */}
            <div className="mt-4 bg-slate-50 rounded-2xl p-3 border border-slate-100 text-left text-xs space-y-1.5 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-400">Father/Guardian:</span>
                <span className="font-semibold text-slate-800">{studentFather}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Class & Section:</span>
                <span className="font-semibold text-slate-800">{studentClass} - A</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date of Birth:</span>
                <span className="font-semibold text-slate-800">{dobString}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Emergency Contact:</span>
                <span className="font-mono font-semibold text-slate-800">{studentPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Blood Group:</span>
                <span className="font-bold text-rose-600">B+ Positive</span>
              </div>
            </div>

            {/* Simulated Barcode / QR Section */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between px-2">
              <div className="text-left font-mono text-[9px] text-slate-400 leading-tight">
                <div>CARD ID: HMS-{studentRoll}</div>
                <div>VALID TILL: 31-MAR-2027</div>
              </div>
              <div className="flex items-center gap-1.5">
                <QrCode className="w-8 h-8 text-slate-800" />
              </div>
            </div>

            {/* Principal Signature */}
            <div className="mt-3 pt-2 text-right">
              <div className="text-[10px] font-bold text-slate-800">{principalName}</div>
              <div className="text-[8px] text-slate-400 uppercase font-semibold">Authorized Signatory</div>
            </div>
          </div>
        </div>
      );
    }

    // 3. SCHOOL LEAVING CERTIFICATE (SLC) - EXACT REPLICA OF OFFICIAL PRINTED CERTIFICATE
    if (docType === 'school_leaving') {
      const stuDob = student.dob || student.date_of_birth || '2018-03-10';
      const dobDigits = getDobDigits(stuDob);
      const dobInWordsSpecial = formatDobLikeCertificate(stuDob);
      const activeAdmnNo = slcAdmnNo || studentRoll || 'HMS-169';

      return (
        <div
          key={student.id}
          className="print-page w-full max-w-[850px] mx-auto bg-white shadow-2xl relative p-5 sm:p-7 text-slate-900 overflow-hidden font-serif border-[12px] border-double border-[#1e3a8a] transition-all"
          style={{ backgroundColor: '#ffffff' }}
        >
          {/* Inner Navy Precision Line Frame */}
          <div className="absolute inset-1.5 border border-[#1e3a8a] pointer-events-none"></div>

          {/* 4 Corner Ornaments */}
          <div className="absolute top-2.5 left-2.5 w-5 h-5 border-b border-r border-[#1e3a8a] flex items-center justify-center text-[10px] text-[#1e3a8a] font-bold">✤</div>
          <div className="absolute top-2.5 right-2.5 w-5 h-5 border-b border-l border-[#1e3a8a] flex items-center justify-center text-[10px] text-[#1e3a8a] font-bold">✤</div>
          <div className="absolute bottom-2.5 left-2.5 w-5 h-5 border-t border-r border-[#1e3a8a] flex items-center justify-center text-[10px] text-[#1e3a8a] font-bold">✤</div>
          <div className="absolute bottom-2.5 right-2.5 w-5 h-5 border-t border-l border-[#1e3a8a] flex items-center justify-center text-[10px] text-[#1e3a8a] font-bold">✤</div>

          {/* Watermark Crest Seal in Center Background */}
          {showWatermarkSeal && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.07]">
              <img src="/logo.png" alt="Watermark" className="w-80 h-96 object-contain" />
            </div>
          )}

          {/* Reg No at Top Left & Student Photo at Top Right */}
          <div className="relative flex justify-between items-start text-xs font-bold text-[#1e3a8a] pt-1 px-1">
            <span className="font-sans tracking-wide">Reg NO: {slcRegNo}</span>
            {showStudentPhoto && photoUrl ? (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-normal">Official Govt Recognized</span>
                <div className="w-14 h-16 sm:w-16 sm:h-20 border-2 border-[#1e3a8a] rounded bg-white shadow-xs overflow-hidden flex flex-col items-center">
                  <img
                    src={photoUrl}
                    alt={student.full_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.full_name || 'Student')}&background=1e3a8a&color=fff&size=200&bold=true`;
                    }}
                  />
                </div>
              </div>
            ) : (
              <span className="text-[10px] text-slate-400 font-normal">Official Govt Recognized</span>
            )}
          </div>

          {/* Header with Arched School Name and Official HD Crest */}
          <div className="relative text-center mt-1">
            {/* Arched typography matching reference photo */}
            <svg viewBox="0 0 540 50" className="w-full max-w-[500px] mx-auto overflow-visible">
              <path id="slcCurve" d="M 15,44 Q 270,8 525,44" fill="transparent" />
              <text className="font-serif font-black tracking-[0.16em] fill-[#1e3a8a] text-[27px] uppercase">
                <textPath href="#slcCurve" startOffset="50%" textAnchor="middle">
                  HIGH LIGHT MODEL SCHOOL
                </textPath>
              </text>
            </svg>

            {/* Official School Crest Logo */}
            <div className="my-1 flex justify-center">
              <img
                src="/logo.png"
                alt="Highlight Model School Emblem"
                className="w-16 h-20 object-contain drop-shadow-2xs"
              />
            </div>

            {/* Location Tag */}
            <div className="font-sans font-black text-[#1e3a8a] text-xs sm:text-[13px] tracking-[0.18em] uppercase mt-0.5">
              SARAGHUNDI THALL DISTRICT HANGU
            </div>
          </div>

          {/* Title Banner & File/Admn Meta Row */}
          <div className="relative flex items-center justify-between mt-3 mb-4 px-2">
            <div className="text-xs sm:text-sm font-semibold text-slate-800">
              File No. <span className="font-bold underline decoration-slate-400 font-mono text-sm sm:text-base ml-1 text-[#1e3a8a]">{slcFileNo}</span>
            </div>

            <div className="px-5 py-1.5 rounded-lg bg-[#3b4992] text-white font-serif font-bold text-sm sm:text-base tracking-wide shadow-xs">
              School Leaving Certificate
            </div>

            <div className="text-right">
              <div className="text-xs sm:text-sm font-semibold text-slate-800">
                Admn. No. <span className="font-bold underline decoration-slate-400 font-mono text-sm sm:text-base ml-1 text-[#1e3a8a]">{activeAdmnNo}</span>
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-800 mt-1">
                Date of Issue <span className="font-bold underline decoration-slate-400 font-mono text-xs sm:text-sm ml-1 text-[#1e3a8a]">{slcIssueDateFormatted || issueDate}</span>
              </div>
            </div>
          </div>

          {/* Form Fields 1 to 8 - Exact Wording & Formatting */}
          <div className="relative space-y-3.5 my-5 text-slate-900 font-serif text-xs sm:text-sm px-1">
            {/* 1. Name of Student */}
            <div className="flex items-baseline font-semibold">
              <span className="whitespace-nowrap min-w-[150px]">1. Name of Student</span>
              <div className="flex-1 ml-2 border-b-2 border-slate-700/80 pb-0.5 px-3 font-serif font-black text-sm sm:text-base text-[#1e3a8a] tracking-wide">
                {student.full_name}
              </div>
            </div>

            {/* 2. Father's Name */}
            <div className="flex items-baseline font-semibold">
              <span className="whitespace-nowrap min-w-[150px]">2. Father`s Name</span>
              <div className="flex-1 ml-2 border-b-2 border-slate-700/80 pb-0.5 px-3 font-serif font-bold text-sm sm:text-base text-[#1e3a8a]">
                {studentFather}
              </div>
            </div>

            {/* 3. Date of Birth (in figures) [box][box]-[box][box]-[box][box][box][box] (in words) ... */}
            <div className="flex flex-wrap items-baseline font-semibold gap-y-2">
              <span className="whitespace-nowrap mr-2">3. Date of Birth (in figures)</span>
              <div className="flex items-center gap-1 font-mono font-bold text-xs inline-flex align-middle">
                <span className="inline-flex border border-slate-800 bg-white shadow-2xs">
                  <span className="w-4 h-5 border-r border-slate-800 flex items-center justify-center text-[#1e3a8a]">{dobDigits.d[0]}</span>
                  <span className="w-4 h-5 flex items-center justify-center text-[#1e3a8a]">{dobDigits.d[1]}</span>
                </span>
                <span className="text-slate-600">-</span>
                <span className="inline-flex border border-slate-800 bg-white shadow-2xs">
                  <span className="w-4 h-5 border-r border-slate-800 flex items-center justify-center text-[#1e3a8a]">{dobDigits.m[0]}</span>
                  <span className="w-4 h-5 flex items-center justify-center text-[#1e3a8a]">{dobDigits.m[1]}</span>
                </span>
                <span className="text-slate-600">-</span>
                <span className="inline-flex border border-slate-800 bg-white shadow-2xs">
                  <span className="w-4 h-5 border-r border-slate-800 flex items-center justify-center text-[#1e3a8a]">{dobDigits.y[0]}</span>
                  <span className="w-4 h-5 border-r border-slate-800 flex items-center justify-center text-[#1e3a8a]">{dobDigits.y[1]}</span>
                  <span className="w-4 h-5 border-r border-slate-800 flex items-center justify-center text-[#1e3a8a]">{dobDigits.y[2]}</span>
                  <span className="w-4 h-5 flex items-center justify-center text-[#1e3a8a]">{dobDigits.y[3]}</span>
                </span>
              </div>
              <span className="mx-2 whitespace-nowrap">(in words)</span>
              <div className="flex-1 min-w-[200px] border-b-2 border-slate-700/80 pb-0.5 px-2 font-serif font-bold italic text-xs sm:text-sm text-[#1e3a8a]">
                {dobInWordsSpecial}
              </div>
            </div>

            {/* 4. Attended this School from ... to ... */}
            <div className="flex items-baseline font-semibold">
              <span className="whitespace-nowrap">4. Attended this School from</span>
              <div className="border-b-2 border-slate-700/80 pb-0.5 px-4 font-mono font-bold text-xs sm:text-sm text-[#1e3a8a] mx-2">
                {slcAttendedFrom}
              </div>
              <span className="whitespace-nowrap">to</span>
              <div className="flex-1 ml-2 border-b-2 border-slate-700/80 pb-0.5 px-4 font-mono font-bold text-xs sm:text-sm text-[#1e3a8a]">
                {slcAttendedTo}
              </div>
            </div>

            {/* 5. Class in which studying ... Attendance ... */}
            <div className="flex items-baseline font-semibold">
              <span className="whitespace-nowrap">5. Class in which studying</span>
              <div className="flex-1 border-b-2 border-slate-700/80 pb-0.5 px-4 font-serif font-bold text-xs sm:text-sm text-[#1e3a8a] mx-2">
                {studentClass}
              </div>
              <span className="whitespace-nowrap">Attendance</span>
              <div className="w-28 border-b-2 border-slate-700/80 pb-0.5 px-4 font-mono font-bold text-xs sm:text-sm text-[#1e3a8a] ml-2 text-center">
                {slcAttendance}
              </div>
            </div>

            {/* 6. Passed / Failed in the examination for Promotion to Class ... */}
            <div className="flex items-baseline font-semibold">
              <span className="whitespace-nowrap">
                6. <span className="relative inline-block mr-1">
                  <span className="absolute -top-3.5 left-1 text-[#1e3a8a] font-black text-sm">✓</span>
                  Passed
                </span>
                / Failed in the examination for Promotion to Class
              </span>
              <div className="flex-1 ml-2 border-b-2 border-slate-700/80 pb-0.5 px-4 font-serif font-bold text-xs sm:text-sm text-[#1e3a8a]">
                {slcPromotionClass}
              </div>
            </div>

            {/* 7. Date of Admission ... Date of withdrawal ... */}
            <div className="flex items-baseline font-semibold">
              <span className="whitespace-nowrap">7. Date of Admission</span>
              <div className="border-b-2 border-slate-700/80 pb-0.5 px-4 font-mono font-bold text-xs sm:text-sm text-[#1e3a8a] mx-2">
                {slcDateOfAdmission}
              </div>
              <span className="whitespace-nowrap">Date of withdrawal</span>
              <div className="flex-1 ml-2 border-b-2 border-slate-700/80 pb-0.5 px-4 font-mono font-bold text-xs sm:text-sm text-[#1e3a8a]">
                {slcDateOfWithdrawal}
              </div>
            </div>

            {/* 8. Progress ... Conduct ... */}
            <div className="flex items-baseline font-semibold">
              <span className="whitespace-nowrap">8. Progress</span>
              <div className="flex-1 border-b-2 border-slate-700/80 pb-0.5 px-4 font-serif font-bold text-xs sm:text-sm text-[#1e3a8a] mx-2">
                {slcProgress}
              </div>
              <span className="whitespace-nowrap">Conduct</span>
              <div className="flex-1 ml-2 border-b-2 border-slate-700/80 pb-0.5 px-4 font-serif font-bold text-xs sm:text-sm text-[#1e3a8a]">
                {slcConduct}
              </div>
            </div>
          </div>

          {/* Footer Signatures, Stamps, and Office Contact */}
          <div className="relative grid grid-cols-3 items-end text-xs font-semibold text-slate-800 mt-8 pt-4">
            {/* Left Column: Prepared By & Checked By with official round stamp */}
            <div className="space-y-2 relative">
              <div className="flex items-baseline">
                <span className="whitespace-nowrap">Prepared By</span>
                <div className="flex-1 ml-1 border-b border-slate-700 pb-0.5 font-serif italic text-blue-700 px-2 font-bold">
                  {slcPreparedBy || 'Office Clerk'}
                </div>
              </div>
              <div className="flex items-baseline">
                <span className="whitespace-nowrap">Checked By</span>
                <div className="flex-1 ml-1 border-b border-slate-700 pb-0.5 font-serif italic text-blue-700 px-2 font-bold">
                  {slcCheckedBy || 'Vice Principal'}
                </div>
              </div>

              {/* Realistic Official Round Ink Stamp matching photo */}
              <div className="absolute -top-3.5 right-1 w-16 h-16 rounded-full border-2 border-blue-700/80 flex flex-col items-center justify-center p-1 text-[7px] font-bold text-blue-800/80 uppercase tracking-tighter text-center rotate-[-12deg] pointer-events-none opacity-85 shadow-2xs">
                <div className="border border-blue-600/70 rounded-full w-full h-full flex flex-col items-center justify-center">
                  <span className="leading-tight">High Light</span>
                  <span className="leading-tight">Model School</span>
                  <span className="text-[6px] text-blue-600">Thall</span>
                </div>
              </div>
            </div>

            {/* Center Column: PRINCIPAL OF High Light Model School Thall (Officer seal) */}
            <div className="text-center space-y-0.5">
              <div className="font-black uppercase text-[11px] text-[#1e3a8a] tracking-wider">
                PRINCIPAL OF
              </div>
              <div className="font-extrabold text-xs text-slate-900 leading-tight">
                High Light Model School
              </div>
              <div className="font-bold text-[11px] text-slate-700">
                Thall
              </div>
              <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                (Officer seal)
              </div>
            </div>

            {/* Right Column: Office Contact & Principal Signature */}
            <div className="text-right space-y-1.5">
              <div>
                <span className="text-[11px] font-bold text-slate-700 block">Office Contact</span>
                <span className="font-mono font-bold text-xs text-[#1e3a8a]">{slcOfficeContact}</span>
              </div>
              <div className="flex items-baseline justify-end pt-1">
                <span className="mr-2">Signature</span>
                <div className="w-28 border-b border-slate-700 pb-0.5 text-center font-serif italic text-base font-bold text-blue-700">
                  Sajid
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 4. DETAILED MARKS CERTIFICATE (DMC / TRANSCRIPT)
    if (docType === 'dmc') {
      const totalMax = DEFAULT_SUBJECTS.reduce((acc, s) => acc + s.maxMarks, 0);
      const totalObtained = DEFAULT_SUBJECTS.reduce((acc, s) => acc + s.obtained, 0);
      const percentage = ((totalObtained / totalMax) * 100).toFixed(1);

      return (
        <div
          key={student.id}
          className="print-page w-full max-w-[800px] mx-auto bg-white rounded-2xl shadow-xl border-8 border-double p-8 sm:p-12 relative overflow-hidden transition-all text-slate-800"
          style={{
            borderColor: currentTheme.primary,
            backgroundImage: customBgImage ? `url(${customBgImage})` : 'none',
            backgroundSize: 'cover',
            backgroundColor: currentTheme.cardBg
          }}
        >
          {/* Watermark Seal */}
          {showWatermarkSeal && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06]">
              <img src="/logo.png" alt="Highlight Model School Watermark" className="w-80 h-96 object-contain" />
            </div>
          )}

          {/* Header */}
          <div className="border-b-2 pb-5 relative" style={{ borderColor: `${currentTheme.primary}40` }}>
            <div className="flex items-center justify-between gap-3 sm:gap-4 mb-2">
              {/* Left Side: School Logo (Bara & Left Side) */}
              <div className="bg-white rounded-2xl p-2 sm:p-2.5 shadow-md border border-slate-200/90 flex-shrink-0 flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="Highlight Model School Emblem"
                  className="w-20 h-24 sm:w-24 sm:h-28 object-contain drop-shadow-xs"
                />
              </div>

              {/* Center: School Name & Examination Department */}
              <div className="flex-1 text-center px-1 sm:px-4">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight uppercase font-serif" style={{ color: currentTheme.primary }}>
                  {schoolName}
                </h1>
                <div className="text-xs sm:text-sm font-black tracking-[0.2em] uppercase text-amber-600 mt-1">
                  Saraghundi Thall
                </div>
                <div className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1">
                  Department of Examinations • Session {academicSession}
                </div>
              </div>

              {/* Right Side: Student Photo (Har Student Ka Image) */}
              <div className="flex-shrink-0 text-center">
                <div
                  className="bg-white rounded-xl p-1 shadow-md border-2 overflow-hidden flex items-center justify-center"
                  style={{ borderColor: currentTheme.primary }}
                >
                  <img
                    src={photoUrl}
                    alt={student.full_name}
                    className="w-20 h-24 sm:w-24 sm:h-28 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.full_name || 'Student')}&background=0f172a&color=fff&size=200&bold=true`;
                    }}
                  />
                </div>
                <div className="text-[10px] font-mono font-bold text-slate-500 mt-1 uppercase tracking-wider">
                  Roll #{studentRoll}
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <span
                className="px-6 py-2 rounded-full font-serif font-black text-xs sm:text-sm md:text-base tracking-wider uppercase border shadow-2xs inline-block"
                style={{ backgroundColor: currentTheme.accent, color: currentTheme.primary, borderColor: currentTheme.border }}
              >
                Detailed Marks Certificate (DMC) • {examName}
              </span>
            </div>
          </div>

          {/* Student Profile Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs my-5">
            <div>
              <span className="text-slate-400 block font-sans">Student Name:</span>
              <strong className="text-slate-900 font-serif text-sm">{student.full_name}</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-sans">Father's Name:</span>
              <strong className="text-slate-900 font-serif">{studentFather}</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-sans">Roll Number:</span>
              <strong className="text-slate-900 font-mono text-sm">{studentRoll}</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-sans">Class / Grade:</span>
              <strong className="text-slate-900 font-serif">{studentClass}</strong>
            </div>
          </div>

          {/* Marks Table */}
          <div className="overflow-x-auto my-5">
            <table className="w-full text-xs sm:text-sm border-collapse border border-slate-300">
              <thead>
                <tr className="text-white text-xs uppercase" style={{ backgroundColor: currentTheme.primary }}>
                  <th className="p-2.5 text-left border border-slate-400">Sr.</th>
                  <th className="p-2.5 text-left border border-slate-400">Subject Name</th>
                  <th className="p-2.5 text-center border border-slate-400">Max Marks</th>
                  <th className="p-2.5 text-center border border-slate-400">Pass Marks</th>
                  <th className="p-2.5 text-center border border-slate-400">Obtained</th>
                  <th className="p-2.5 text-center border border-slate-400">Grade</th>
                </tr>
              </thead>
              <tbody>
                {DEFAULT_SUBJECTS.map((sub, idx) => {
                  const perc = (sub.obtained / sub.maxMarks) * 100;
                  const grade = perc >= 80 ? 'A+' : perc >= 70 ? 'A' : perc >= 60 ? 'B' : perc >= 50 ? 'C' : 'D';
                  return (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                      <td className="p-2 border border-slate-300 text-center font-mono">{idx + 1}</td>
                      <td className="p-2 border border-slate-300 font-semibold">{sub.name}</td>
                      <td className="p-2 border border-slate-300 text-center font-mono">{sub.maxMarks}</td>
                      <td className="p-2 border border-slate-300 text-center font-mono">{sub.passMarks}</td>
                      <td className="p-2 border border-slate-300 text-center font-mono font-bold text-slate-900">{sub.obtained}</td>
                      <td className="p-2 border border-slate-300 text-center font-bold text-emerald-700">{grade}</td>
                    </tr>
                  );
                })}
                {/* Total Row */}
                <tr className="font-bold bg-slate-100 text-slate-900 text-sm">
                  <td colSpan={2} className="p-3 border border-slate-400 text-right uppercase">
                    Grand Total
                  </td>
                  <td className="p-3 border border-slate-400 text-center font-mono">{totalMax}</td>
                  <td className="p-3 border border-slate-400 text-center font-mono">210</td>
                  <td className="p-3 border border-slate-400 text-center font-mono text-base font-extrabold" style={{ color: currentTheme.primary }}>
                    {totalObtained}
                  </td>
                  <td className="p-3 border border-slate-400 text-center font-black text-emerald-700">A+</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Performance Summary Banner */}
          <div
            className="p-4 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-semibold my-4"
            style={{ backgroundColor: currentTheme.accent, borderColor: currentTheme.border }}
          >
            <div>
              <span>Percentage: </span>
              <strong className="text-base text-slate-900">{percentage}%</strong>
            </div>
            <div>
              <span>Overall Grade: </span>
              <strong className="text-base text-emerald-700">A+ (Outstanding)</strong>
            </div>
            <div>
              <span>Result Status: </span>
              <strong className="text-base text-emerald-700 uppercase">PASS & PROMOTED</strong>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 items-end text-center mt-12 pt-4 border-t border-slate-200">
            <div>
              <div className="w-28 border-b-2 border-slate-900 mx-auto mb-1"></div>
              <div className="text-xs font-bold text-slate-800">Exam Controller</div>
            </div>
            <div>
              <div className="w-28 border-b-2 border-slate-900 mx-auto mb-1"></div>
              <div className="text-xs font-bold text-slate-800">Class Incharge</div>
            </div>
            <div>
              <div className="w-36 border-b-2 border-slate-900 mx-auto mb-1"></div>
              <div className="text-xs font-bold text-slate-800">{principalName}</div>
              <div className="text-[10px] font-bold" style={{ color: currentTheme.primary }}>Head Principal</div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Celebratory Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs font-semibold animate-in fade-in border shadow-sm ${
            feedback.type === 'success'
              ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-900 border-emerald-300 ring-2 ring-emerald-500/20'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-bold">{feedback.message}</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {feedback.type === 'success' && (
              <>
                <Link
                  to="/admin/documents"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View in Issued Records</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Print Copy</span>
                </button>
              </>
            )}
            <button
              onClick={() => setFeedback(null)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white/50"
              title="Close notification"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-xs">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Academic Document Generator
              </h2>
              <p className="text-xs text-slate-500">
                Generate, customize, and issue official school certificates, student ID cards, SLC & DMC directly to students
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-2xs flex items-center gap-2 active:scale-95"
            title="Direct print all generated documents"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print {targetStudents.length > 1 ? `All (${targetStudents.length})` : 'Document'}</span>
          </button>

          {/* Dedicated Issue Document to Student Button */}
          <button
            onClick={handleSaveToRecords}
            disabled={saving || targetStudents.length === 0}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all shadow-md hover:shadow-lg flex items-center gap-2.5 active:scale-95 ring-2 ring-emerald-500/20"
            title="Officially issue this document to the student portal and mobile app"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <FileCheck className="w-4 h-4 text-emerald-100" />
            )}
            <span>
              {targetStudents.length > 1
                ? `Issue to All Students (${targetStudents.length})`
                : `Issue Document to Student`}
            </span>
          </button>
        </div>
      </div>

      {/* Document Type Selector Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
        <button
          onClick={() => setDocType('birth_cert')}
          className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs font-bold transition-all ${
            docType === 'birth_cert'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Birth Certificate</span>
        </button>

        <button
          onClick={() => setDocType('id_card')}
          className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs font-bold transition-all ${
            docType === 'id_card'
              ? 'bg-[#1a73e8] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Student ID Card</span>
        </button>

        <button
          onClick={() => setDocType('school_leaving')}
          className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs font-bold transition-all ${
            docType === 'school_leaving'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Leaving Certificate (SLC)</span>
        </button>

        <button
          onClick={() => setDocType('dmc')}
          className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs font-bold transition-all ${
            docType === 'dmc'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Detailed Marks (DMC)</span>
        </button>
      </div>

      {/* Main Grid: Left Controls Panel + Right Live Document Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Controls Panel (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* 1. Target Audience / Scope Box */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>1. Generation Scope</span>
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                {targetStudents.length} student{targetStudents.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Scope Radios */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setScope('single')}
                className={`py-2 px-2 rounded-xl text-xs font-bold text-center border transition-all ${
                  scope === 'single'
                    ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Single
              </button>
              <button
                type="button"
                onClick={() => setScope('class')}
                className={`py-2 px-2 rounded-xl text-xs font-bold text-center border transition-all ${
                  scope === 'class'
                    ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Class-wise
              </button>
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`py-2 px-2 rounded-xl text-xs font-bold text-center border transition-all ${
                  scope === 'all'
                    ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                All School
              </button>
            </div>

            {/* Dropdowns & Search based on Scope */}
            {scope === 'single' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Select Student
                  </label>
                  {studentSearchQuery ? (
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      {filteredStudentsBySearch.length} found
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {scopedStudents.length} total
                    </span>
                  )}
                </div>

                {/* Instant Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={studentSearchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search student by name, roll no, or ID..."
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl text-xs font-semibold text-slate-800 transition-all placeholder:text-slate-400"
                  />
                  {studentSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setStudentSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Dropdown showing ONLY Student Name */}
                <div>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => handleSelectStudent(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    {filteredStudentsBySearch.length > 0 ? (
                      filteredStudentsBySearch.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.full_name}
                        </option>
                      ))
                    ) : (
                      <option disabled value="">No student matching search</option>
                    )}
                  </select>
                </div>

                {activeStudent && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-mono text-slate-500">
                      Roll: <strong className="text-slate-800">{activeStudent.roll_number || 'N/A'}</strong> • <strong className="text-slate-800">{activeStudent.class_name || 'Grade 1'}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenQuickEdit(activeStudent)}
                      className="px-2.5 py-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1.5 transition-colors"
                      title="Edit this student's details"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit Student</span>
                    </button>
                  </div>
                )}

                {/* Live Quick-Select Matches List when searching */}
                {studentSearchQuery.trim() && (
                  <div className="space-y-1 pt-1 animate-in fade-in">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Matching Students</span>
                      <span className="text-[10px] text-blue-600 font-normal">Click to pick</span>
                    </div>

                    {filteredStudentsBySearch.length === 0 ? (
                      <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-[11px] text-rose-700 font-medium">
                        No student found matching "{studentSearchQuery}".{' '}
                        <button
                          type="button"
                          onClick={() => setStudentSearchQuery('')}
                          className="underline font-bold ml-1 text-rose-800"
                        >
                          Clear search
                        </button>
                      </div>
                    ) : (
                      <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                        {filteredStudentsBySearch.map(s => {
                          const isSelected = String(selectedStudentId) === String(s.id);
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => handleSelectStudent(s.id)}
                              className={`w-full text-left p-2 rounded-xl text-xs transition-all border flex items-center justify-between ${
                                isSelected
                                  ? 'bg-blue-50 border-blue-500 text-blue-950 font-bold shadow-2xs ring-1 ring-blue-500/20'
                                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                              }`}
                            >
                              <span className="truncate">{s.full_name}</span>
                              <span className="text-[10px] text-slate-400 ml-2 flex-shrink-0">
                                Roll {s.roll_number || 'N/A'} • {s.class_name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {scope === 'class' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Class / Grade</label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => {
                      setSelectedClassId(e.target.value);
                      setStudentSearchQuery('');
                    }}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.section ? `(${c.section})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Class Student Search & Focus Selection */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      Search & Focus Student (in this Class)
                    </label>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {scopedStudents.length} students
                    </span>
                  </div>

                  {/* Search Bar for Class */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={studentSearchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Search student in this class..."
                      className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl text-xs font-semibold text-slate-800 transition-all placeholder:text-slate-400"
                    />
                    {studentSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setStudentSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Dropdown with ONLY Student Name in Class */}
                  <div>
                    <select
                      value={activeStudent ? activeStudent.id : selectedStudentId}
                      onChange={(e) => handleSelectStudent(e.target.value)}
                      className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    >
                      {filteredStudentsBySearch.length > 0 ? (
                        filteredStudentsBySearch.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.full_name}
                          </option>
                        ))
                      ) : (
                        <option disabled value="">No student in this class</option>
                      )}
                    </select>
                  </div>

                  {/* Live Matches List when searching in Class */}
                  {studentSearchQuery.trim() && (
                    <div className="space-y-1 pt-1 animate-in fade-in">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Matching in Class</span>
                        <span className="text-[10px] text-blue-600 font-normal">Click to focus</span>
                      </div>

                      {filteredStudentsBySearch.length === 0 ? (
                        <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-[11px] text-rose-700 font-medium">
                          No student found matching "{studentSearchQuery}" in this class.
                        </div>
                      ) : (
                        <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                          {filteredStudentsBySearch.map(s => {
                            const isSelected = activeStudent && String(activeStudent.id) === String(s.id);
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => handleSelectStudent(s.id)}
                                className={`w-full text-left p-2 rounded-xl text-xs transition-all border flex items-center justify-between ${
                                  isSelected
                                    ? 'bg-blue-50 border-blue-500 text-blue-950 font-bold shadow-2xs ring-1 ring-blue-500/20'
                                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                                }`}
                              >
                                <span className="truncate">{s.full_name}</span>
                                <span className="text-[10px] text-slate-400 ml-2 flex-shrink-0">
                                  Roll {s.roll_number || 'N/A'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {scope === 'all' && (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 text-xs font-medium">
                  ⚡ Batch Generation Active for all <strong>{students.length} students</strong> across the school.
                </div>

                {/* All School Student Search & Focus Selection */}
                <div className="pt-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      Search & Focus Student (All School)
                    </label>
                    {studentSearchQuery && (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        {filteredStudentsBySearch.length} found
                      </span>
                    )}
                  </div>

                  {/* Search Bar for All School */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={studentSearchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Search student across whole school..."
                      className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl text-xs font-semibold text-slate-800 transition-all placeholder:text-slate-400"
                    />
                    {studentSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setStudentSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Dropdown with ONLY Student Name across All School */}
                  <div>
                    <select
                      value={activeStudent ? activeStudent.id : selectedStudentId}
                      onChange={(e) => handleSelectStudent(e.target.value)}
                      className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    >
                      {filteredStudentsBySearch.length > 0 ? (
                        filteredStudentsBySearch.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.full_name}
                          </option>
                        ))
                      ) : (
                        <option disabled value="">No student found</option>
                      )}
                    </select>
                  </div>

                  {/* Live Matches List when searching across All School */}
                  {studentSearchQuery.trim() && (
                    <div className="space-y-1 pt-1 animate-in fade-in">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Matching Students</span>
                        <span className="text-[10px] text-blue-600 font-normal">Click to focus</span>
                      </div>

                      {filteredStudentsBySearch.length === 0 ? (
                        <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-[11px] text-rose-700 font-medium">
                          No student found matching "{studentSearchQuery}".
                        </div>
                      ) : (
                        <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                          {filteredStudentsBySearch.map(s => {
                            const isSelected = activeStudent && String(activeStudent.id) === String(s.id);
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => handleSelectStudent(s.id)}
                                className={`w-full text-left p-2 rounded-xl text-xs transition-all border flex items-center justify-between ${
                                  isSelected
                                    ? 'bg-blue-50 border-blue-500 text-blue-950 font-bold shadow-2xs ring-1 ring-blue-500/20'
                                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                                }`}
                              >
                                <span className="truncate">{s.full_name}</span>
                                <span className="text-[10px] text-slate-400 ml-2 flex-shrink-0">
                                  Roll {s.roll_number || 'N/A'} • {s.class_name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Design & Template Styling ("taki ai ya mai design upload karo same to same osy tara banaye") */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-4 h-4 text-amber-500" />
              <span>2. Design & Customization</span>
            </h3>

            {/* Preset Themes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Institutional Color Theme</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(THEMES).map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setThemeKey(t.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all text-xs font-bold ${
                      themeKey === t.id
                        ? 'border-slate-800 ring-2 ring-slate-800/10 shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: t.primary }}></span>
                    <span className="truncate text-slate-800">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Design / Background Upload */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Upload Custom Template / Background Image
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Aap apna official scanned letterhead ya background upload kar sakte hain taake exact usi tarah bane:
              </p>
              
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleBgUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{customBgImage ? 'Change Image' : 'Upload Design'}</span>
                </button>
                {customBgImage && (
                  <button
                    type="button"
                    onClick={() => setCustomBgImage(null)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Remove custom background"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Student Photo Options ("image k sath") */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showStudentPhoto}
                  onChange={(e) => setShowStudentPhoto(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span className="text-xs font-bold text-slate-700">Include Student Photo ("Image k sath")</span>
              </label>

              {activeStudent && showStudentPhoto && (
                <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100">
                  <img
                    src={getStudentPhotoUrl(activeStudent)}
                    alt={activeStudent.full_name}
                    className="w-10 h-10 object-cover rounded-lg border"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-slate-800 truncate">{activeStudent.full_name}</div>
                    <div className="text-[10px] text-slate-400">Current photo preview</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="file"
                      ref={photoInputRef}
                      accept="image/*"
                      onChange={(e) => handleStudentPhotoUpload(e, activeStudent.id)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="text-[10px] font-bold px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 shadow-2xs"
                    >
                      Upload Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenQuickEdit(activeStudent)}
                      className="text-[10px] font-bold px-2 py-1 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-100"
                      title="Edit Student Details"
                    >
                      ✏️ Edit
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Document Specific Toggles */}
            {docType === 'id_card' && (
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-1">ID Card Orientation</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIdCardOrientation('vertical')}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold border ${
                      idCardOrientation === 'vertical' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'border-slate-200'
                    }`}
                  >
                    Vertical Badge
                  </button>
                  <button
                    type="button"
                    onClick={() => setIdCardOrientation('horizontal')}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold border ${
                      idCardOrientation === 'horizontal' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'border-slate-200'
                    }`}
                  >
                    Horizontal Card
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Institutional Details */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-600" />
              <span>3. Certificate Particulars</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Principal Name</label>
                <input
                  type="text"
                  value={principalName}
                  onChange={(e) => setPrincipalName(e.target.value)}
                  className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Date of Issue</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Academic Session</label>
                <input
                  type="text"
                  value={academicSession}
                  onChange={(e) => setAcademicSession(e.target.value)}
                  className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                />
              </div>

              {docType === 'school_leaving' && (
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-black text-[#1e3a8a] uppercase tracking-wider">
                    School Leaving Form Fields
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Reg NO.</label>
                      <input
                        type="text"
                        value={slcRegNo}
                        onChange={(e) => setSlcRegNo(e.target.value)}
                        placeholder="21224"
                        className="w-full py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">File No.</label>
                      <input
                        type="text"
                        value={slcFileNo}
                        onChange={(e) => setSlcFileNo(e.target.value)}
                        placeholder="0427"
                        className="w-full py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Admn. No. (Roll)</label>
                      <input
                        type="text"
                        value={slcAdmnNo}
                        onChange={(e) => setSlcAdmnNo(e.target.value)}
                        placeholder="386"
                        className="w-full py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Attendance</label>
                      <input
                        type="text"
                        value={slcAttendance}
                        onChange={(e) => setSlcAttendance(e.target.value)}
                        placeholder="90%"
                        className="w-full py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Attended From</label>
                      <input
                        type="text"
                        value={slcAttendedFrom}
                        onChange={(e) => setSlcAttendedFrom(e.target.value)}
                        placeholder="08-05-2023"
                        className="w-full py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Attended To</label>
                      <input
                        type="text"
                        value={slcAttendedTo}
                        onChange={(e) => setSlcAttendedTo(e.target.value)}
                        placeholder="18-04-2026"
                        className="w-full py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Promotion to Class</label>
                    <input
                      type="text"
                      value={slcPromotionClass}
                      onChange={(e) => setSlcPromotionClass(e.target.value)}
                      placeholder="4th / Fourth"
                      className="w-full py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Admission Date</label>
                      <input
                        type="text"
                        value={slcDateOfAdmission}
                        onChange={(e) => setSlcDateOfAdmission(e.target.value)}
                        placeholder="05-05-2023"
                        className="w-full py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Withdrawal Date</label>
                      <input
                        type="text"
                        value={slcDateOfWithdrawal}
                        onChange={(e) => setSlcDateOfWithdrawal(e.target.value)}
                        placeholder="20-04-2026"
                        className="w-full py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Progress</label>
                      <input
                        type="text"
                        value={slcProgress}
                        onChange={(e) => setSlcProgress(e.target.value)}
                        placeholder="Excellent"
                        className="w-full py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Conduct</label>
                      <input
                        type="text"
                        value={slcConduct}
                        onChange={(e) => setSlcConduct(e.target.value)}
                        placeholder="Good"
                        className="w-full py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Office Contact</label>
                    <input
                      type="text"
                      value={slcOfficeContact}
                      onChange={(e) => setSlcOfficeContact(e.target.value)}
                      placeholder="0301-8323146"
                      className="w-full py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>
              )}

              {docType === 'dmc' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Examination Term Name</label>
                  <input
                    type="text"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Live Document Preview Canvas (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Top Preview Bar & Student Carousel Navigator */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Display Mode:</span>
              <button
                type="button"
                onClick={() => setViewMode('single_preview')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'single_preview'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Focus Preview
              </button>
              <button
                type="button"
                onClick={() => setViewMode('batch_overview')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'batch_overview'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Documents ({targetStudents.length})
              </button>
            </div>

            {viewMode === 'single_preview' && targetStudents.length > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={previewIndex <= 0}
                  onClick={() => setPreviewIndex(prev => Math.max(0, prev - 1))}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg text-xs font-bold"
                >
                  ◀ Prev
                </button>
                <span className="text-xs font-mono font-bold text-slate-700">
                  {previewIndex + 1} / {targetStudents.length}
                </span>
                <button
                  type="button"
                  disabled={previewIndex >= targetStudents.length - 1}
                  onClick={() => setPreviewIndex(prev => Math.min(targetStudents.length - 1, prev + 1))}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg text-xs font-bold"
                >
                  Next ▶
                </button>
              </div>
            )}

            {/* Quick Issue Button in Preview Bar */}
            <button
              type="button"
              onClick={handleSaveToRecords}
              disabled={saving || targetStudents.length === 0}
              className="ml-auto px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-2 active:scale-95"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileCheck className="w-3.5 h-3.5" />}
              <span>Issue to {activeStudent ? activeStudent.full_name : 'Student'}</span>
            </button>
          </div>

          {/* Render Screen Preview */}
          <div className="bg-slate-100/70 p-4 sm:p-6 rounded-3xl border border-slate-200/80 min-h-[600px] flex items-center justify-center overflow-x-auto shadow-inner">
            {targetStudents.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold">No students found for this selection.</p>
              </div>
            ) : viewMode === 'single_preview' ? (
              renderStudentDocument(activeStudent, previewIndex)
            ) : (
              <div className="space-y-8 w-full">
                {targetStudents.map((stu, idx) => (
                  <div key={stu.id} className="relative">
                    <div className="text-[11px] font-mono font-bold text-slate-400 mb-2">
                      Document #{idx + 1} — {stu.full_name} (Roll {stu.roll_number || stu.id})
                    </div>
                    {renderStudentDocument(stu, idx)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Floating Issue Action Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold shadow-2xs">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-black text-slate-900">
                  Ready to Issue Official {docType === 'birth_cert' ? 'Birth Certificate' : docType === 'id_card' ? 'Student ID Card' : docType === 'school_leaving' ? 'Leaving Certificate (SLC)' : 'Detailed Marks Certificate (DMC)'}
                </div>
                <div className="text-[11px] text-slate-500">
                  Student: <strong className="text-slate-900 font-bold">{activeStudent?.full_name || 'Selected Student'}</strong> (Roll: {activeStudent?.roll_number || 'Auto'}) • Will be saved directly to Student Records and mobile app
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 active:scale-95 border border-slate-200"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Print Copy</span>
              </button>

              <button
                type="button"
                onClick={handleSaveToRecords}
                disabled={saving || targetStudents.length === 0}
                className="px-6 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all shadow-md hover:shadow-lg flex items-center gap-2 active:scale-95 ring-2 ring-emerald-500/20"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Send className="w-4 h-4 text-emerald-100" />
                )}
                <span>Issue Document to Student</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Print Wrapper - Rendered exclusively during window.print() */}
      <div id="official-document-print-area" className="hidden print:block">
        {docType === 'id_card' ? (
          <div className="grid grid-cols-2 gap-6 p-4">
            {targetStudents.map((stu, idx) => (
              <div key={stu.id} className="break-inside-avoid">
                {renderStudentDocument(stu, idx)}
              </div>
            ))}
          </div>
        ) : (
          <div>
            {targetStudents.map((stu, idx) => (
              <div key={stu.id} style={{ breakAfter: 'page', pageBreakAfter: 'always' }} className="p-4">
                {renderStudentDocument(stu, idx)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dedicated Print Media Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #official-document-print-area, #official-document-print-area * {
            visibility: visible !important;
          }
          #official-document-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
          }
          .print-page {
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 auto !important;
            max-width: 100% !important;
            height: 100% !important;
            break-after: page !important;
            page-break-after: always !important;
          }
          .print-card {
            box-shadow: none !important;
            margin: 0 auto !important;
          }
          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}} />

      {/* Quick Edit Student Details Modal */}
      {quickEditOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Edit Student Details
                </h3>
                <p className="text-xs text-slate-500">
                  Update student info for certificates, ID cards, and official documents.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuickEditOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuickEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={quickEditForm.full_name}
                  onChange={(e) => setQuickEditForm({ ...quickEditForm, full_name: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Father's Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={quickEditForm.father_name}
                    onChange={(e) => setQuickEditForm({ ...quickEditForm, father_name: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Roll Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={quickEditForm.roll_number}
                    onChange={(e) => setQuickEditForm({ ...quickEditForm, roll_number: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Class / Grade</label>
                  <select
                    value={quickEditForm.class_id}
                    onChange={(e) => setQuickEditForm({ ...quickEditForm, class_id: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth (DOB)</label>
                  <input
                    type="date"
                    value={quickEditForm.dob}
                    onChange={(e) => setQuickEditForm({ ...quickEditForm, dob: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={quickEditForm.address}
                  onChange={(e) => setQuickEditForm({ ...quickEditForm, address: e.target.value })}
                  placeholder="e.g. Islamabad"
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={quickEditForm.parent_phone}
                  onChange={(e) => setQuickEditForm({ ...quickEditForm, parent_phone: e.target.value })}
                  placeholder="+92 300 1234567"
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuickEditOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickEditSaving}
                  className="px-4 py-2 bg-[#1a73e8] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  {quickEditSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Save & Update</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
