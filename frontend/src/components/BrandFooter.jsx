import React from 'react';
import SchoolLogo from './SchoolLogo';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function BrandFooter() {
  const { user, quickLogin } = useAuth();
  const navigate = useNavigate();

  const handleSwitchPortal = async (targetRole) => {
    try {
      await quickLogin(targetRole);
      if (targetRole === 'PRINCIPAL_ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/parent/dashboard');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <footer className="w-full bg-[#0a1b2d] text-white border-t border-slate-800 py-4 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4 mt-auto">
      {/* Left: School Logo */}
      <div className="flex items-center gap-4">
        <SchoolLogo variant="dark" />
      </div>

      {/* Center: Official School Motto from reference image */}
      <div className="text-center">
        <p className="text-sm font-medium tracking-wide text-blue-200">
          Better Learning <span className="mx-2 text-slate-500">|</span> Brighter Future
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          © {new Date().getFullYear()} Highlight Model School. All Rights Reserved.
        </p>
      </div>

      {/* Right: Quick Portal Switcher (Extremely convenient for reviewing both portals) */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-400 hidden lg:inline">Switch Portal:</span>
        <button
          onClick={() => handleSwitchPortal('PRINCIPAL_ADMIN')}
          className={`px-3 py-1.5 rounded-lg transition-all font-medium ${
            user?.role === 'PRINCIPAL_ADMIN'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Principal / Admin
        </button>
        <button
          onClick={() => handleSwitchPortal('PARENT')}
          className={`px-3 py-1.5 rounded-lg transition-all font-medium ${
            user?.role === 'PARENT'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Parent Portal
        </button>
      </div>
    </footer>
  );
}
