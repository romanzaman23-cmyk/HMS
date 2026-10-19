import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserX,
  CalendarDays,
  PlusCircle,
  Upload,
  Megaphone,
  GraduationCap,
  ExternalLink,
  ChevronRight,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import api from '../../services/api';
import ZKTecoDeviceGraphic from '../../components/ZKTecoDeviceGraphic';

export default function AdminDashboard() {
  const [summary, setSummary] = useState({
    totalStudents: 248,
    presentToday: 212,
    absentToday: 36,
    attendanceRate: 85,
    absentRate: 15,
    totalLeaves: 5,
    pendingLeaves: 2,
    newThisWeek: 2
  });
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [device, setDevice] = useState({
    device_name: 'ZKTeco F18',
    location: 'Main Gate',
    connection_status: 'Connected'
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [sumRes, attRes, devRes] = await Promise.allSettled([
          api.get('/attendance/summary'),
          api.get('/attendance?limit=5'),
          api.get('/devices')
        ]);

        if (sumRes.status === 'fulfilled' && sumRes.value.data.success) {
          setSummary(sumRes.value.data.summary);
        }
        if (attRes.status === 'fulfilled' && attRes.value.data.success) {
          setRecentAttendance(attRes.value.data.records.slice(0, 5));
        }
        if (devRes.status === 'fulfilled' && devRes.value.data.success) {
          setDevice(devRes.value.data.device);
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const isConnected = device?.connection_status === 'Connected';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Top 4 Stat Cards - Exact layout and styling from screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Students */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Students
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {summary.totalStudents}
            </span>
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <span>•</span> {summary.newThisWeek} new this week
          </p>
        </div>

        {/* Card 2: Present Today */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Present Today
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {summary.presentToday}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal mt-1">
            {summary.attendanceRate}% attendance
          </p>
        </div>

        {/* Card 3: Absent Today */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
              <UserX className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Absent Today
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {summary.absentToday}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal mt-1">
            {summary.absentRate}% absent
          </p>
        </div>

        {/* Card 4: Leave Requests */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Leave Requests
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {summary.totalLeaves}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal mt-1">
            {summary.pendingLeaves} pending
          </p>
        </div>
      </div>

      {/* 2. Middle Row: Recent Attendance (Left) + Fingerprint & Quick Actions (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recent Attendance Table (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-slate-900">
              Recent Attendance
            </h2>
            <Link
              to="/admin/attendance"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Student Name</th>
                  <th className="pb-3 font-semibold">Class</th>
                  <th className="pb-3 font-semibold">Time</th>
                  <th className="pb-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {recentAttendance.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-slate-400 text-xs">
                      No attendance scans today
                    </td>
                  </tr>
                ) : (
                  recentAttendance.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 font-medium text-slate-900">
                        {row.student_name}
                      </td>
                      <td className="py-3.5 text-slate-600 text-xs">
                        {row.class_name}
                      </td>
                      <td className="py-3.5 text-slate-500 text-xs font-mono">
                        {row.check_in_time}
                      </td>
                      <td className="py-3.5 text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            row.status === 'Present'
                              ? 'bg-emerald-100/70 text-emerald-700'
                              : 'bg-rose-100/70 text-rose-700'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Fingerprint Device (Top) + Quick Actions (Bottom) (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Fingerprint Device Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">
                Fingerprint Device
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  isConnected
                    ? 'bg-emerald-100/80 text-emerald-700'
                    : 'bg-rose-100/80 text-rose-700'
                }`}
              >
                {isConnected ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Connected
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    Disconnected
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center gap-5 my-3">
              <div className="w-20 h-28 flex-shrink-0 bg-slate-900 rounded-2xl p-1 flex items-center justify-center shadow-inner">
                <ZKTecoDeviceGraphic isConnected={isConnected} className="w-16 h-24" />
              </div>

              <div className="space-y-1.5">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Device Name</p>
                  <p className="text-sm font-bold text-slate-800">{device.device_name || 'ZKTeco F18'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Location</p>
                  <p className="text-sm font-semibold text-slate-700">{device.location || 'Main Gate'}</p>
                </div>
              </div>
            </div>

            <Link
              to="/admin/devices"
              className="mt-4 w-full py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100/80 text-[#1a73e8] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              Manage Device <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4">
              Quick Actions
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/admin/students?action=new"
                className="p-3.5 rounded-xl border border-slate-200/90 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex items-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">
                  Add Student
                </span>
              </Link>

              <Link
                to="/admin/documents?action=upload"
                className="p-3.5 rounded-xl border border-slate-200/90 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex items-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">
                  Upload Document
                </span>
              </Link>

              <Link
                to="/admin/announcements?action=new"
                className="p-3.5 rounded-xl border border-slate-200/90 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex items-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Megaphone className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">
                  Create Announcement
                </span>
              </Link>

              <Link
                to="/admin/results?action=new"
                className="p-3.5 rounded-xl border border-slate-200/90 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex items-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">
                  Add Result
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
