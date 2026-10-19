import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Shield,
  Clock,
  Database,
  CheckCircle2,
  UserPlus,
  Users,
  Trash2,
  Mail,
  Phone,
  Eye,
  EyeOff,
  User,
  AlertCircle,
  X,
  Check
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PRESET_PRINCIPAL_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
];

export default function AdminSettings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // School & Timings Settings
  const [settings, setSettings] = useState({
    schoolName: 'Highlight Model School',
    tagline: 'Better Learning | Brighter Future',
    academicYear: '2025-2026',
    defaultPort: 4370,
    schoolStartTime: '08:00',
    schoolEndTime: '14:00',
    lateThreshold: '08:30',
    notificationsEnabled: true
  });

  // Principals List
  const [principals, setPrincipals] = useState([]);

  // Add Principal Modal
  const [addPrincipalModalOpen, setAddPrincipalModalOpen] = useState(false);
  const [principalForm, setPrincipalForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    avatar_url: PRESET_PRINCIPAL_AVATARS[0]
  });
  const [showPassword, setShowPassword] = useState(false);
  const [creatingPrincipal, setCreatingPrincipal] = useState(false);

  // Delete Principal Modal
  const [deletePrincipalModal, setDeletePrincipalModal] = useState(null);
  const [deletingPrincipal, setDeletingPrincipal] = useState(false);
  const [deleteModalError, setDeleteModalError] = useState('');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      if (res.data?.settings) {
        setSettings(prev => ({ ...prev, ...res.data.settings }));
      }
      if (res.data?.principals) {
        setPrincipals(res.data.principals);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    try {
      const res = await api.put('/settings', settings);
      setToastMessage('School settings and biometric shift timings saved successfully.');
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAddPrincipal = () => {
    setPrincipalForm({
      full_name: '',
      email: '',
      password: '',
      phone: '',
      avatar_url: PRESET_PRINCIPAL_AVATARS[0]
    });
    setShowPassword(false);
    setAddPrincipalModalOpen(true);
  };

  const handleCreatePrincipal = async (e) => {
    e.preventDefault();
    setCreatingPrincipal(true);
    try {
      const res = await api.post('/settings/principals', principalForm);
      setToastMessage(`Principal "${principalForm.full_name}" added successfully.`);
      setTimeout(() => setToastMessage(''), 4000);
      setAddPrincipalModalOpen(false);
      fetchSettings();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to add principal.');
    } finally {
      setCreatingPrincipal(false);
    }
  };

  const handleConfirmDeletePrincipal = async () => {
    if (!deletePrincipalModal) return;
    setDeletingPrincipal(true);
    setDeleteModalError('');
    try {
      const res = await api.delete(`/settings/principals/${deletePrincipalModal.id}`);
      const isSelf = res.data?.isSelf;
      const deletedName = deletePrincipalModal.full_name;

      if (isSelf) {
        setToastMessage('Active account deleted. Redirecting to login...');
        setTimeout(() => {
          logout();
          navigate('/login');
        }, 1200);
      } else {
        setPrincipals(prev => prev.filter(p => String(p.id) !== String(deletePrincipalModal.id)));
        setToastMessage(`Principal "${deletedName}" removed successfully.`);
        setTimeout(() => setToastMessage(''), 4000);
        setDeletePrincipalModal(null);
        fetchSettings();
      }
    } catch (err) {
      setDeleteModalError(err.response?.data?.message || err.message || 'Failed to delete principal.');
    } finally {
      setDeletingPrincipal(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          System & School Settings
        </h2>
        <p className="text-xs text-slate-500">
          General preferences, start and end shift hours, and school leadership accounts
        </p>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="text-emerald-700 hover:text-emerald-900 font-bold ml-2">✕</button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="text-rose-700 hover:text-rose-900 font-bold ml-2">✕</button>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* 1. School Identity Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#1a73e8]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">School Identity</h3>
              <p className="text-[11px] text-slate-500">Branding information displayed on parent portal and reports</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">School Name</label>
              <input
                type="text"
                value={settings.schoolName}
                onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Official Motto / Tagline</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        {/* 2. Biometric Attendance Timings (Start Time & End Time) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Biometric Attendance Timings</h3>
              <p className="text-[11px] text-slate-500">Configure daily school start time, dismissal end time, and late thresholds</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
            {/* 1. School Start Time */}
            <div className="p-4 bg-blue-50/50 border border-blue-200/80 rounded-2xl space-y-2">
              <label className="block text-[11px] font-bold text-[#1a73e8] uppercase tracking-wider">
                School Start Time
              </label>
              <input
                type="time"
                required
                value={settings.schoolStartTime}
                onChange={(e) => setSettings({ ...settings, schoolStartTime: e.target.value })}
                className="w-full py-2.5 px-3 bg-white border border-blue-300 rounded-xl text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
              />
              <p className="text-[10px] text-slate-500">Official morning bell / assembly start</p>
            </div>

            {/* 2. School End Time */}
            <div className="p-4 bg-amber-50/50 border border-amber-200/80 rounded-2xl space-y-2">
              <label className="block text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                School End Time
              </label>
              <input
                type="time"
                required
                value={settings.schoolEndTime}
                onChange={(e) => setSettings({ ...settings, schoolEndTime: e.target.value })}
                className="w-full py-2.5 px-3 bg-white border border-amber-300 rounded-xl text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
              />
              <p className="text-[10px] text-slate-500">Official dismissal & departure time</p>
            </div>

            {/* 3. Late Tolerance Threshold */}
            <div className="p-4 bg-rose-50/50 border border-rose-200/80 rounded-2xl space-y-2">
              <label className="block text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                Late Tolerance Threshold
              </label>
              <input
                type="time"
                required
                value={settings.lateThreshold}
                onChange={(e) => setSettings({ ...settings, lateThreshold: e.target.value })}
                className="w-full py-2.5 px-3 bg-white border border-rose-300 rounded-xl text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 shadow-2xs"
              />
              <p className="text-[10px] text-slate-500">Arrivals after this marked Late</p>
            </div>
          </div>
        </div>

        {/* 3. School Leadership & Principals (Requested by User) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">School Principals & Leadership</h3>
                <p className="text-[11px] text-slate-500">Manage administrator logins and register new principals</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenAddPrincipal}
              className="px-3.5 py-2 bg-[#1a73e8] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Add New Principal</span>
            </button>
          </div>

          {/* List of Principals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {principals.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-xs bg-blue-100 flex-shrink-0">
                    <img
                      src={p.avatar_url || PRESET_PRINCIPAL_AVATARS[0]}
                      alt={p.full_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-bold text-slate-900 truncate">{p.full_name}</p>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#1a73e8]">
                        Principal
                      </span>
                      {String(p.id) === String(user?.id) && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 truncate">
                      <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{p.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                      <Phone className="w-3 h-3 flex-shrink-0" />
                      <span>{p.phone || '+1 555-0100'}</span>
                    </div>
                  </div>
                </div>

                {principals.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setDeletePrincipalModal(p)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex-shrink-0"
                    title="Remove Principal Account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 4. MySQL & Hardware Infrastructure */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Infrastructure & Fingerprint Device Protocol</h3>
              <p className="text-[11px] text-slate-500">Relational database and network socket listener status</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1">
            <p>• Database engine: <span className="font-semibold text-slate-800">MySQL / Persistent Synchronized Storage</span></p>
            <p>• Biometric protocol: <span className="font-semibold text-slate-800">ZKTeco TCP/IP Socket (Port: 4370)</span></p>
            <p>• File storage directory: <span className="font-semibold text-slate-800">backend/uploads/</span></p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-7 py-3 bg-[#1a73e8] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <span>Saving Preferences...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save All Preferences</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* MODAL: Register New Principal */}
      {addPrincipalModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-[#1a73e8]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add New Principal</h3>
                  <p className="text-[11px] text-slate-500">Create an administrator account for school leadership</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddPrincipalModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePrincipal} className="space-y-4">
              {/* Avatar Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">
                  Select Profile Avatar
                </label>
                <div className="flex items-center justify-center gap-2.5">
                  {PRESET_PRINCIPAL_AVATARS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPrincipalForm({ ...principalForm, avatar_url: url })}
                      className={`w-11 h-11 rounded-full overflow-hidden border-2 transition-transform hover:scale-105 ${
                        principalForm.avatar_url === url ? 'border-blue-600 scale-110 shadow-sm' : 'border-slate-200'
                      }`}
                    >
                      <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Principal Khalid Khan"
                  value={principalForm.full_name}
                  onChange={(e) => setPrincipalForm({ ...principalForm, full_name: e.target.value })}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Login Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. principal.khalid@highlight.school"
                  value={principalForm.email}
                  onChange={(e) => setPrincipalForm({ ...principalForm, email: e.target.value })}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Login Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Create secure password"
                    value={principalForm.password}
                    onChange={(e) => setPrincipalForm({ ...principalForm, password: e.target.value })}
                    className="w-full py-2.5 pl-3 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (Optional)</label>
                <input
                  type="text"
                  placeholder="+1 555-0199"
                  value={principalForm.phone}
                  onChange={(e) => setPrincipalForm({ ...principalForm, phone: e.target.value })}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddPrincipalModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingPrincipal}
                  className="px-5 py-2.5 bg-[#1a73e8] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {creatingPrincipal ? (
                    <span>Creating Account...</span>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Create Principal Account</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Delete Principal Confirmation */}
      {deletePrincipalModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Remove Principal Account?
            </h3>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Are you sure you want to remove <span className="font-bold text-slate-900">{deletePrincipalModal.full_name}</span> ({deletePrincipalModal.email})?
            </p>

            {String(deletePrincipalModal.id) === String(user?.id) && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium mb-3">
                ⚠️ <strong>Note:</strong> This is your currently logged-in account. Removing it will sign you out.
              </div>
            )}

            {deleteModalError && (
              <div className="p-3 mb-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span>{deleteModalError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deletingPrincipal}
                onClick={() => {
                  setDeletePrincipalModal(null);
                  setDeleteModalError('');
                }}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingPrincipal}
                onClick={handleConfirmDeletePrincipal}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {deletingPrincipal ? 'Removing...' : 'Yes, Remove Principal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
