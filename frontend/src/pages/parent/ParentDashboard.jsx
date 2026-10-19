import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck2,
  GraduationCap,
  CalendarDays,
  Megaphone,
  Fingerprint,
  CheckCircle2,
  Clock,
  ChevronRight,
  BookOpen,
  User,
  RefreshCw,
  Camera,
  Upload,
  Edit3,
  X,
  Check,
  Award,
  Sparkles,
  FileText,
  AlertCircle,
  ShieldCheck,
  QrCode,
  IdCard,
  HeartPulse,
  Download,
  Star,
  Flame,
  Volume2
} from 'lucide-react';
import api from '../../services/api';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'
];

const resolveImageUrl = (url) => {
  if (!url) return 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  return url.startsWith('/') ? url : `/${url}`;
};

export default function ParentDashboard() {
  const [child, setChild] = useState(() => {
    try {
      const cached = localStorage.getItem('hms_active_child');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return {
      id: 1,
      name: 'Ahmed Khan',
      class: 'Grade 5',
      roll_no: '025',
      avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200'
    };
  });
  const [allChildren, setAllChildren] = useState([]);

  const [stats, setStats] = useState({
    attendanceRate: 92,
    latestResult: 'A+',
    pendingLeaves: 0,
    newAnnouncements: 3
  });

  // Edit Child Profile Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [idCardModalOpen, setIdCardModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const fileInputRef = useRef(null);

  const [recentActivities, setRecentActivities] = useState([
    {
      id: 1,
      type: 'attendance',
      title: 'Checked in at school',
      time: 'Today, 08:12 AM',
      icon: Fingerprint,
      badge: 'Present (Check-in)',
      bgColor: 'bg-emerald-500',
      textColor: 'text-emerald-700',
      link: '/parent/attendance'
    },
    {
      id: 2,
      type: 'announcement',
      title: 'New school circular published',
      time: 'Today, 09:30 AM',
      icon: Megaphone,
      badge: 'Notice Board',
      bgColor: 'bg-purple-500',
      textColor: 'text-purple-700',
      link: '/parent/announcements'
    },
    {
      id: 3,
      type: 'result',
      title: 'Term 1 Exam Result available',
      time: 'Yesterday, 04:20 PM',
      icon: Award,
      badge: 'Grade A+ (Distinction)',
      bgColor: 'bg-amber-500',
      textColor: 'text-amber-700',
      link: '/parent/results'
    },
    {
      id: 4,
      type: 'leave',
      title: 'Leave request has been approved',
      time: '25 Sep 2025, 11:15 AM',
      icon: CheckCircle2,
      badge: 'Approved by Principal',
      bgColor: 'bg-teal-500',
      textColor: 'text-teal-700',
      link: '/parent/leave-request'
    }
  ]);

  const loadParentData = async () => {
    try {
      const [stuRes, notifRes, leaveRes, annRes] = await Promise.allSettled([
        api.get('/students'),
        api.get('/notifications'),
        api.get('/leaves'),
        api.get('/announcements')
      ]);

      if (stuRes.status === 'fulfilled' && stuRes.value.data.students?.length > 0) {
        const studentList = stuRes.value.data.students;
        setAllChildren(studentList);

        let activeStudent = null;
        try {
          const cached = localStorage.getItem('hms_active_child');
          if (cached) {
            const parsed = JSON.parse(cached);
            activeStudent = studentList.find(c => String(c.id) === String(parsed.id));
          }
        } catch (e) {}

        const s = activeStudent || studentList[0];
        const loadedChild = {
          id: s.id,
          name: s.full_name,
          class: s.class_name,
          roll_no: s.roll_number,
          avatar: s.avatar_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200'
        };
        setChild(loadedChild);
        try {
          localStorage.setItem('hms_active_child', JSON.stringify(loadedChild));
        } catch (e) {}

        setRecentActivities(prev => prev.map(a =>
          a.type === 'attendance'
            ? { ...a, title: `${s.full_name} checked in at school` }
            : a
        ));
      }

      let annCount = 3;
      if (annRes.status === 'fulfilled' && annRes.value.data?.announcements) {
        annCount = annRes.value.data.announcements.length;
      }

      let pendingLeavesCount = 0;
      if (leaveRes.status === 'fulfilled' && leaveRes.value.data?.leaves) {
        pendingLeavesCount = leaveRes.value.data.leaves.filter(l => l.status === 'Pending').length;
      }

      setStats(prev => ({
        ...prev,
        newAnnouncements: annCount,
        pendingLeaves: pendingLeavesCount
      }));
    } catch (err) {
      console.error('Error loading parent dashboard data:', err);
    }
  };

  useEffect(() => {
    loadParentData();

    const handleChildChanged = (e) => {
      if (e?.detail) {
        setChild(e.detail);
        setRecentActivities(prev => prev.map(a =>
          a.type === 'attendance'
            ? { ...a, title: `${e.detail.name} checked in at school` }
            : a
        ));
      }
    };
    window.addEventListener('hms_active_child_changed', handleChildChanged);
    return () => window.removeEventListener('hms_active_child_changed', handleChildChanged);
  }, []);

  const openEditModal = () => {
    setEditName(child.name);
    setAvatarPreview(child.avatar);
    setAvatarFile(null);
    setEditModalOpen(true);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSelectPreset = (url) => {
    setAvatarFile(null);
    setAvatarPreview(url);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('full_name', editName);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      } else if (avatarPreview && avatarPreview.startsWith('http')) {
        formData.append('avatar_url', avatarPreview);
      }

      const res = await api.put(`/students/${child.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        const updated = res.data.student;
        const newChildObj = {
          id: updated.id,
          name: updated.full_name,
          class: updated.class_name,
          roll_no: updated.roll_number,
          avatar: updated.avatar_url || avatarPreview
        };
        setChild(newChildObj);
        localStorage.setItem('hms_active_child', JSON.stringify(newChildObj));
        window.dispatchEvent(new CustomEvent('hms_active_child_changed', { detail: newChildObj }));

        setToast('Profile updated successfully!');
        setTimeout(() => setToast(''), 3000);
        setEditModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      setToast('Saved locally.');
      const newChildObj = {
        ...child,
        name: editName,
        avatar: avatarPreview
      };
      setChild(newChildObj);
      localStorage.setItem('hms_active_child', JSON.stringify(newChildObj));
      window.dispatchEvent(new CustomEvent('hms_active_child_changed', { detail: newChildObj }));
      setEditModalOpen(false);
      setTimeout(() => setToast(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-16 right-4 z-50 bg-emerald-600 text-white px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. HERO STUDENT PROFILE CARD (English Only)                    */}
      {/* ============================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0e2238] via-[#143256] to-[#1a73e8] text-white p-4 sm:p-5 shadow-lg border border-blue-400/20">
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Avatar with Camera Button */}
          <div className="relative group mb-2.5">
            <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-amber-400 via-white to-blue-300 shadow-xl">
              <img
                src={resolveImageUrl(child.avatar)}
                alt={child.name}
                className="w-full h-full rounded-full object-cover bg-slate-800"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200';
                }}
              />
            </div>
            <button
              onClick={openEditModal}
              title="Change Picture"
              className="absolute bottom-0 right-0 p-1.5 bg-[#1a73e8] hover:bg-blue-600 text-white rounded-full shadow-lg border-2 border-[#0e2238] transition-transform active:scale-90"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Student Badges */}
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-[10px] font-black tracking-wider uppercase text-blue-200 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
              STUDENT
            </span>
            <span className="text-[10px] font-black uppercase text-amber-300 bg-amber-400/20 px-2.5 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-300" />
              <span>ROLL #{child.roll_no}</span>
            </span>
          </div>

          {/* Student Name */}
          <h2 className="text-xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            <span>{child.name}</span>
            <button
              onClick={openEditModal}
              className="p-1 text-blue-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Edit name"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </h2>

          <p className="text-xs text-blue-100 font-semibold mt-0.5">
            Highlight Model School • <span className="text-amber-300">{child.class}</span>
          </p>

          {/* Live Today Attendance Badge */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2 bg-emerald-500/25 border border-emerald-400/40 text-emerald-200 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span>Present Today (08:12 AM)</span>
            </div>

            <button
              onClick={() => setIdCardModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white px-3 py-1 rounded-full text-xs font-bold transition-all"
            >
              <IdCard className="w-3.5 h-3.5 text-amber-300" />
              <span>View ID Card</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. THE ACTION APP GRID (2-Column Mobile, English Only)         */}
      {/* ============================================================== */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">
              Quick App Features
            </h3>
            <p className="text-[10px] text-slate-500 font-medium">
              Tap any feature to open details
            </p>
          </div>
          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
            Direct Access
          </span>
        </div>

        {/* 6 Large Visual App Tiles */}
        <div className="grid grid-cols-2 gap-3">
          {/* 1. ATTENDANCE */}
          <Link
            to="/parent/attendance"
            className="group relative bg-white hover:bg-emerald-50/40 rounded-3xl p-3.5 border-2 border-emerald-100 hover:border-emerald-400 shadow-sm hover:shadow-md transition-all flex flex-col justify-between active:scale-95 min-h-[160px]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                92% Score
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>

            <div className="my-1 flex items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform relative">
                <CalendarCheck2 className="w-8 h-8" />
                <span className="absolute -bottom-1 -right-1 bg-white text-emerald-600 p-0.5 rounded-full shadow-xs">
                  <Fingerprint className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            <div className="text-center mt-2">
              <h4 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors leading-tight">
                Daily Attendance
              </h4>
              <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
                Present • 08:12 AM
              </p>
            </div>
          </Link>

          {/* 2. RESULTS */}
          <Link
            to="/parent/results"
            className="group relative bg-white hover:bg-amber-50/40 rounded-3xl p-3.5 border-2 border-amber-100 hover:border-amber-400 shadow-sm hover:shadow-md transition-all flex flex-col justify-between active:scale-95 min-h-[160px]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Star className="w-2.5 h-2.5 fill-amber-700" />
                <span>Grade A+</span>
              </span>
              <Sparkles className="w-3 h-3 text-amber-500" />
            </div>

            <div className="my-1 flex items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-transform relative">
                <Award className="w-8 h-8" />
                <span className="absolute -top-1 -right-1 bg-white text-amber-600 p-0.5 rounded-full shadow-xs">
                  <Star className="w-3 h-3 fill-amber-500" />
                </span>
              </div>
            </div>

            <div className="text-center mt-2">
              <h4 className="text-sm font-black text-slate-900 group-hover:text-amber-700 transition-colors leading-tight">
                Exam Results
              </h4>
              <p className="text-[10px] text-amber-700 font-bold mt-0.5">
                Distinction • 88%
              </p>
            </div>
          </Link>

          {/* 3. NOTICES */}
          <Link
            to="/parent/announcements"
            className="group relative bg-white hover:bg-purple-50/40 rounded-3xl p-3.5 border-2 border-purple-100 hover:border-purple-400 shadow-sm hover:shadow-md transition-all flex flex-col justify-between active:scale-95 min-h-[160px]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                3 New Notices
              </span>
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            </div>

            <div className="my-1 flex items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-transform relative">
                <Megaphone className="w-8 h-8" />
                <span className="absolute -bottom-1 -right-1 bg-white text-purple-600 p-0.5 rounded-full shadow-xs">
                  <Volume2 className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            <div className="text-center mt-2">
              <h4 className="text-sm font-black text-slate-900 group-hover:text-purple-700 transition-colors leading-tight">
                School Notices
              </h4>
              <p className="text-[10px] text-purple-600 font-bold mt-0.5">
                Holidays & Circulars
              </p>
            </div>
          </Link>

          {/* 4. LEAVE REQUEST */}
          <Link
            to="/parent/leave-request"
            className="group relative bg-white hover:bg-rose-50/40 rounded-3xl p-3.5 border-2 border-rose-100 hover:border-rose-400 shadow-sm hover:shadow-md transition-all flex flex-col justify-between active:scale-95 min-h-[160px]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                Online Leave
              </span>
              <CalendarDays className="w-3 h-3 text-rose-500" />
            </div>

            <div className="my-1 flex items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/25 group-hover:scale-105 transition-transform relative">
                <CalendarDays className="w-8 h-8" />
                <span className="absolute -bottom-1 -right-1 bg-white text-rose-600 p-0.5 rounded-full shadow-xs">
                  <HeartPulse className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            <div className="text-center mt-2">
              <h4 className="text-sm font-black text-slate-900 group-hover:text-rose-700 transition-colors leading-tight">
                Leave Request
              </h4>
              <p className="text-[10px] text-rose-600 font-bold mt-0.5">
                Apply for Absence
              </p>
            </div>
          </Link>

          {/* 5. BOOKS & SYLLABUS */}
          <Link
            to="/parent/documents"
            className="group relative bg-white hover:bg-cyan-50/40 rounded-3xl p-3.5 border-2 border-cyan-100 hover:border-cyan-400 shadow-sm hover:shadow-md transition-all flex flex-col justify-between active:scale-95 min-h-[160px]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded-full">
                Study Files
              </span>
              <Download className="w-3 h-3 text-cyan-600" />
            </div>

            <div className="my-1 flex items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform relative">
                <BookOpen className="w-8 h-8" />
                <span className="absolute -bottom-1 -right-1 bg-white text-cyan-600 p-0.5 rounded-full shadow-xs">
                  <FileText className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            <div className="text-center mt-2">
              <h4 className="text-sm font-black text-slate-900 group-hover:text-cyan-700 transition-colors leading-tight">
                Books & Syllabus
              </h4>
              <p className="text-[10px] text-cyan-700 font-bold mt-0.5">
                Fee Slips & Material
              </p>
            </div>
          </Link>

          {/* 6. STUDENT ID CARD */}
          <button
            type="button"
            onClick={() => setIdCardModalOpen(true)}
            className="group relative bg-white hover:bg-blue-50/40 rounded-3xl p-3.5 border-2 border-blue-100 hover:border-blue-400 shadow-sm hover:shadow-md transition-all flex flex-col justify-between text-left active:scale-95 min-h-[160px]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                Verified ID
              </span>
              <ShieldCheck className="w-3 h-3 text-blue-600" />
            </div>

            <div className="my-1 flex items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1a73e8] to-[#0e2238] text-white flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform relative">
                <IdCard className="w-8 h-8" />
                <span className="absolute -bottom-1 -right-1 bg-white text-blue-600 p-0.5 rounded-full shadow-xs">
                  <QrCode className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            <div className="text-center mt-2">
              <h4 className="text-sm font-black text-slate-900 group-hover:text-blue-700 transition-colors leading-tight">
                Student ID Card
              </h4>
              <p className="text-[10px] text-blue-600 font-bold mt-0.5">
                Tap to View Card
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. RECENT ACTIVITIES FEED (English Only)                       */}
      {/* ============================================================== */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900">
                Recent School Updates
              </h3>
            </div>
          </div>
          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            Live Sync
          </span>
        </div>

        <div className="space-y-2">
          {recentActivities.map((act) => {
            const Icon = act.icon;
            return (
              <Link
                key={act.id}
                to={act.link}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 hover:bg-blue-50/50 border border-slate-100 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl ${act.bgColor} text-white flex items-center justify-center flex-shrink-0 shadow-xs`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                      {act.title}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {act.time}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${act.textColor} bg-white border border-slate-200/80`}>
                    {act.badge}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. MODAL: DIGITAL STUDENT ID CARD PREVIEW (English Only)       */}
      {/* ============================================================== */}
      {idCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setIdCardModalOpen(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-[#0e2238] text-white p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IdCard className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold">Highlight Model School ID</span>
              </div>
              <button
                onClick={() => setIdCardModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ID Card Graphic */}
            <div className="p-4 flex flex-col items-center">
              <div className="w-full bg-gradient-to-br from-blue-900 to-[#0e2238] text-white rounded-2xl p-4 shadow-xl border border-blue-400/30 text-center relative overflow-hidden">
                <p className="text-[10px] tracking-widest text-amber-400 uppercase font-black">
                  Highlight Model School
                </p>
                <p className="text-[9px] text-blue-200">Saraghundi Thall</p>

                {/* Photo */}
                <div className="my-2.5 mx-auto w-16 h-16 rounded-full p-1 bg-white shadow-md">
                  <img
                    src={resolveImageUrl(child.avatar)}
                    alt={child.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>

                <h4 className="text-base font-black text-white">{child.name}</h4>
                <p className="text-xs font-bold text-blue-300">{child.class}</p>

                <div className="mt-2.5 grid grid-cols-2 gap-2 text-left bg-black/30 p-2 rounded-xl border border-white/10 text-[10px]">
                  <div>
                    <span className="text-slate-400 block">Roll Number:</span>
                    <span className="font-mono font-bold text-amber-300">#{child.roll_no}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Biometric ID:</span>
                    <span className="font-mono font-bold text-emerald-400">ZKT-025</span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-white/15 flex flex-col items-center">
                  <div className="h-5 w-32 bg-white/20 rounded flex items-center justify-center px-2">
                    <div className="flex gap-1 items-center h-3 w-full">
                      {[...Array(24)].map((_, i) => (
                        <div
                          key={i}
                          className="bg-white flex-1"
                          style={{
                            height: i % 3 === 0 ? '100%' : '60%',
                            opacity: i % 2 === 0 ? 1 : 0.4
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-[8px] font-mono text-slate-300 mt-1">HMS-2025-025</span>
                </div>
              </div>

              <button
                onClick={() => setIdCardModalOpen(false)}
                className="mt-3.5 w-full py-2 bg-[#0e2238] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. MODAL: EDIT CHILD PHOTO & NAME (English Only)               */}
      {/* ============================================================== */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setEditModalOpen(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Update Child Photo & Name
                </h3>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5">
              <div className="flex flex-col items-center">
                <div className="relative w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-blue-500 to-indigo-500 shadow-md mb-2.5">
                  <img
                    src={resolveImageUrl(avatarPreview)}
                    alt="Preview"
                    className="w-full h-full rounded-full object-cover bg-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-1.5 bg-[#1a73e8] text-white rounded-full shadow-lg border-2 border-white"
                    title="Upload photo"
                  >
                    <Upload className="w-3 h-3" />
                  </button>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1.5"
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload from Device</span>
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                  Or choose a preset avatar:
                </label>
                <div className="flex items-center justify-center gap-2">
                  {PRESET_AVATARS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectPreset(url)}
                      className={`w-9 h-9 rounded-full p-0.5 transition-all ${
                        avatarPreview === url
                          ? 'ring-2 ring-blue-600 scale-110'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={url}
                        alt={`Preset ${i}`}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Student Name:
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter full name"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveProfile}
                className="px-4 py-1.5 bg-[#1a73e8] hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Save Changes</span>
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
