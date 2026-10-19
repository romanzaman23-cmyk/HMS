import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SchoolLogo from '../components/SchoolLogo';
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@highlight.school');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'PRINCIPAL_ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/parent/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = async (role) => {
    setError('');
    setLoading(true);
    try {
      const user = await quickLogin(role);
      if (user.role === 'PRINCIPAL_ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/parent/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a192f] via-[#0e2238] to-[#172554] flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden">
      {/* Background Transparent Watermark Logo - Clean without colored glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
        <img
          src="/logo-transparent.png"
          alt="Highlight Model School Watermark"
          className="max-h-[82vh] max-w-[85vw] w-auto h-auto opacity-[0.28] object-contain drop-shadow-[0_0_60px_rgba(0,0,0,0.6)] transition-all duration-700"
        />
      </div>

      {/* Top Bar */}
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between relative z-10">
        <SchoolLogo variant="dark" showTagline={true} />
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 text-blue-300 text-xs rounded-full font-medium backdrop-blur-sm">
          <ShieldCheck className="w-3.5 h-3.5" /> Secure Authentication Portal
        </span>
      </div>

      {/* Main Login Form - Zero Background Color Box */}
      <div className="max-w-md w-full mx-auto my-auto py-4 relative z-10">
        <div className="bg-transparent p-4 sm:p-6 relative">
          <div className="text-center mb-7">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
              Sign In to Your Portal
            </h2>
            <p className="text-xs text-blue-400 mt-2 font-semibold uppercase tracking-wider drop-shadow-sm">
              Highlight Model School • Saraghundi Thall
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@highlight.school"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-white placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-white placeholder-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-slate-300" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1a73e8] hover:bg-blue-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-900/40 hover:shadow-blue-900/60 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* 1-Click Fast Demonstration Credentials */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
              One-Click Quick Login
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuick('PRINCIPAL_ADMIN')}
                className="p-3 bg-slate-900/70 hover:bg-slate-800/90 border border-slate-700/80 hover:border-blue-500/50 rounded-2xl text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2 text-blue-400 mb-1">
                  <ShieldCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-white">Principal / Admin</span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">admin@highlight.school</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuick('PARENT')}
                className="p-3 bg-slate-900/70 hover:bg-slate-800/90 border border-slate-700/80 hover:border-sky-500/50 rounded-2xl text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2 text-sky-400 mb-1">
                  <UserCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-white">Parent Portal</span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">parent@highlight.school</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="text-center text-slate-400 text-xs relative z-10">
        Highlight Model School • Better Learning | Brighter Future
      </div>
    </div>
  );
}
