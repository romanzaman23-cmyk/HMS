import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import ParentLayout from './layouts/ParentLayout';

// Auth
import LoginPage from './pages/LoginPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAttendance from './pages/admin/AdminAttendance';
import AdminStudents from './pages/admin/AdminStudents';
import AdminApprovals from './pages/admin/AdminApprovals';
import AdminTimetable from './pages/admin/AdminTimetable';
import AdminDevice from './pages/admin/AdminDevice';
import AdminLeaves from './pages/admin/AdminLeaves';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminResults from './pages/admin/AdminResults';
import AdminDocuments from './pages/admin/AdminDocuments';
import AdminDocumentGenerator from './pages/admin/AdminDocumentGenerator';
import AdminSettings from './pages/admin/AdminSettings';

// Parent Pages
import ParentDashboard from './pages/parent/ParentDashboard';
import ParentAttendance from './pages/parent/ParentAttendance';
import ParentAnnouncements from './pages/parent/ParentAnnouncements';
import ParentResults from './pages/parent/ParentResults';
import ParentLeaves from './pages/parent/ParentLeaves';
import ParentDocuments from './pages/parent/ParentDocuments';

function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Highlight Model School...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // If Admin trying to access parent route or vice versa, redirect to their home
    return user.role === 'PRINCIPAL_ADMIN'
      ? <Navigate to="/admin/dashboard" replace />
      : <Navigate to="/parent/dashboard" replace />;
  }

  return children;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'PRINCIPAL_ADMIN'
    ? <Navigate to="/admin/dashboard" replace />
    : <Navigate to="/parent/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Principal / Admin Portal */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRole="PRINCIPAL_ADMIN">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="attendance" element={<AdminAttendance />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="approvals" element={<AdminApprovals />} />
            <Route path="timetable" element={<AdminTimetable />} />
            <Route path="devices" element={<AdminDevice />} />
            <Route path="leave-management" element={<AdminLeaves />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="results" element={<AdminResults />} />
            <Route path="documents" element={<AdminDocuments />} />
            <Route path="generate-documents" element={<AdminDocumentGenerator />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Parent Portal */}
          <Route
            path="/parent"
            element={
              <ProtectedRoute allowedRole="PARENT">
                <ParentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/parent/dashboard" replace />} />
            <Route path="dashboard" element={<ParentDashboard />} />
            <Route path="attendance" element={<ParentAttendance />} />
            <Route path="announcements" element={<ParentAnnouncements />} />
            <Route path="results" element={<ParentResults />} />
            <Route path="leave-request" element={<ParentLeaves />} />
            <Route path="documents" element={<ParentDocuments />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
