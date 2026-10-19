import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Sliders,
  FileText,
  Fingerprint,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Server,
  MessageCircle,
  ExternalLink,
  Send,
  Link as LinkIcon,
  Check,
  LogIn,
  LogOut,
  Smartphone,
  Download
} from 'lucide-react';
import api from '../../services/api';
import ZKTecoDeviceGraphic from '../../components/ZKTecoDeviceGraphic';

export default function AdminDevice() {
  const [device, setDevice] = useState({
    id: 1,
    device_name: 'ZKTeco F18',
    ip_address: '192.168.1.201',
    port: 4370,
    device_uid: '123456',
    location: 'Main Gate',
    connection_status: 'Connected',
    last_sync_time: null
  });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Modals
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [configForm, setConfigForm] = useState({
    device_name: 'ZKTeco F18',
    ip_address: '192.168.1.201',
    port: 4370,
    location: 'Main Gate',
    device_uid: '123456'
  });

  // Biometric Punch Simulator
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [punchMode, setPunchMode] = useState('Auto'); // 'Auto' | 'CheckIn' | 'CheckOut'
  const [isScanningAnimation, setIsScanningAnimation] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // WhatsApp Gateway Integration State
  const [waConfig, setWaConfig] = useState({
    gatewayUrl: '',
    token: '',
    instanceId: '',
    autoSend: true,
    senderPhone: '+92 300 1234567'
  });
  const [waSaving, setWaSaving] = useState(false);
  const [waTestPhone, setWaTestPhone] = useState('03038262123');
  const [waTestMessage, setWaTestMessage] = useState('🏫 Highlight Model School: Automated WhatsApp Alert Connection Test Successful! ✅');
  const [waTesting, setWaTesting] = useState(false);
  const [waTestResult, setWaTestResult] = useState(null);
  const [waLogs, setWaLogs] = useState([]);

  const fetchDeviceData = async () => {
    try {
      const [devRes, logRes, stuRes, waRes, waLogsRes] = await Promise.allSettled([
        api.get('/devices'),
        api.get('/devices/logs?limit=25'),
        api.get('/students'),
        api.get('/devices/whatsapp-config'),
        api.get('/devices/whatsapp-logs?limit=10')
      ]);

      if (devRes.status === 'fulfilled' && devRes.value.data.success) {
        setDevice(devRes.value.data.device);
        setConfigForm(devRes.value.data.device);
      }
      if (logRes.status === 'fulfilled' && logRes.value.data.success) {
        setLogs(logRes.value.data.logs || []);
      }
      if (stuRes.status === 'fulfilled' && stuRes.value.data.success) {
        const stuList = stuRes.value.data.students || [];
        setStudents(stuList);
        if (stuList.length > 0 && !selectedStudentId) {
          const romanStudent = stuList.find(s => s.full_name?.toLowerCase().includes('roman'));
          setSelectedStudentId(String(romanStudent ? romanStudent.id : stuList[0].id));
        }
      }
      if (waRes.status === 'fulfilled' && waRes.value.data.success) {
        setWaConfig(waRes.value.data.config || {});
      }
      if (waLogsRes.status === 'fulfilled' && waLogsRes.value.data.success) {
        setWaLogs(waLogsRes.value.data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeviceData();
  }, []);

  const handleConnect = async () => {
    setActionLoading(true);
    setStatusMessage('Attempting TCP socket handshake on port 4370...');
    try {
      const res = await api.post('/devices/connect');
      setStatusMessage(res.data.message);
      fetchDeviceData();
    } catch (err) {
      setStatusMessage(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setActionLoading(true);
    try {
      const res = await api.post('/devices/disconnect');
      setStatusMessage(res.data.message);
      fetchDeviceData();
    } catch (err) {
      setStatusMessage(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleState = async (status) => {
    try {
      await api.post('/devices/toggle-status', { status });
      fetchDeviceData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSync = async () => {
    setActionLoading(true);
    try {
      const res = await api.post('/devices/sync');
      setStatusMessage(res.data.message || 'Synced student biometrics successfully.');
      fetchDeviceData();
    } catch (err) {
      setStatusMessage(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfigSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/devices/settings', configForm);
      setConfigModalOpen(false);
      setStatusMessage('Device configuration saved.');
      fetchDeviceData();
    } catch (err) {
      alert(err.message);
    }
  };

  const [autoOpenChat, setAutoOpenChat] = useState(true);

  // Simulate real attendance punch with Check-in / Check-out support
  const handleTestScan = async (overridePunchType = null) => {
    const finalMode = overridePunchType || punchMode;
    setIsScanningAnimation(true);
    setScanResult(null);
    try {
      const res = await api.post('/devices/punch', {
        student_id: selectedStudentId || (students[0]?.id || 1),
        punch_type: finalMode
      });
      setTimeout(() => {
        setIsScanningAnimation(false);
        if (res.data && res.data.success) {
          setScanResult(res.data);
          fetchDeviceData();

          // Auto open WhatsApp chat if enabled and direct API is not connected
          if (autoOpenChat && res.data.whatsapp?.whatsapp_link && !waConfig.gatewayUrl) {
            window.open(res.data.whatsapp.whatsapp_link, '_blank');
          }
        } else {
          alert(res.data.message || 'Scan failed');
        }
      }, 500);
    } catch (err) {
      setIsScanningAnimation(false);
      alert(err.message);
    }
  };

  // Save WhatsApp Gateway configuration
  const handleSaveWaConfig = async (e) => {
    e.preventDefault();
    setWaSaving(true);
    try {
      const res = await api.post('/devices/whatsapp-config', waConfig);
      if (res.data && res.data.success) {
        setStatusMessage('WhatsApp Gateway configuration saved successfully!');
        setWaConfig(res.data.config);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setWaSaving(false);
    }
  };

  // Send Live Test WhatsApp Message
  const handleTestWhatsApp = async () => {
    setWaTesting(true);
    setWaTestResult(null);
    try {
      const res = await api.post('/devices/whatsapp-test', {
        gatewayUrl: waConfig.gatewayUrl,
        token: waConfig.token,
        instanceId: waConfig.instanceId,
        testPhone: waTestPhone,
        testMessage: waTestMessage
      });
      setWaTestResult(res.data);
      fetchDeviceData();
    } catch (err) {
      setWaTestResult({
        success: false,
        message: err.response?.data?.message || err.message
      });
    } finally {
      setWaTesting(false);
    }
  };

  const handleExportDeviceLogsCSV = () => {
    if (logs.length === 0) return alert('No device logs to export.');
    const headers = ['Log Time', 'Event Type', 'Message', 'Raw Payload'];
    const rows = logs.map(l => [
      `"${l.log_time || ''}"`,
      `"${l.event_type || ''}"`,
      `"${(l.message || '').replace(/"/g, '""')}"`,
      `"${(l.raw_payload || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Device_Communication_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportWhatsAppLogsCSV = () => {
    if (waLogs.length === 0) return alert('No WhatsApp alert logs to export.');
    const headers = ['Timestamp', 'Recipient Phone', 'Student Name', 'Punch Time', 'Alert Type', 'Status', 'Gateway Response'];
    const rows = waLogs.map(w => [
      `"${w.timestamp || ''}"`,
      `"${w.recipient_phone || ''}"`,
      `"${(w.student_name || '').replace(/"/g, '""')}"`,
      `"${w.punch_time || ''}"`,
      `"${w.action_type || ''}"`,
      `"${w.status || ''}"`,
      `"${(w.error_or_response || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `WhatsApp_Alerts_History_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isConnected = device.connection_status === 'Connected';
  const hasGatewayConfigured = Boolean(waConfig.gatewayUrl);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Biometric Device & WhatsApp Automation Setup
          </h2>
          <p className="text-xs text-slate-500">
            ZKTeco TCP/IP hardware management (Port 4370) & Instant WhatsApp Gateway dispatch
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
            hasGatewayConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          }`}>
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{hasGatewayConfigured ? 'WhatsApp Gateway Connected' : 'WhatsApp Ready (wa.me)'}</span>
          </span>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs flex items-center justify-between animate-in fade-in">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage('')} className="font-bold ml-2">✕</button>
        </div>
      )}

      {/* Main Grid: Hardware Device (7 Cols) & Device Controls (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Device Setup & Biometric Punch Simulator (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              <div className="w-24 h-36 bg-slate-900 rounded-2xl p-2 flex items-center justify-center shadow-lg border border-slate-800">
                <ZKTecoDeviceGraphic isConnected={isConnected} isScanning={isScanningAnimation} className="w-20 h-32" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">
                  {device.device_name}
                </h3>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    isConnected
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                    }`}
                  />
                  {device.connection_status}
                </span>
                <p className="text-xs text-slate-500 pt-1">
                  Location: <span className="font-semibold text-slate-700">{device.location}</span>
                </p>
                <p className="text-[11px] text-slate-400 font-mono">
                  UID: {device.device_uid} • Port {device.port}
                </p>
              </div>
            </div>

            {/* Quick Demo Toggle */}
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">State Switch</span>
              <button
                onClick={() => handleToggleState(isConnected ? 'Disconnected' : 'Connected')}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg"
              >
                Set {isConnected ? 'Offline' : 'Online'}
              </button>
            </div>
          </div>

          {/* Connection Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleConnect}
              disabled={actionLoading}
              className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                isConnected
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20'
              }`}
            >
              <Wifi className="w-4 h-4" />
              <span>Connect Device</span>
            </button>

            <button
              onClick={handleDisconnect}
              disabled={actionLoading || !isConnected}
              className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                !isConnected
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20'
              }`}
            >
              <WifiOff className="w-4 h-4" />
              <span>Disconnect</span>
            </button>
          </div>

          {/* Biometric Scan Simulator with Auto Check-in & Check-out */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/50 border border-blue-100/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Live Attendance Scan Simulator
                </h4>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Auto Check-in & Check-out
              </span>
            </div>

            <p className="text-[11px] text-slate-600">
              Select a student to simulate physical fingerprint placement. The system records Check-in or Check-out and immediately fires automated alerts.
            </p>

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Select Student to Scan:
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full py-2 px-3 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
                  >
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.full_name} (Roll: {st.roll_number} - {st.class_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 sm:pt-4">
                  <label className="text-[11px] text-slate-600 font-semibold flex items-center gap-1.5 cursor-pointer bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs">
                    <input
                      type="checkbox"
                      checked={autoOpenChat}
                      onChange={(e) => setAutoOpenChat(e.target.checked)}
                      className="w-3.5 h-3.5 text-emerald-600 rounded"
                    />
                    <span>Auto-Open WhatsApp</span>
                  </label>
                </div>
              </div>

              {/* Explicit Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleTestScan('CheckIn')}
                  disabled={isScanningAnimation}
                  className="py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Punch Check-In (آمد)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTestScan('CheckOut')}
                  disabled={isScanningAnimation}
                  className="py-3 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Punch Check-Out (چھٹی)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTestScan('Auto')}
                  disabled={isScanningAnimation}
                  className="py-3 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <Fingerprint className="w-4 h-4 text-emerald-400" />
                  <span>Auto Smart Punch</span>
                </button>
              </div>
            </div>

            {/* Scan Result Feedback Card */}
            {scanResult && (
              <div className={`mt-3 p-4 rounded-2xl text-xs space-y-2.5 animate-in fade-in border ${
                scanResult.action_type === 'CHECK_OUT'
                  ? 'bg-blue-50/80 border-blue-200 text-blue-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                <div className="flex items-start gap-2.5">
                  {scanResult.action_type === 'CHECK_OUT' ? (
                    <LogOut className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <LogIn className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] ${
                        scanResult.action_type === 'CHECK_OUT'
                          ? 'bg-blue-600 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}>
                        {scanResult.action_label || scanResult.action_type}
                      </span>
                      <p className="font-bold">
                        {scanResult.student?.name} (Roll: {scanResult.student?.roll_number})
                      </p>
                    </div>
                    <p className="mt-1 text-[11px]">
                      {scanResult.notification_sent_to_parent}
                    </p>
                  </div>
                </div>

                {/* Dispatch Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                  <div className="p-2.5 bg-white/90 rounded-xl border border-slate-200 flex items-center gap-2 shadow-2xs">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 text-sm">
                      🔔
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-800">Parent Portal Web Alert</p>
                      <p className="text-[10px] text-slate-500">Delivered in real-time</p>
                    </div>
                  </div>

                  {scanResult.whatsapp && (
                    <div className="p-2.5 bg-white/90 rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                          <MessageCircle className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-slate-800 truncate">WhatsApp Alert</p>
                          <p className="text-[10px] text-emerald-700 truncate font-mono">
                            {scanResult.whatsapp.phone} • {scanResult.whatsapp.status}
                          </p>
                        </div>
                      </div>

                      {scanResult.whatsapp.whatsapp_link && (
                        <a
                          href={scanResult.whatsapp.whatsapp_link}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold inline-flex items-center gap-1 transition-colors flex-shrink-0 shadow-2xs"
                          title="Open WhatsApp message chat"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Settings Actions & Recent Events (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Quick Actions
            </h3>

            {/* Row 1: Sync Students */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-blue-200 transition-all">
              <div>
                <p className="text-xs font-bold text-slate-900">Sync Students</p>
                <p className="text-[11px] text-slate-500">Upload biometric templates</p>
              </div>
              <button
                onClick={handleSync}
                className="px-4 py-1.5 bg-[#1a73e8] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
              >
                Sync
              </button>
            </div>

            {/* Row 2: Device Logs */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-blue-200 transition-all">
              <div>
                <p className="text-xs font-bold text-slate-900">Device Logs</p>
                <p className="text-[11px] text-slate-500">Audit raw TCP communication</p>
              </div>
              <button
                onClick={() => setLogsModalOpen(true)}
                className="px-4 py-1.5 bg-[#1a73e8] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
              >
                View
              </button>
            </div>

            {/* Row 3: Device Configuration */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-blue-200 transition-all">
              <div>
                <p className="text-xs font-bold text-slate-900">Device Hardware Settings</p>
                <p className="text-[11px] text-slate-500">IP address, port, and UID</p>
              </div>
              <button
                onClick={() => setConfigModalOpen(true)}
                className="px-4 py-1.5 bg-[#1a73e8] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
              >
                Configure
              </button>
            </div>
          </div>

          {/* Quick Logs Summary Box */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Recent Device Events
              </h4>
              <span className="text-[11px] text-slate-400">{logs.length} logs</span>
            </div>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {logs.slice(0, 5).map((l) => (
                <div key={l.id} className="p-2.5 rounded-xl bg-slate-50 text-xs border border-slate-100">
                  <div className="flex items-center justify-between font-semibold text-slate-800">
                    <span className="text-[11px] text-blue-600">{l.event_type}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(l.log_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-1 line-clamp-1">{l.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Automated Gateway Connection Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-emerald-500/20">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Automated WhatsApp Gateway Connection
              </h3>
              <p className="text-xs text-slate-500">
                Connect your WhatsApp API or Webhook link so SMS messages are sent directly to parents without manual clicks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              waConfig.gatewayUrl ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
            }`}>
              {waConfig.gatewayUrl ? '● Direct Automated Mode' : '○ Manual Link Mode'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sub-column: Gateway Configuration Form (7 Cols) */}
          <form onSubmit={handleSaveWaConfig} className="lg:col-span-7 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                WhatsApp API Gateway Link / Webhook URL
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="https://api.ultramsg.com/instance1234/messages/chat or your custom webhook"
                  value={waConfig.gatewayUrl || ''}
                  onChange={(e) => setWaConfig({ ...waConfig, gatewayUrl: e.target.value })}
                  className="w-full py-2.5 px-3 pl-9 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Supports UltraMsg, GreenAPI, Evolution API, CallMeBot, or custom webhook. Leave empty for default wa.me mode.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  API Key / Access Token
                </label>
                <input
                  type="password"
                  placeholder="Bearer token or API token"
                  value={waConfig.token || ''}
                  onChange={(e) => setWaConfig({ ...waConfig, token: e.target.value })}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Instance ID / Session ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. instance1234"
                  value={waConfig.instanceId || ''}
                  onChange={(e) => setWaConfig({ ...waConfig, instanceId: e.target.value })}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Instant Auto-Send on Fingerprint Scan
                </p>
                <p className="text-[11px] text-slate-500">
                  Automatically dispatch WhatsApp notification immediately when a child punches at the gate.
                </p>
              </div>
              <input
                type="checkbox"
                checked={waConfig.autoSend !== false}
                onChange={(e) => setWaConfig({ ...waConfig, autoSend: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={waSaving}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{waSaving ? 'Saving...' : 'Save WhatsApp Connection'}</span>
              </button>
            </div>
          </form>

          {/* Right Sub-column: Live Test Dispatch (5 Cols) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-50 to-emerald-50/40 p-5 rounded-2xl border border-emerald-100 space-y-3.5">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Test WhatsApp Connection
              </h4>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Recipient Mobile Number
              </label>
              <input
                type="text"
                value={waTestPhone}
                onChange={(e) => setWaTestPhone(e.target.value)}
                placeholder="03038262123 or +923001234567"
                className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Test Message Text
              </label>
              <textarea
                rows={2}
                value={waTestMessage}
                onChange={(e) => setWaTestMessage(e.target.value)}
                className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
              />
            </div>

            <button
              type="button"
              onClick={handleTestWhatsApp}
              disabled={waTesting}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{waTesting ? 'Dispatching Test Message...' : 'Send Live Test WhatsApp Message'}</span>
            </button>

            {waTestResult && (
              <div className={`p-3 rounded-xl text-xs space-y-1.5 border animate-in fade-in ${
                waTestResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <div className="flex items-center justify-between font-bold">
                  <span>{waTestResult.success ? '✓ Dispatch Sent' : 'Notice'}</span>
                  {waTestResult.preview_link && (
                    <a
                      href={waTestResult.preview_link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-emerald-700 underline font-semibold flex items-center gap-1"
                    >
                      <span>Preview Link</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
                <p className="text-[11px]">{waTestResult.message}</p>
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp Dispatch Activity Logs */}
        {waLogs.length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Recent Automated WhatsApp Dispatches
              </h4>
              <button
                type="button"
                onClick={handleExportWhatsAppLogsCSV}
                className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
                title="Export WhatsApp delivery logs as CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {waLogs.slice(0, 6).map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      log.type === 'CHECK_OUT' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {log.type === 'CHECK_OUT' ? 'Check-Out 🚪' : 'Check-In 🔔'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{log.time}</span>
                  </div>
                  <p className="font-semibold text-slate-800">{log.student_name}</p>
                  <p className="text-[11px] text-slate-500 font-mono truncate">{log.phone_display}</p>
                  <div className="pt-1 flex items-center justify-between text-[10px]">
                    <span className="text-emerald-700 font-bold">{log.status}</span>
                    {log.whatsapp_link && (
                      <a
                        href={log.whatsapp_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-0.5"
                      >
                        <span>Chat</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Device Configuration Modal */}
      {configModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Device Configuration
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Update ZKTeco hardware connection credentials & physical location.
            </p>

            <form onSubmit={handleConfigSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Device Name</label>
                <input
                  type="text"
                  required
                  value={configForm.device_name}
                  onChange={(e) => setConfigForm({ ...configForm, device_name: e.target.value })}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">IP Address</label>
                  <input
                    type="text"
                    required
                    value={configForm.ip_address}
                    onChange={(e) => setConfigForm({ ...configForm, ip_address: e.target.value })}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Port</label>
                  <input
                    type="number"
                    required
                    value={configForm.port}
                    onChange={(e) => setConfigForm({ ...configForm, port: e.target.value })}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Device UID</label>
                  <input
                    type="text"
                    required
                    value={configForm.device_uid}
                    onChange={(e) => setConfigForm({ ...configForm, device_uid: e.target.value })}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={configForm.location}
                    onChange={(e) => setConfigForm({ ...configForm, location: e.target.value })}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setConfigModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#1a73e8] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Device Logs Modal */}
      {logsModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Device Communication Logs
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time connection, sync, and attendance scan audits
                </p>
              </div>
              <button
                onClick={() => setLogsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 py-3 my-2">
              {logs.map((log) => (
                <div key={log.id} className="py-2.5 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-blue-600 uppercase text-[10px]">
                      {log.event_type}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {new Date(log.log_time).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-800 font-medium">{log.message}</p>
                  {log.raw_payload && (
                    <pre className="mt-1 p-2 bg-slate-900 text-emerald-400 rounded-lg text-[10px] overflow-x-auto">
                      {log.raw_payload}
                    </pre>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleExportDeviceLogsCSV}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export Logs (CSV)</span>
              </button>
              <button
                onClick={() => setLogsModalOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
