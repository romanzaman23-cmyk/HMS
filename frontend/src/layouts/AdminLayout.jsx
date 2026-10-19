import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck2,
  Users,
  Fingerprint,
  CalendarDays,
  Megaphone,
  GraduationCap,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Award,
  UserCheck,
  Clock
} from 'lucide-react';
import SchoolLogo from '../components/SchoolLogo';
import NotificationBell from '../components/NotificationBell';
import BrandFooter from '../components/BrandFooter';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(() => {
    try {
      const cached = localStorage.getItem('hms_cached_approvals');
      if (cached) {
        return JSON.parse(cached).filter(r => r.status === 'PENDING').length;
      }
    } catch (e) {}
    return 0;
  });

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await api.get('/approvals');
        if (res.data?.counts?.pending !== undefined) {
          setPendingApprovalsCount(res.data.counts.pending);
        }
      } catch (err) {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 6000);

    const handleApprovalsChange = (e) => {
      if (e.detail?.list) {
        const count = e.detail.list.filter(r => r.status === 'PENDING').length;
        setPendingApprovalsCount(count);
      }
    };
    window.addEventListener('hms_approvals_changed', handleApprovalsChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('hms_approvals_changed', handleApprovalsChange);
    };
  }, []);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Attendance', path: '/admin/attendance', icon: CalendarCheck2 },
    { label: 'Students', path: '/admin/students', icon: Users },
    {
      label: 'Student Approvals',
      path: '/admin/approvals',
      icon: UserCheck,
      badge: pendingApprovalsCount
    },
    { label: 'Timetable', path: '/admin/timetable', icon: Clock },
    { label: 'Devices (Fingerprint)', path: '/admin/devices', icon: Fingerprint },
    { label: 'Leave Management', path: '/admin/leave-management', icon: CalendarDays },
    { label: 'Announcements', path: '/admin/announcements', icon: Megaphone },
    { label: 'Results', path: '/admin/results', icon: GraduationCap },
    { label: 'Documents', path: '/admin/documents', icon: FileText },
    { label: 'Generate Documents', path: '/admin/generate-documents', icon: Award },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  // Dynamic date matching reference style (e.g., "Wed, 1 Oct 2025")
  const todayFormatted = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date());

  return (
    <div className="h-screen w-screen bg-[#f1f5f9] flex overflow-hidden font-sans">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Permanently fixed/sticky to screen */}
      <aside
        className={`fixed lg:sticky top-0 bottom-0 left-0 z-50 w-64 h-screen bg-[#0e2238] text-white flex flex-col flex-shrink-0 transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo Brand Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-slate-800/80 flex-shrink-0">
          <SchoolLogo variant="dark" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Nav Links - Nav list scrolls internally if overflowed */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#1a73e8] text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-slate-900 shadow-xs flex-shrink-0 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile in Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-[#0a1b2d] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600/80 border border-blue-400/40 text-white font-bold text-sm flex items-center justify-center">
                {user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'AS'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white leading-tight truncate">{user?.name || 'Admin'}</p>
                <p className="text-xs text-slate-400">Principal</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area - Scrollable Independently while sidebar stays fixed */}
      <div className="flex-1 h-screen overflow-y-auto flex flex-col min-w-0">
        {/* Top Header Bar - Sticky */}
        <header className="h-20 bg-white border-b border-slate-200/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                Welcome, {user?.name ? user.name.split(' ')[0] : 'Principal'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">
                Here's what's happening at Highlight Model School today.
              </p>
            </div>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="hidden md:flex items-center text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              {todayFormatted}
            </div>

            <NotificationBell isDark={false} />

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
                {user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'AS'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">Admin</p>
                <p className="text-[10px] text-slate-500 font-medium truncate max-w-[120px]">{user?.name || 'Principal'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>

        {/* Brand Footer */}
        <BrandFooter />
      </div>
    </div>
  );
}
