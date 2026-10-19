import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck2,
  Megaphone,
  Award,
  CalendarDays,
  BookOpen,
  LogOut,
  Users,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  User,
  ExternalLink,
  X
} from 'lucide-react';
import api from '../services/api';
import SchoolLogo from '../components/SchoolLogo';
import NotificationBell from '../components/NotificationBell';
import { useAuth } from '../context/AuthContext';

export default function ParentLayout() {
  const [children, setChildren] = useState([]);
  const [activeChildId, setActiveChildId] = useState(() => {
    try {
      const cached = localStorage.getItem('hms_active_child');
      if (cached) return JSON.parse(cached).id;
    } catch (e) {}
    return null;
  });
  const [childSheetOpen, setChildSheetOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const { user, logout, quickLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Load Parent's children
  useEffect(() => {
    async function loadChildren() {
      try {
        const res = await api.get('/students');
        if (res.data?.success && res.data.students?.length > 0) {
          const list = res.data.students;
          setChildren(list);
          const currentActive = list.find(c => String(c.id) === String(activeChildId)) || list[0];
          setActiveChildId(currentActive.id);
          const childObj = {
            id: currentActive.id,
            name: currentActive.full_name,
            class: currentActive.class_name,
            roll_no: currentActive.roll_number,
            avatar: currentActive.avatar_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200'
          };
          localStorage.setItem('hms_active_child', JSON.stringify(childObj));
        }
      } catch (err) {
        console.error('Failed to load children in ParentLayout:', err);
      }
    }
    loadChildren();

    const handleChildChanged = (e) => {
      if (e?.detail?.id) {
        setActiveChildId(e.detail.id);
      } else {
        try {
          const cached = localStorage.getItem('hms_active_child');
          if (cached) setActiveChildId(JSON.parse(cached).id);
        } catch (e) {}
      }
    };
    window.addEventListener('hms_active_child_changed', handleChildChanged);
    return () => window.removeEventListener('hms_active_child_changed', handleChildChanged);
  }, []);

  const handleSelectChild = (childItem) => {
    setActiveChildId(childItem.id);
    const childObj = {
      id: childItem.id,
      name: childItem.full_name,
      class: childItem.class_name,
      roll_no: childItem.roll_number,
      avatar: childItem.avatar_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200'
    };
    localStorage.setItem('hms_active_child', JSON.stringify(childObj));
    window.dispatchEvent(new CustomEvent('hms_active_child_changed', { detail: childObj }));
    setChildSheetOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const activeChild = children.find(c => String(c.id) === String(activeChildId)) || children[0] || {
    full_name: 'Ahmed Khan',
    class_name: 'Grade 5',
    roll_number: '025',
    avatar_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200'
  };

  const parentName = user?.name || user?.full_name || 'Parent';

  // 6 Primary Navigation items matching the mobile app experience (English only)
  const navTabs = [
    {
      label: 'Home',
      path: '/parent/dashboard',
      icon: LayoutDashboard,
      activeColor: 'text-[#1a73e8]'
    },
    {
      label: 'Attendance',
      path: '/parent/attendance',
      icon: CalendarCheck2,
      activeColor: 'text-emerald-600'
    },
    {
      label: 'Results',
      path: '/parent/results',
      icon: Award,
      activeColor: 'text-amber-600'
    },
    {
      label: 'Leave',
      path: '/parent/leave-request',
      icon: CalendarDays,
      activeColor: 'text-rose-600'
    },
    {
      label: 'Notices',
      path: '/parent/announcements',
      icon: Megaphone,
      activeColor: 'text-purple-600',
      badge: '3'
    },
    {
      label: 'Books',
      path: '/parent/documents',
      icon: BookOpen,
      activeColor: 'text-cyan-600'
    }
  ];

  return (
    /* Pure Mobile App Container (Centered on desktop, full-width on mobile) */
    <div className="min-h-screen bg-slate-900 flex justify-center font-sans select-none antialiased">
      <div className="w-full max-w-[430px] min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col shadow-2xl relative border-x border-slate-300/40">
        
        {/* ============================================================== */}
        {/* 1. NATIVE MOBILE APP TOP BAR                                   */}
        {/* ============================================================== */}
        <header className="sticky top-0 z-40 bg-[#0e2238] text-white shadow-md flex-shrink-0">
          <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
            {/* School Emblem & Name */}
            <div className="flex items-center gap-2">
              <SchoolLogo variant="dark" size="sm" showSubtitle={false} />
            </div>

            {/* Active Child Selector Chip */}
            {children.length > 0 && (
              <button
                onClick={() => setChildSheetOpen(true)}
                className="flex items-center gap-1.5 bg-[#142c47] hover:bg-[#1a385c] border border-blue-500/30 px-2 py-1 rounded-full transition-all group"
                title="Click to switch child"
              >
                <div className="relative">
                  <img
                    src={activeChild.avatar_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200'}
                    alt={activeChild.full_name}
                    className="w-6 h-6 rounded-full object-cover ring-1.5 ring-blue-400"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border-2 border-[#0e2238] rounded-full"></span>
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-bold text-white truncate max-w-[85px] leading-tight">
                    {activeChild.full_name}
                  </p>
                  <p className="text-[9px] text-blue-300 font-medium leading-none">
                    {activeChild.class_name}
                  </p>
                </div>
                {children.length > 1 && (
                  <ChevronDown className="w-3 h-3 text-blue-300 group-hover:translate-y-0.5 transition-transform" />
                )}
              </button>
            )}

            {/* Action Icons: Notification Bell & Profile Dropdown */}
            <div className="flex items-center gap-1.5">
              <NotificationBell isDark={true} />

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-[10px] flex items-center justify-center border border-blue-400/50 shadow-xs"
                  title="Account Menu"
                >
                  {parentName.slice(0, 2).toUpperCase()}
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-52 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-2 border-b border-slate-100">
                        <p className="text-[10px] text-slate-400 font-medium">Logged in as</p>
                        <p className="text-xs font-bold text-slate-900 truncate">{parentName}</p>
                        <span className="inline-block text-[9px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md mt-0.5">
                          Parent Portal
                        </span>
                      </div>

                      <div className="px-1.5 py-1 border-b border-slate-100">
                        <button
                          onClick={async () => {
                            setUserMenuOpen(false);
                            await quickLogin('PRINCIPAL_ADMIN');
                            navigate('/admin/dashboard');
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl flex items-center justify-between"
                        >
                          <span className="flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Switch to Principal</span>
                          </span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </button>
                      </div>

                      <div className="px-1.5 pt-1">
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            handleLogout();
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Children Quick Switch Strip (If multiple children exist) */}
          {children.length > 1 && (
            <div className="bg-[#0a1b2d] border-t border-slate-800/80 px-2.5 py-1">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0 flex items-center gap-1 pl-1">
                  <Users className="w-2.5 h-2.5 text-blue-400" />
                  <span>Children:</span>
                </span>
                {children.map(c => {
                  const isSelected = String(c.id) === String(activeChildId);
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleSelectChild(c)}
                      className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all flex-shrink-0 ${
                        isSelected
                          ? 'bg-[#1a73e8] text-white shadow-xs'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>{c.full_name}</span>
                      <span className={`text-[9px] font-normal px-1 rounded-sm ${isSelected ? 'bg-white/20' : 'bg-slate-900/60 text-slate-400'}`}>
                        {c.class_name || 'Class'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </header>

        {/* ============================================================== */}
        {/* 2. MAIN SCROLLABLE MOBILE CONTENT CONTAINER                    */}
        {/* ============================================================== */}
        <main className="flex-1 overflow-y-auto px-3.5 py-3.5 pb-24 scrollbar-none">
          <Outlet />

          {/* School Footnote */}
          <div className="mt-8 mb-2 text-center text-slate-400">
            <p className="text-[10px] font-semibold">Highlight Model School • Saraghundi Thall</p>
            <p className="text-[9px]">Better Learning | Brighter Future</p>
          </div>
        </main>

        {/* ============================================================== */}
        {/* 3. PINNED MOBILE APP BOTTOM NAVIGATION BAR                     */}
        {/* ============================================================== */}
        <nav className="fixed bottom-0 w-full max-w-[430px] z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-around py-1.5 px-1">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  className={({ isActive }) =>
                    `relative flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 group flex-1 ${
                      isActive
                        ? `${tab.activeColor} font-bold scale-105`
                        : 'text-slate-500 hover:text-slate-800 font-medium'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Active Indicator Top Pill */}
                      {isActive && (
                        <span className="absolute -top-1.5 w-6 h-0.5 bg-[#1a73e8] rounded-full shadow-xs"></span>
                      )}

                      {/* Icon Container */}
                      <div
                        className={`relative p-1 rounded-lg transition-all ${
                          isActive
                            ? 'bg-blue-50 text-[#1a73e8] ring-1 ring-blue-200'
                            : 'group-hover:bg-slate-100 text-slate-500'
                        }`}
                      >
                        <Icon className="w-5 h-5 transition-transform group-active:scale-90" />
                        {tab.badge && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-xs">
                            {tab.badge}
                          </span>
                        )}
                      </div>

                      {/* English Only Navigation Label */}
                      <span className="text-[10px] block font-bold leading-tight mt-0.5">
                        {tab.label}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* ============================================================== */}
        {/* 4. CHILD SELECTOR SHEET                                        */}
        {/* ============================================================== */}
        {childSheetOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div
              className="fixed inset-0"
              onClick={() => setChildSheetOpen(false)}
            />
            <div className="relative bg-white w-full max-w-[430px] rounded-t-3xl shadow-2xl border-t border-slate-200 overflow-hidden z-10 animate-in slide-in-from-bottom duration-250">
              <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1"></div>

              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Select Child</span>
                  </h3>
                </div>
                <button
                  onClick={() => setChildSheetOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 space-y-2 max-h-[50vh] overflow-y-auto">
                {children.map((c) => {
                  const isSelected = String(c.id) === String(activeChildId);
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleSelectChild(c)}
                      className={`w-full p-2.5 rounded-2xl flex items-center justify-between text-left transition-all ${
                        isSelected
                          ? 'bg-blue-50 border-2 border-blue-500 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 border border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={c.avatar_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200'}
                          alt={c.full_name}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-xs"
                        />
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs">
                            {c.full_name}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {c.class_name} • Roll: {c.roll_number}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={() => setChildSheetOpen(false)}
                  className="w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
