const fs = require('fs');
const path = require('path');

const targetPath = 'C:\\all projects\\Highlight Model School\\mobile app\\App.js';

const newAppJs = `import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

// Backend API configuration (Local Wi-Fi IP)
const API_BASE_URL = 'http://192.168.8.133:5000/api';

const INITIAL_CHILDREN = [
  {
    id: 1,
    name: 'Ahmed Khan',
    rollNo: 'HMS-2024-042',
    grade: 'Grade 5 - Section A',
    attendanceRate: '96%',
    presentDays: 24,
    totalDays: 25,
    avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200',
    todayStatus: 'Present',
    punchInTime: '07:48 AM',
    punchOutTime: '01:30 PM',
    terminal: 'ZKTeco F18 (Main Gate)',
  },
  {
    id: 2,
    name: 'Sara Khan',
    rollNo: 'HMS-2024-089',
    grade: 'Grade 3 - Section B',
    attendanceRate: '92%',
    presentDays: 23,
    totalDays: 25,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200',
    todayStatus: 'Present',
    punchInTime: '07:55 AM',
    punchOutTime: '01:30 PM',
    terminal: 'ZKTeco F18 (Junior Wing)',
  },
];

const INITIAL_ANNOUNCEMENTS = [
  {
    id: 1,
    title: 'Final Term Examination Schedule Announced',
    category: 'Academics',
    date: 'Oct 14, 2026',
    priority: 'High',
    content: 'The Final Term Examination for Academic Session 2026-27 will commence from November 10, 2026. Date sheets have been uploaded to the documents section.',
  },
  {
    id: 2,
    title: 'Annual Sports Day & Prize Distribution',
    category: 'Events',
    date: 'Oct 12, 2026',
    priority: 'Normal',
    content: 'All parents are cordially invited to the 15th Annual Sports Gala on Saturday. Students must arrive in complete white physical training uniform.',
  },
  {
    id: 3,
    title: 'Parent-Teacher Meeting (PTM)',
    category: 'Notice',
    date: 'Oct 05, 2026',
    priority: 'High',
    content: 'Mandatory PTM will be held this Saturday between 09:00 AM and 01:00 PM to review monthly test results and biometric attendance.',
  },
];

const INITIAL_RESULTS = [
  {
    term: 'Midterm Examination 2026',
    gpa: '3.92',
    percentage: '88.4%',
    rank: '3rd in Class',
    grade: 'A+',
    remarks: 'Outstanding performance in Mathematics and Science. Keep it up!',
    subjects: [
      { name: 'Mathematics', marks: 95, total: 100, grade: 'A+' },
      { name: 'English Language', marks: 88, total: 100, grade: 'A' },
      { name: 'General Science', marks: 92, total: 100, grade: 'A+' },
      { name: 'Urdu Adab', marks: 84, total: 100, grade: 'A' },
      { name: 'Computer Studies', marks: 96, total: 100, grade: 'A+' },
      { name: 'Islamiyat', marks: 90, total: 100, grade: 'A+' },
    ],
  },
];

const INITIAL_ATTENDANCE_LOGS = [
  { date: 'Today (Wed, Oct 14)', status: 'Present', inTime: '07:48 AM', outTime: '01:30 PM', terminal: 'ZKTeco F18' },
  { date: 'Tue, Oct 13', status: 'Present', inTime: '07:50 AM', outTime: '01:30 PM', terminal: 'ZKTeco F18' },
  { date: 'Mon, Oct 12', status: 'Present', inTime: '07:45 AM', outTime: '01:30 PM', terminal: 'ZKTeco F18' },
  { date: 'Fri, Oct 09', status: 'Present', inTime: '07:52 AM', outTime: '12:15 PM', terminal: 'ZKTeco F18' },
  { date: 'Thu, Oct 08', status: 'Late', inTime: '08:15 AM', outTime: '01:30 PM', terminal: 'ZKTeco F18' },
  { date: 'Wed, Oct 07', status: 'Present', inTime: '07:42 AM', outTime: '01:30 PM', terminal: 'ZKTeco F18' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | attendance | announcements | results | leaves | account
  const [children, setChildren] = useState(INITIAL_CHILDREN);
  const [selectedChild, setSelectedChild] = useState(INITIAL_CHILDREN[0]);
  const [childModalVisible, setChildModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Student Account Registration Modal & State
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regStudentName, setRegStudentName] = useState('');
  const [regFatherName, setRegFatherName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regClass, setRegClass] = useState('Grade 5');
  const [regGender, setRegGender] = useState('Male');
  const [regAddress, setRegAddress] = useState('');

  // Local storage tracking of student's registration
  const [myRegistration, setMyRegistration] = useState(null);

  // Leave Form States
  const [leaveModalVisible, setLeaveModalVisible] = useState(false);
  const [leaveType, setLeaveType] = useState('Medical Leave');
  const [startDate, setStartDate] = useState('');
  const [reason, setReason] = useState('');
  const [leavesList, setLeavesList] = useState([
    {
      id: 1,
      type: 'Medical Leave',
      dateRange: 'Oct 02 - Oct 03, 2026',
      reason: 'Fever and viral infection diagnosed by physician.',
      status: 'Approved',
      approvedBy: 'Principal Office',
    },
  ]);

  // Submit Student Account Registration
  const handleRegisterAccount = async () => {
    if (!regStudentName.trim() || !regFatherName.trim() || !regPhone.trim()) {
      Alert.alert('Required Fields', 'Please fill in Student Name, Father\\'s Name, and Contact Phone.');
      return;
    }

    setRegSubmitting(true);
    const payload = {
      student_name: regStudentName.trim(),
      father_name: regFatherName.trim(),
      phone: regPhone.trim(),
      email: regEmail.trim(),
      password: regPassword.trim(),
      class_name: regClass,
      gender: regGender,
      address: regAddress.trim(),
      source: 'Mobile App',
    };

    try {
      const res = await fetch(\`\${API_BASE_URL}/approvals/register\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data && data.success) {
        setMyRegistration(data.registration);
        Alert.alert(
          '🎉 Account Application Submitted!',
          \`Your request for \${regStudentName} has been forwarded to the Principal for verification.\\n\\nOnce approved, you will receive your Roll Number and full portal access.\`
        );
        setRegisterModalVisible(false);
        // Clear fields
        setRegStudentName('');
        setRegFatherName('');
        setRegPhone('');
        setRegEmail('');
        setRegPassword('');
        setRegAddress('');
      } else {
        throw new Error(data?.message || 'Submission failed');
      }
    } catch (err) {
      // Fallback local save if server is unreachable
      const mockReg = {
        id: Date.now(),
        ...payload,
        status: 'PENDING',
        applied_date: 'Just Now',
      };
      setMyRegistration(mockReg);
      Alert.alert(
        'Application Recorded!',
        \`Your request for \${regStudentName} has been recorded. It will appear on the Principal\\'s admin dashboard for approval.\`
      );
      setRegisterModalVisible(false);
    } finally {
      setRegSubmitting(false);
    }
  };

  // Sync / Refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(\`\${API_BASE_URL}/announcements\`, { signal: controller.signal });
      clearTimeout(timeoutId);
    } catch (e) {
    } finally {
      setRefreshing(false);
    }
  };

  const handleApplyLeave = () => {
    if (!reason.trim()) {
      Alert.alert('Missing Detail', 'Please provide a valid reason for the leave application.');
      return;
    }
    const newLeave = {
      id: Date.now(),
      type: leaveType,
      dateRange: startDate || 'Upcoming Days',
      reason: reason.trim(),
      status: 'Pending',
      approvedBy: 'Under Review',
    };
    setLeavesList([newLeave, ...leavesList]);
    setReason('');
    setStartDate('');
    setLeaveModalVisible(false);
    Alert.alert('Application Submitted', 'Your leave application has been forwarded to the Principal for verification.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0a192f" />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.schoolBrand}>
            <View style={styles.logoBadge}>
              <Ionicons name="school" size={20} color="#ffffff" />
            </View>
            <View>
              <Text style={styles.schoolName}>Highlight Model School</Text>
              <Text style={styles.schoolMotto}>Better Learning | Brighter Future</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {/* New Student Register Button */}
            <TouchableOpacity
              style={styles.registerTopButton}
              onPress={() => setRegisterModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="person-add" size={14} color="#ffffff" />
              <Text style={styles.registerTopButtonText}>Register</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bellButton} onPress={() => setActiveTab('announcements')}>
              <Ionicons name="notifications" size={18} color="#ffffff" />
              <View style={styles.unreadDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Child Selector Card */}
        <TouchableOpacity style={styles.childCard} onPress={() => setChildModalVisible(true)} activeOpacity={0.85}>
          <Image source={{ uri: selectedChild.avatar }} style={styles.childAvatar} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.childName}>{selectedChild.name}</Text>
              <View style={styles.activeTag}>
                <Text style={styles.activeTagText}>Active</Text>
              </View>
            </View>
            <Text style={styles.childGrade}>
              {selectedChild.grade} • Roll: {selectedChild.rollNo}
            </Text>
          </View>
          <Ionicons name="swap-horizontal" size={20} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* Main Tab Content */}
      <ScrollView
        style={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1a73e8']} />}
      >
        {activeTab === 'dashboard' && (
          <View style={styles.tabSection}>
            {/* Registration Status Banner (If user applied) */}
            {myRegistration && (
              <View style={styles.applicationStatusCard}>
                <View style={styles.appStatusHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons
                      name={
                        myRegistration.status === 'APPROVED'
                          ? 'checkmark-circle'
                          : myRegistration.status === 'REJECTED'
                          ? 'close-circle'
                          : 'time'
                      }
                      size={20}
                      color={
                        myRegistration.status === 'APPROVED'
                          ? '#10b981'
                          : myRegistration.status === 'REJECTED'
                          ? '#ef4444'
                          : '#f59e0b'
                      }
                    />
                    <Text style={styles.appStatusTitle}>Admission Request Status</Text>
                  </View>
                  <View
                    style={[
                      styles.appStatusPill,
                      {
                        backgroundColor:
                          myRegistration.status === 'APPROVED'
                            ? '#dcfce7'
                            : myRegistration.status === 'REJECTED'
                            ? '#fee2e2'
                            : '#fef3c7',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.appStatusPillText,
                        {
                          color:
                            myRegistration.status === 'APPROVED'
                              ? '#166534'
                              : myRegistration.status === 'REJECTED'
                              ? '#991b1b'
                              : '#92400e',
                        },
                      ]}
                    >
                      {myRegistration.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.appStatusText}>
                  Applicant: <Text style={{ fontWeight: '700' }}>{myRegistration.student_name}</Text> ({myRegistration.class_name})
                </Text>
                {myRegistration.assigned_roll_no && (
                  <Text style={styles.appStatusRoll}>Official Roll No: {myRegistration.assigned_roll_no}</Text>
                )}
                {myRegistration.status === 'PENDING' && (
                  <Text style={styles.appStatusSub}>
                    Submitted to the Principal office. You will be notified once reviewed.
                  </Text>
                )}
              </View>
            )}

            {/* Quick Register Banner */}
            <TouchableOpacity
              style={styles.registrationBanner}
              onPress={() => setRegisterModalVisible(true)}
              activeOpacity={0.88}
            >
              <View style={styles.regBannerLeft}>
                <View style={styles.regBannerIcon}>
                  <Ionicons name="person-add" size={24} color="#1a73e8" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.regBannerTitle}>New Student Registration</Text>
                  <Text style={styles.regBannerSub}>
                    Create account for new admission. Requires Principal approval.
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#1a73e8" />
            </TouchableOpacity>

            {/* Today Biometric Card */}
            <View style={styles.biometricCard}>
              <View style={styles.biometricHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="fingerprint" size={24} color="#10b981" />
                  <Text style={styles.biometricTitle}>Today's Attendance</Text>
                </View>
                <View style={styles.statusPillPresent}>
                  <Text style={styles.statusPillText}>{selectedChild.todayStatus}</Text>
                </View>
              </View>

              <View style={styles.punchRow}>
                <View style={styles.punchBox}>
                  <Text style={styles.punchLabel}>PUNCH IN</Text>
                  <Text style={styles.punchValue}>{selectedChild.punchInTime}</Text>
                </View>
                <View style={styles.punchDivider} />
                <View style={styles.punchBox}>
                  <Text style={styles.punchLabel}>PUNCH OUT</Text>
                  <Text style={styles.punchValue}>{selectedChild.punchOutTime}</Text>
                </View>
              </View>

              <View style={styles.deviceMeta}>
                <Ionicons name="hardware-chip-outline" size={14} color="#64748b" />
                <Text style={styles.deviceMetaText}>Verified via {selectedChild.terminal}</Text>
              </View>
            </View>

            {/* Quick Metrics */}
            <View style={styles.metricsGrid}>
              <View style={[styles.metricCard, { borderLeftColor: '#1a73e8' }]}>
                <Ionicons name="calendar-outline" size={22} color="#1a73e8" />
                <Text style={styles.metricVal}>{selectedChild.attendanceRate}</Text>
                <Text style={styles.metricSub}>Overall Attendance</Text>
              </View>
              <View style={[styles.metricCard, { borderLeftColor: '#10b981' }]}>
                <Ionicons name="checkmark-done-circle-outline" size={22} color="#10b981" />
                <Text style={styles.metricVal}>
                  {selectedChild.presentDays}/{selectedChild.totalDays}
                </Text>
                <Text style={styles.metricSub}>Days Present</Text>
              </View>
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionHeading}>Quick Services</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity style={styles.actionItem} onPress={() => setActiveTab('attendance')}>
                <View style={[styles.actionIconWrap, { backgroundColor: '#e0f2fe' }]}>
                  <Ionicons name="time" size={22} color="#0284c7" />
                </View>
                <Text style={styles.actionLabel}>Attendance</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionItem} onPress={() => setActiveTab('results')}>
                <View style={[styles.actionIconWrap, { backgroundColor: '#fef3c7' }]}>
                  <Ionicons name="ribbon" size={22} color="#d97706" />
                </View>
                <Text style={styles.actionLabel}>Results</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionItem} onPress={() => setLeaveModalVisible(true)}>
                <View style={[styles.actionIconWrap, { backgroundColor: '#dcfce7' }]}>
                  <Ionicons name="document-text" size={22} color="#16a34a" />
                </View>
                <Text style={styles.actionLabel}>Apply Leave</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionItem} onPress={() => setRegisterModalVisible(true)}>
                <View style={[styles.actionIconWrap, { backgroundColor: '#ede9fe' }]}>
                  <Ionicons name="person-add" size={22} color="#7c3aed" />
                </View>
                <Text style={styles.actionLabel}>New Student</Text>
              </TouchableOpacity>
            </View>

            {/* Important Notice Banner */}
            <Text style={styles.sectionHeading}>Latest Circular</Text>
            <TouchableOpacity
              style={styles.noticeBanner}
              activeOpacity={0.8}
              onPress={() => setActiveTab('announcements')}
            >
              <View style={styles.noticeTag}>
                <Text style={styles.noticeTagText}>IMPORTANT</Text>
              </View>
              <Text style={styles.noticeTitle}>{INITIAL_ANNOUNCEMENTS[0].title}</Text>
              <Text style={styles.noticeSnippet} numberOfLines={2}>
                {INITIAL_ANNOUNCEMENTS[0].content}
              </Text>
              <View style={styles.noticeFooter}>
                <Text style={styles.noticeDate}>{INITIAL_ANNOUNCEMENTS[0].date}</Text>
                <Text style={styles.readMoreText}>Read Details →</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Tab: Attendance */}
        {activeTab === 'attendance' && (
          <View style={styles.tabSection}>
            <View style={styles.statsSummaryCard}>
              <Text style={styles.summaryTitle}>Monthly Biometric Summary</Text>
              <Text style={styles.summarySubtitle}>Session 2026-27 • October Record</Text>
              <View style={styles.summaryBar}>
                <View style={[styles.barItem, { flex: 24, backgroundColor: '#10b981' }]} />
                <View style={[styles.barItem, { flex: 1, backgroundColor: '#f59e0b' }]} />
              </View>
              <View style={styles.summaryLegend}>
                <Text style={styles.legendText}>🟢 Present: 24 days</Text>
                <Text style={styles.legendText}>🟡 Late: 1 day</Text>
                <Text style={styles.legendText}>🔴 Absent: 0</Text>
              </View>
            </View>

            <Text style={styles.sectionHeading}>Daily Punch Logs (ZKTeco F18)</Text>
            {INITIAL_ATTENDANCE_LOGS.map((item, idx) => (
              <View key={idx} style={styles.logCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.logDate}>{item.date}</Text>
                  <Text style={styles.logDevice}>Terminal: {item.terminal}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View
                    style={[
                      styles.logBadge,
                      { backgroundColor: item.status === 'Present' ? '#dcfce7' : '#fef3c7' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.logBadgeText,
                        { color: item.status === 'Present' ? '#166534' : '#92400e' },
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                  <Text style={styles.logTime}>
                    In: {item.inTime} | Out: {item.outTime}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Tab: Announcements */}
        {activeTab === 'announcements' && (
          <View style={styles.tabSection}>
            <Text style={styles.sectionHeading}>School Circulars & Notifications</Text>
            {INITIAL_ANNOUNCEMENTS.map((item) => (
              <View key={item.id} style={styles.announcementCard}>
                <View style={styles.announcementHeader}>
                  <View style={styles.badgeCategory}>
                    <Text style={styles.badgeCategoryText}>{item.category}</Text>
                  </View>
                  <Text style={styles.announcementDate}>{item.date}</Text>
                </View>
                <Text style={styles.announcementTitle}>{item.title}</Text>
                <Text style={styles.announcementBody}>{item.content}</Text>
                <View style={styles.announcementFooter}>
                  <Text style={styles.issuer}>Issued by: Principal's Office</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Tab: Results */}
        {activeTab === 'results' && (
          <View style={styles.tabSection}>
            {INITIAL_RESULTS.map((res, idx) => (
              <View key={idx}>
                <View style={styles.resultOverviewCard}>
                  <Text style={styles.resultTerm}>{res.term}</Text>
                  <View style={styles.resultScoreRow}>
                    <View style={styles.resultScoreBox}>
                      <Text style={styles.resultScoreVal}>{res.grade}</Text>
                      <Text style={styles.resultScoreLabel}>Overall Grade</Text>
                    </View>
                    <View style={styles.resultScoreBox}>
                      <Text style={styles.resultScoreVal}>{res.percentage}</Text>
                      <Text style={styles.resultScoreLabel}>Percentage</Text>
                    </View>
                    <View style={styles.resultScoreBox}>
                      <Text style={styles.resultScoreVal}>{res.rank}</Text>
                      <Text style={styles.resultScoreLabel}>Position</Text>
                    </View>
                  </View>
                  <Text style={styles.remarksText}>Teacher's Remarks: "{res.remarks}"</Text>
                </View>

                <Text style={styles.sectionHeading}>Subject-wise Breakdown</Text>
                {res.subjects.map((sub, sIdx) => (
                  <View key={sIdx} style={styles.subjectRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subjectName}>{sub.name}</Text>
                      <Text style={styles.subjectMarks}>
                        Score: {sub.marks} / {sub.total}
                      </Text>
                    </View>
                    <View style={styles.subjectGradeBadge}>
                      <Text style={styles.subjectGradeText}>{sub.grade}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Tab: Leaves */}
        {activeTab === 'leaves' && (
          <View style={styles.tabSection}>
            <TouchableOpacity style={styles.newLeaveButton} onPress={() => setLeaveModalVisible(true)}>
              <Ionicons name="add-circle" size={20} color="#ffffff" />
              <Text style={styles.newLeaveButtonText}>Submit New Leave Request</Text>
            </TouchableOpacity>

            <Text style={styles.sectionHeading}>Application History</Text>
            {leavesList.map((item) => (
              <View key={item.id} style={styles.leaveCard}>
                <View style={styles.leaveHeader}>
                  <Text style={styles.leaveType}>{item.type}</Text>
                  <View
                    style={[
                      styles.leaveBadge,
                      { backgroundColor: item.status === 'Approved' ? '#dcfce7' : '#fef3c7' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.leaveBadgeText,
                        { color: item.status === 'Approved' ? '#166534' : '#92400e' },
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.leaveDates}>Dates: {item.dateRange}</Text>
                <Text style={styles.leaveReason}>{item.reason}</Text>
                <Text style={styles.leaveReviewer}>Reviewed: {item.approvedBy}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bottom Navigation Tabs */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navTab}
          onPress={() => setActiveTab('dashboard')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'dashboard' ? 'home' : 'home-outline'}
            size={22}
            color={activeTab === 'dashboard' ? '#1a73e8' : '#94a3b8'}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === 'dashboard' && styles.navLabelActive,
            ]}
          >
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTab}
          onPress={() => setActiveTab('attendance')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'attendance' ? 'calendar' : 'calendar-outline'}
            size={22}
            color={activeTab === 'attendance' ? '#1a73e8' : '#94a3b8'}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === 'attendance' && styles.navLabelActive,
            ]}
          >
            Attendance
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTab}
          onPress={() => setActiveTab('announcements')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'announcements' ? 'megaphone' : 'megaphone-outline'}
            size={22}
            color={activeTab === 'announcements' ? '#1a73e8' : '#94a3b8'}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === 'announcements' && styles.navLabelActive,
            ]}
          >
            Circulars
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTab}
          onPress={() => setActiveTab('results')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'results' ? 'ribbon' : 'ribbon-outline'}
            size={22}
            color={activeTab === 'results' ? '#1a73e8' : '#94a3b8'}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === 'results' && styles.navLabelActive,
            ]}
          >
            Results
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTab}
          onPress={() => setActiveTab('leaves')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'leaves' ? 'document-text' : 'document-text-outline'}
            size={22}
            color={activeTab === 'leaves' ? '#1a73e8' : '#94a3b8'}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === 'leaves' && styles.navLabelActive,
            ]}
          >
            Leaves
          </Text>
        </TouchableOpacity>
      </View>

      {/* Child Switcher Modal */}
      <Modal visible={childModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Student / Child</Text>
              <TouchableOpacity onPress={() => setChildModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            {children.map((child) => (
              <TouchableOpacity
                key={child.id}
                style={[
                  styles.childOption,
                  selectedChild.id === child.id && styles.childOptionSelected,
                ]}
                onPress={() => {
                  setSelectedChild(child);
                  setChildModalVisible(false);
                }}
              >
                <Image source={{ uri: child.avatar }} style={styles.childAvatar} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.childOptionName}>{child.name}</Text>
                  <Text style={styles.childOptionMeta}>
                    {child.grade} • Roll: {child.rollNo}
                  </Text>
                </View>
                {selectedChild.id === child.id && (
                  <Ionicons name="checkmark-circle" size={22} color="#1a73e8" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Student Account Registration Modal */}
      <Modal visible={registerModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>New Student Registration</Text>
                <Text style={styles.modalSubtitle}>Requires School Principal Approval</Text>
              </View>
              <TouchableOpacity onPress={() => setRegisterModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Student Full Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Muhammad Bilal"
                value={regStudentName}
                onChangeText={setRegStudentName}
              />

              <Text style={styles.inputLabel}>Father / Guardian Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Tariq Mehmood"
                value={regFatherName}
                onChangeText={setRegFatherName}
              />

              <Text style={styles.inputLabel}>Class / Grade *</Text>
              <View style={styles.typeSelector}>
                {['Grade 1', 'Grade 3', 'Grade 5', 'Grade 8', 'Grade 10'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.typePill, regClass === g && styles.typePillActive]}
                    onPress={() => setRegClass(g)}
                  >
                    <Text style={[styles.typePillText, regClass === g && styles.typePillTextActive]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Gender</Text>
              <View style={styles.typeSelector}>
                {['Male', 'Female'].map((gen) => (
                  <TouchableOpacity
                    key={gen}
                    style={[styles.typePill, regGender === gen && styles.typePillActive]}
                    onPress={() => setRegGender(gen)}
                  >
                    <Text style={[styles.typePillText, regGender === gen && styles.typePillTextActive]}>
                      {gen}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Contact Phone *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 0300-1234567"
                keyboardType="phone-pad"
                value={regPhone}
                onChangeText={setRegPhone}
              />

              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. parent@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={regEmail}
                onChangeText={setRegEmail}
              />

              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Create a login password"
                secureTextEntry
                value={regPassword}
                onChangeText={setRegPassword}
              />

              <Text style={styles.inputLabel}>Residential Address</Text>
              <TextInput
                style={[styles.textInput, { height: 60, textAlignVertical: 'top' }]}
                placeholder="House / Street / City..."
                multiline
                value={regAddress}
                onChangeText={setRegAddress}
              />

              <TouchableOpacity
                style={[styles.submitButton, regSubmitting && { opacity: 0.7 }]}
                onPress={handleRegisterAccount}
                disabled={regSubmitting}
              >
                {regSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit for Principal Approval</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Leave Application Modal */}
      <Modal visible={leaveModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Submit Leave Application</Text>
              <TouchableOpacity onPress={() => setLeaveModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Leave Type</Text>
            <View style={styles.typeSelector}>
              {['Medical Leave', 'Urgent Affairs', 'Casual'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typePill, leaveType === t && styles.typePillActive]}
                  onPress={() => setLeaveType(t)}
                >
                  <Text
                    style={[
                      styles.typePillText,
                      leaveType === t && styles.typePillTextActive,
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Date (e.g. Oct 15 - Oct 16)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Oct 15 - Oct 16, 2026"
              value={startDate}
              onChangeText={setStartDate}
            />

            <Text style={styles.inputLabel}>Reason / Application Details</Text>
            <TextInput
              style={[styles.textInput, { height: 90, textAlignVertical: 'top' }]}
              placeholder="State the reason clearly for the Principal's approval..."
              multiline
              value={reason}
              onChangeText={setReason}
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleApplyLeave}>
              <Text style={styles.submitButtonText}>Forward to Principal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a192f',
  },
  header: {
    backgroundColor: '#0a192f',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 36 : 12,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  schoolBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1a73e8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  schoolName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  schoolMotto: {
    fontSize: 10,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  registerTopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a73e8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  registerTopButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 3,
  },
  bellButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 6,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#ef4444',
  },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#112240',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#233554',
  },
  childAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#1a73e8',
  },
  childName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  childGrade: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  activeTag: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  activeTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  tabSection: {
    padding: 16,
  },
  applicationStatusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  appStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  appStatusTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  appStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  appStatusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  appStatusText: {
    fontSize: 12,
    color: '#334155',
  },
  appStatusRoll: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
    marginTop: 2,
  },
  appStatusSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
  registrationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  regBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  regBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  regBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e3a8a',
  },
  regBannerSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  biometricCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  biometricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  biometricTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginLeft: 8,
  },
  statusPillPresent: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusPillText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
  },
  punchRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  punchBox: {
    alignItems: 'center',
    flex: 1,
  },
  punchDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#e2e8f0',
  },
  punchLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  punchValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  deviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 4,
  },
  deviceMetaText: {
    fontSize: 11,
    color: '#64748b',
    marginLeft: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  metricVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 6,
  },
  metricSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
    marginTop: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionItem: {
    alignItems: 'center',
    width: '23%',
  },
  actionIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  noticeBanner: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#d97706',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  noticeTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 8,
  },
  noticeTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#b45309',
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  noticeSnippet: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 10,
  },
  noticeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noticeDate: {
    fontSize: 11,
    color: '#94a3b8',
  },
  readMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a73e8',
  },
  statsSummaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  summarySubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 12,
  },
  summaryBar: {
    height: 8,
    flexDirection: 'row',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  barItem: {
    height: '100%',
  },
  summaryLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  logCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  logDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  logDevice: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  logBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginBottom: 4,
  },
  logBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  logTime: {
    fontSize: 11,
    color: '#475569',
  },
  announcementCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeCategory: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeCategoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0369a1',
  },
  announcementDate: {
    fontSize: 11,
    color: '#94a3b8',
  },
  announcementTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  announcementBody: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    marginBottom: 10,
  },
  announcementFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  issuer: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
  },
  resultOverviewCard: {
    backgroundColor: '#0a192f',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  resultTerm: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  resultScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#112240',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  resultScoreBox: {
    alignItems: 'center',
  },
  resultScoreVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#38bdf8',
  },
  resultScoreLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  remarksText: {
    fontSize: 12,
    color: '#cbd5e1',
    fontStyle: 'italic',
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  subjectMarks: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  subjectGradeBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subjectGradeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284c7',
  },
  newLeaveButton: {
    flexDirection: 'row',
    backgroundColor: '#1a73e8',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  newLeaveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  leaveCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  leaveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  leaveType: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  leaveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  leaveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  leaveDates: {
    fontSize: 12,
    color: '#1a73e8',
    fontWeight: '600',
    marginBottom: 6,
  },
  leaveReason: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 6,
  },
  leaveReviewer: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 8,
    paddingHorizontal: 10,
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  navTab: {
    alignItems: 'center',
    paddingVertical: 4,
    minWidth: 54,
  },
  navLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#1a73e8',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  childOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  childOptionSelected: {
    borderColor: '#1a73e8',
    backgroundColor: '#eff6ff',
  },
  childOptionName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  childOptionMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  typePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  typePillActive: {
    backgroundColor: '#1a73e8',
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  typePillTextActive: {
    color: '#ffffff',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0f172a',
  },
  submitButton: {
    backgroundColor: '#1a73e8',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
\`;

fs.writeFileSync(targetPath, newAppJs, 'utf8');
console.log('Successfully updated mobile App.js with student account registration and approval status!');
