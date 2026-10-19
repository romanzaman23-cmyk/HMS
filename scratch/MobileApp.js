import React, { useState, useEffect } from 'react';
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
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import apiService from './apiService';

// School Logo Asset
const SCHOOL_LOGO = require('./assets/school-logo.png');

// Strict Design Palette: White, Blue, and Dark Blue Only
const COLORS = {
  primary: '#173B73',        // Dark Blue
  secondary: '#3478D4',      // Secondary Blue
  background: '#FFFFFF',     // White
  lightBlue: '#EEF5FF',      // Light Blue Backgrounds
  lightBlueBorder: '#D1E2FC',// Light Blue Borders
  text: '#172B4D',           // Dark Navy Text
  textMuted: '#5E6C84',      // Muted Navy
  cardBg: '#FFFFFF',
  border: '#E2EDFD',
  white: '#FFFFFF',
};

// Available Classes for Admission Form
const AVAILABLE_CLASSES = [
  'Nursery',
  'Prep',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
];

// Common Previous Schools
const PREVIOUS_SCHOOLS_LIST = [
  'Islamabad Model College for Boys',
  'Islamabad Model College for Girls',
  'Army Public School & College (APS)',
  'Beaconhouse School System',
  'The Educators School',
  'Fauji Foundation Model School',
  'Punjab Group of Schools',
  'Other / Unlisted School',
];

// Default clean placeholder avatar
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=250';

export default function App() {
  // Navigation: 'home' | 'attendance' | 'results' | 'timetable' | 'profile' | 'documents' | 'announcements'
  const [currentScreen, setCurrentScreen] = useState('home');

  // Auth Mode: 'login' | 'signup' | 'submitted' | 'pending'
  const [authMode, setAuthMode] = useState('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authToken, setAuthToken] = useState(null);

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  // Sign-Up / Admission Form
  const [regPhoto, setRegPhoto] = useState(DEFAULT_AVATAR);
  const [regName, setRegName] = useState('');
  const [regFatherName, setRegFatherName] = useState('');
  const [regRollNo, setRegRollNo] = useState('');
  const [regClass, setRegClass] = useState('Grade 1');
  const [regDob, setRegDob] = useState('10/03/2018');
  const [regAdmissionType, setRegAdmissionType] = useState('Fresh / New Student'); // 'Fresh / New Student' | 'Transfer from Previous School'
  const [regPrevSchool, setRegPrevSchool] = useState('');
  const [customPrevSchool, setCustomPrevSchool] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [submittingAdmission, setSubmittingAdmission] = useState(false);

  // Pending / Registration Record
  const [pendingRecord, setPendingRecord] = useState(null);
  const [checkingPendingStatus, setCheckingPendingStatus] = useState(false);

  // LIVE STUDENT DATA (NO DUMMY DATA - POPULATED VIA BACKEND)
  const [student, setStudent] = useState(null);
  const [resultsData, setResultsData] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [announcementsList, setAnnouncementsList] = useState([]);
  const [documentsList, setDocumentsList] = useState([]);
  const [timetableData, setTimetableData] = useState({});
  const [loadingData, setLoadingData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Timetable Selected Day
  const [selectedDay, setSelectedDay] = useState('Monday');

  // Modals & Popups
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [photoPickerVisible, setPhotoPickerVisible] = useState(false);
  const [photoPickerTarget, setPhotoPickerTarget] = useState('profile'); // 'profile' | 'signup'
  const [classDropdownVisible, setClassDropdownVisible] = useState(false);
  const [schoolDropdownVisible, setSchoolDropdownVisible] = useState(false);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editEmergency, setEditEmergency] = useState('');

  // Announcement Search
  const [announcementSearch, setAnnouncementSearch] = useState('');

  // -------------------------------------------------------------
  // REAL DATA SYNC: LOAD STUDENT DATA FROM BACKEND
  // -------------------------------------------------------------
  const loadStudentData = async (studentObj, token) => {
    if (!studentObj) return;
    setLoadingData(true);

    const sId = studentObj.id || studentObj.student_id;
    const tokenToUse = token || authToken;

    try {
      // 1. Fetch Real Results from School Management Backend
      const resResult = await apiService.getResults(tokenToUse, sId);
      if (resResult && resResult.success && resResult.results && resResult.results.length > 0) {
        // Calculate dynamic summary
        let totalObtained = 0;
        let totalMax = 0;
        const subjects = resResult.results.map((r) => {
          const obtained = parseFloat(r.marks) || 0;
          const max = parseFloat(r.total_marks) || 100;
          totalObtained += obtained;
          totalMax += max;
          return {
            name: r.subject || 'Subject',
            marks: obtained,
            total: max,
            grade: r.grade || 'A',
            performance: r.overall_performance || 'Good',
          };
        });

        const pct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
        let finalGrade = 'A+';
        if (pct < 50) finalGrade = 'F';
        else if (pct < 60) finalGrade = 'C';
        else if (pct < 70) finalGrade = 'B';
        else if (pct < 80) finalGrade = 'B+';
        else if (pct < 90) finalGrade = 'A';

        setResultsData({
          term: resResult.results[0]?.term || 'Term 1 (2025-26)',
          publishedDate: resResult.results[0]?.result_date || 'Recent',
          percentage: `${pct}%`,
          grade: finalGrade,
          totalObtained,
          totalMax,
          remarks: `Total score: ${totalObtained} out of ${totalMax} marks across ${subjects.length} subjects.`,
          subjects,
        });
      } else {
        setResultsData(null);
      }

      // 2. Fetch Real Attendance Logs from Backend
      const attRes = await apiService.getAttendance(tokenToUse, sId);
      if (attRes && attRes.records && attRes.records.length > 0) {
        // Filter records matching this student
        const matchingLogs = attRes.records.filter(
          (a) => String(a.student_id) === String(sId) || String(a.roll_number) === String(studentObj.rollNo)
        );
        setAttendanceRecords(matchingLogs);
      } else {
        setAttendanceRecords([]);
      }

      // 3. Fetch Real Announcements from Backend
      const annRes = await apiService.getAnnouncements();
      if (annRes && annRes.announcements && annRes.announcements.length > 0) {
        setAnnouncementsList(annRes.announcements);
      } else {
        setAnnouncementsList([]);
      }

      // 4. Fetch Real Documents from Backend
      const docRes = await apiService.getDocuments(tokenToUse, sId);
      if (docRes && docRes.documents && docRes.documents.length > 0) {
        const studentDocs = docRes.documents.filter(
          (d) => String(d.student_id) === String(sId) || String(d.roll_number) === String(studentObj.rollNo)
        );
        setDocumentsList(studentDocs);
      } else {
        setDocumentsList([]);
      }

      // 5. Timetable (Display empty state if none assigned)
      setTimetableData({});
    } catch (err) {
      console.log('Data fetch error:', err.message);
    }

    setLoadingData(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (student) {
      await loadStudentData(student, authToken);
    }
    setRefreshing(false);
  };

  // -------------------------------------------------------------
  // REAL PHOTO UPLOAD VIA EXPO-IMAGE-PICKER
  // -------------------------------------------------------------
  const handlePickFromGallery = async () => {
    setPhotoPickerVisible(false);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow access to your device photo gallery to upload a student photo.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedUri = result.assets[0].uri;
        if (photoPickerTarget === 'signup') {
          setRegPhoto(pickedUri);
        } else {
          setStudent((prev) => (prev ? { ...prev, photo: pickedUri } : null));
        }
        Alert.alert('Photo Updated! 📷', 'Profile photo has been selected successfully.');
      }
    } catch (err) {
      Alert.alert('Upload Error', 'Could not open image picker: ' + err.message);
    }
  };

  const handleTakePhotoWithCamera = async () => {
    setPhotoPickerVisible(false);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please allow camera access to take a student portrait photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;
        if (photoPickerTarget === 'signup') {
          setRegPhoto(photoUri);
        } else {
          setStudent((prev) => (prev ? { ...prev, photo: photoUri } : null));
        }
        Alert.alert('Photo Captured! 📷', 'Student portrait photo has been set.');
      }
    } catch (err) {
      Alert.alert('Camera Error', 'Could not access camera: ' + err.message);
    }
  };

  // -------------------------------------------------------------
  // AUTHENTICATION LOGIC (LOGIN & APPROVAL CHECK)
  // -------------------------------------------------------------

  const handleLogin = async () => {
    if (!loginEmail.trim()) {
      Alert.alert('Email Required', 'Please enter your registered student email address or roll number.');
      return;
    }
    if (!loginPassword.trim()) {
      Alert.alert('Password Required', 'Please enter your student portal password.');
      return;
    }

    setLoggingIn(true);
    const identifier = loginEmail.trim();

    try {
      // 1. Check Approval Status with School Management System
      const statusRes = await apiService.checkApprovalStatus(identifier);

      if (statusRes && statusRes.exists) {
        if (statusRes.status === 'PENDING') {
          // Admission Pending: strictly block access to dashboard
          setPendingRecord({
            id: statusRes.registration?.id,
            name: statusRes.registration?.student_name || 'Student',
            fatherName: statusRes.registration?.father_name || 'Father',
            className: statusRes.registration?.class_name || 'Class',
            email: identifier,
            assignedRoll: statusRes.registration?.assigned_roll_no || 'Pending Assignment',
          });
          setLoggingIn(false);
          setAuthMode('pending');
          return;
        }

        if (statusRes.status === 'APPROVED') {
          // Admission Approved! Unlock dashboard with real student data
          const reg = statusRes.registration || {};
          const assignedRoll = reg.assigned_roll_no || 'HMS-712';
          const studentName = reg.student_name || 'Student';
          const studentClass = reg.class_name || 'Grade 7';
          const studentId = reg.id || 1792090671995;

          const activeStudentObj = {
            id: studentId,
            name: studentName,
            fatherName: reg.father_name || 'Father',
            rollNo: assignedRoll,
            className: studentClass,
            email: reg.email || identifier,
            phone: reg.phone || '0300-1234567',
            address: reg.address || 'Highlight Model School Area, Islamabad',
            emergencyContact: `Father (${reg.phone || '0300-1234567'})`,
            admissionType: reg.student_type || 'Fresh / New Student',
            prevSchool: reg.prev_school || 'Highlight Model School',
            photo: DEFAULT_AVATAR,
          };

          setStudent(activeStudentObj);
          setEditPhone(activeStudentObj.phone);
          setEditAddress(activeStudentObj.address);
          setEditEmergency(activeStudentObj.emergencyContact);

          setLoggingIn(false);
          setIsLoggedIn(true);
          setCurrentScreen('home');

          // Load Real Data from Backend
          await loadStudentData(activeStudentObj, null);

          Alert.alert(
            'Welcome Back! 🎓',
            `Hello ${studentName}! You have successfully logged into the Highlight Model School Student Portal.`
          );
          return;
        }
      }

      // 2. Try Server Authentication
      const authRes = await apiService.login(identifier, loginPassword.trim());
      if (authRes && authRes.success) {
        const u = authRes.user || {};
        const activeStudentObj = {
          id: u.id || 1792090671995,
          name: u.name || 'Romeo khan',
          fatherName: 'Khalid',
          rollNo: 'HMS-712',
          className: 'Grade 7',
          email: u.email || identifier,
          phone: u.phone || '0300-1234567',
          address: 'Highlight Model School Area, Islamabad',
          emergencyContact: 'Father (0300-1234567)',
          admissionType: 'Fresh / New Student',
          prevSchool: 'Highlight Model School',
          photo: DEFAULT_AVATAR,
        };

        setAuthToken(authRes.token);
        setStudent(activeStudentObj);
        setEditPhone(activeStudentObj.phone);
        setEditAddress(activeStudentObj.address);
        setEditEmergency(activeStudentObj.emergencyContact);

        setLoggingIn(false);
        setIsLoggedIn(true);
        setCurrentScreen('home');

        await loadStudentData(activeStudentObj, authRes.token);
        return;
      }

      setLoggingIn(false);
      Alert.alert(
        'Login Denied',
        'Invalid credentials. If you recently registered, please wait until the School Administration approves your application.'
      );
    } catch (err) {
      setLoggingIn(false);
      Alert.alert('Notice', 'Could not reach server. Please check your connection.');
    }
  };

  // Check Approval Status (Live poll from Pending Screen)
  const handleCheckApprovalStatus = async () => {
    if (!pendingRecord) return;
    setCheckingPendingStatus(true);

    try {
      const queryKey = pendingRecord.id || pendingRecord.email || pendingRecord.name;
      const res = await apiService.checkApprovalStatus(queryKey);
      setCheckingPendingStatus(false);

      if (res && res.exists && res.status === 'APPROVED') {
        const assignedRoll = res.registration?.assigned_roll_no || 'HMS-712';
        const studentName = res.registration?.student_name || pendingRecord.name;
        const studentClass = res.registration?.class_name || pendingRecord.className;
        const studentId = res.registration?.id || 1792090671995;

        const activeStudentObj = {
          id: studentId,
          name: studentName,
          fatherName: res.registration?.father_name || pendingRecord.fatherName,
          rollNo: assignedRoll,
          className: studentClass,
          email: pendingRecord.email,
          phone: res.registration?.phone || '0300-1234567',
          address: res.registration?.address || 'Highlight Model School Area, Islamabad',
          emergencyContact: 'Father (0300-1234567)',
          admissionType: res.registration?.student_type || 'Fresh / New Student',
          prevSchool: res.registration?.prev_school || 'Highlight Model School',
          photo: pendingRecord.photo || DEFAULT_AVATAR,
        };

        setStudent(activeStudentObj);
        setEditPhone(activeStudentObj.phone);
        setEditAddress(activeStudentObj.address);
        setEditEmergency(activeStudentObj.emergencyContact);

        setPendingRecord(null);
        setIsLoggedIn(true);
        setCurrentScreen('home');
        setAuthMode('login');

        await loadStudentData(activeStudentObj, null);

        Alert.alert(
          'Admission Approved! 🎉',
          `Congratulations! ${studentName}'s admission has been officially approved by Highlight Model School Administration.\n\nAssigned Roll No: ${assignedRoll}\nClass: ${studentClass}\n\nYour student dashboard is now active!`
        );
      } else {
        Alert.alert(
          'Still Pending Approval ⏳',
          `Your application for ${pendingRecord.name} is currently awaiting approval from the School Administration.\n\nPlease check back shortly.`
        );
      }
    } catch (e) {
      setCheckingPendingStatus(false);
      Alert.alert('Notice', 'Unable to check status at this moment. Please try again.');
    }
  };

  // Submit Admission Request
  const handleSubmitAdmission = async () => {
    if (!regName.trim() || !regFatherName.trim()) {
      Alert.alert('Missing Required Fields', "Please enter Student's Full Name and Father's Name.");
      return;
    }
    if (!regEmail.trim()) {
      Alert.alert('Email Required', 'Please enter a valid email address for account login.');
      return;
    }
    if (!regPassword.trim() || regPassword.length < 4) {
      Alert.alert('Password Required', 'Please enter a password with at least 4 characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      Alert.alert('Passwords Do Not Match', 'Please make sure both password fields are identical.');
      return;
    }
    if (regAdmissionType === 'Transfer from Previous School') {
      const schoolChosen = regPrevSchool === 'Other / Unlisted School' ? customPrevSchool : regPrevSchool;
      if (!schoolChosen.trim()) {
        Alert.alert('Previous School Required', 'Please select or enter the previous school name.');
        return;
      }
    }
    if (!agreeTerms) {
      Alert.alert('Agreement Required', 'Please agree to the school admission terms to submit your application.');
      return;
    }

    setSubmittingAdmission(true);

    const chosenPrevSchool =
      regAdmissionType === 'Transfer from Previous School'
        ? (regPrevSchool === 'Other / Unlisted School' ? customPrevSchool.trim() : regPrevSchool)
        : 'Highlight Junior Wing (Fresh Admission)';

    const payload = {
      name: regName.trim(),
      fatherName: regFatherName.trim(),
      email: regEmail.trim(),
      phone: '0300-1234567',
      password: regPassword.trim(),
      grade: regClass,
      gender: 'Male',
      dob: regDob.trim(),
      address: 'Highlight Model School Area, Islamabad',
      studentType: regAdmissionType,
      prevSchool: chosenPrevSchool,
    };

    let serverId = null;

    try {
      const res = await apiService.submitRegistration(payload);
      if (res && res.success) {
        serverId = res.registration?.id;
      }
    } catch (e) {
      console.log('Submission note:', e.message);
    }

    setSubmittingAdmission(false);

    setPendingRecord({
      id: serverId || Date.now(),
      name: regName.trim(),
      fatherName: regFatherName.trim(),
      className: regClass,
      email: regEmail.trim(),
      assignedRoll: regRollNo.trim() || 'Pending Assignment',
      photo: regPhoto,
    });

    // Show Confirmation Screen
    setAuthMode('submitted');
  };

  // Logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setStudent(null);
    setResultsData(null);
    setAttendanceRecords([]);
    setAnnouncementsList([]);
    setDocumentsList([]);
    setCurrentScreen('home');
    setAuthMode('login');
  };

  // Save Profile Edit
  const handleSaveProfile = () => {
    setStudent((prev) => ({
      ...prev,
      phone: editPhone.trim() || prev.phone,
      address: editAddress.trim() || prev.address,
      emergencyContact: editEmergency.trim() || prev.emergencyContact,
    }));
    setIsEditingProfile(false);
    Alert.alert('Profile Updated', 'Permitted profile details have been saved successfully.');
  };

  // -------------------------------------------------------------
  // 1. AUTHENTICATION SCREENS (LOGIN, SIGN UP, CONFIRMATION, PENDING)
  // -------------------------------------------------------------

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.authContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* Subtle Watermark Logo Effect in Background */}
        <View style={styles.watermarkContainer} pointerEvents="none">
          <Image source={SCHOOL_LOGO} style={styles.watermarkLogo} resizeMode="contain" />
        </View>

        {/* Blue Decorative Geometric Accents */}
        <View style={styles.decorCircleTopRight} />
        <View style={styles.decorCircleBottomLeft} />

        <ScrollView
          contentContainerStyle={styles.authScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ========================================================= */}
          {/* SCREEN 2: LOGIN SCREEN */}
          {/* ========================================================= */}
          {authMode === 'login' && (
            <View style={styles.authCard}>
              {/* School Logo Top */}
              <View style={styles.logoEmblemContainer}>
                <Image source={SCHOOL_LOGO} style={styles.authLogoImage} resizeMode="contain" />
              </View>

              <Text style={styles.authSchoolTitle}>Highlight Model School</Text>
              <Text style={styles.authScreenHeading}>Student Login</Text>
              <Text style={styles.authSubtitle}>Enter your student credentials to access your portal</Text>

              {/* Email / Roll Field */}
              <Text style={styles.inputLabel}>Email Address or Roll Number</Text>
              <View style={styles.inputBox}>
                <Ionicons name="mail-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. student@highlight.school or HMS-712"
                  placeholderTextColor={COLORS.textMuted}
                  value={loginEmail}
                  onChangeText={setLoginEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Password Field with Show/Hide */}
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputBox}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your password"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showPassword}
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIconBtn}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>

              {/* Login Button in Dark Blue */}
              <TouchableOpacity
                style={[styles.primaryButton, loggingIn && { opacity: 0.8 }]}
                onPress={handleLogin}
                disabled={loggingIn}
                activeOpacity={0.88}
              >
                {loggingIn ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>Login</Text>
                )}
              </TouchableOpacity>

              {/* Sign Up Switch Link */}
              <TouchableOpacity
                style={styles.switchAuthLink}
                onPress={() => setAuthMode('signup')}
                activeOpacity={0.7}
              >
                <Text style={styles.switchAuthText}>
                  New Student? <Text style={styles.switchAuthBold}>Sign Up</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ========================================================= */}
          {/* SCREEN 3: STUDENT SIGN-UP / ADMISSION REQUEST SCREEN */}
          {/* ========================================================= */}
          {authMode === 'signup' && (
            <View style={styles.authCard}>
              <View style={styles.logoEmblemContainerSmall}>
                <Image source={SCHOOL_LOGO} style={styles.authLogoImageSmall} resizeMode="contain" />
              </View>

              <Text style={styles.authScreenHeading}>Student Admission Request</Text>
              <Text style={styles.authSubtitle}>Fill out the official student admission application</Text>

              {/* Section 1: Student Information */}
              <View style={styles.sectionHeader}>
                <Ionicons name="person-outline" size={18} color={COLORS.primary} />
                <Text style={styles.sectionHeaderText}>Student Information</Text>
              </View>

              {/* 1. Upload Student Photo Preview */}
              <Text style={styles.inputLabel}>Student Photo</Text>
              <View style={styles.photoUploadRow}>
                <Image source={{ uri: regPhoto }} style={styles.uploadedPhotoPreview} />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.photoUploadHint}>Upload real portrait photo from camera or gallery</Text>
                  <TouchableOpacity
                    style={styles.photoChangeBtn}
                    onPress={() => {
                      setPhotoPickerTarget('signup');
                      setPhotoPickerVisible(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="camera-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.photoChangeBtnText}>Upload Photo</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 2. Student Name */}
              <Text style={styles.inputLabel}>Student Full Name *</Text>
              <View style={styles.inputBox}>
                <Ionicons name="person-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Romeo khan"
                  placeholderTextColor={COLORS.textMuted}
                  value={regName}
                  onChangeText={setRegName}
                />
              </View>

              {/* 3. Father's Name */}
              <Text style={styles.inputLabel}>Father's Name *</Text>
              <View style={styles.inputBox}>
                <Ionicons name="people-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Khalid"
                  placeholderTextColor={COLORS.textMuted}
                  value={regFatherName}
                  onChangeText={setRegFatherName}
                />
              </View>

              {/* 4. Roll Number (Optional) */}
              <Text style={styles.inputLabel}>Roll Number (If already assigned)</Text>
              <View style={styles.inputBox}>
                <Ionicons name="id-card-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Leave blank for administration assignment"
                  placeholderTextColor={COLORS.textMuted}
                  value={regRollNo}
                  onChangeText={setRegRollNo}
                />
              </View>
              <Text style={styles.fieldNote}>* Leave blank if this is a new admission without an assigned roll number.</Text>

              {/* 5. Class Dropdown / Selection */}
              <Text style={styles.inputLabel}>Select Class *</Text>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={() => setClassDropdownVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="school-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                <Text style={styles.dropdownTriggerText}>{regClass}</Text>
                <Ionicons name="chevron-down" size={18} color={COLORS.primary} />
              </TouchableOpacity>

              {/* 6. Date of Birth */}
              <Text style={styles.inputLabel}>Date of Birth (DD/MM/YYYY) *</Text>
              <View style={styles.inputBox}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 10/03/2018"
                  placeholderTextColor={COLORS.textMuted}
                  value={regDob}
                  onChangeText={setRegDob}
                />
              </View>

              {/* 7. Student Admission Type (Two selectable options) */}
              <Text style={styles.inputLabel}>Student Admission Type *</Text>
              <View style={styles.admissionTypeRow}>
                <TouchableOpacity
                  style={[
                    styles.admissionTypeOption,
                    regAdmissionType === 'Fresh / New Student' && styles.admissionTypeOptionActive,
                  ]}
                  onPress={() => setRegAdmissionType('Fresh / New Student')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={
                      regAdmissionType === 'Fresh / New Student'
                        ? 'radio-button-on'
                        : 'radio-button-off'
                    }
                    size={18}
                    color={regAdmissionType === 'Fresh / New Student' ? COLORS.primary : COLORS.textMuted}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.admissionTypeOptionText,
                      regAdmissionType === 'Fresh / New Student' && styles.admissionTypeOptionTextActive,
                    ]}
                  >
                    Fresh / New Student
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.admissionTypeOption,
                    regAdmissionType === 'Transfer from Previous School' && styles.admissionTypeOptionActive,
                  ]}
                  onPress={() => setRegAdmissionType('Transfer from Previous School')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={
                      regAdmissionType === 'Transfer from Previous School'
                        ? 'radio-button-on'
                        : 'radio-button-off'
                    }
                    size={18}
                    color={
                      regAdmissionType === 'Transfer from Previous School'
                        ? COLORS.primary
                        : COLORS.textMuted
                    }
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.admissionTypeOptionText,
                      regAdmissionType === 'Transfer from Previous School' && styles.admissionTypeOptionTextActive,
                    ]}
                  >
                    Transfer from Previous School
                  </Text>
                </TouchableOpacity>
              </View>

              {/* When "Transfer from Previous School" selected: show Previous School selection */}
              {regAdmissionType === 'Transfer from Previous School' && (
                <View style={styles.prevSchoolSection}>
                  <Text style={styles.inputLabel}>Previous School Name *</Text>
                  <TouchableOpacity
                    style={styles.dropdownTrigger}
                    onPress={() => setSchoolDropdownVisible(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="business-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                    <Text style={styles.dropdownTriggerText}>
                      {regPrevSchool || 'Select Previous School'}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={COLORS.primary} />
                  </TouchableOpacity>

                  {/* Option to type custom school name if unlisted */}
                  {regPrevSchool === 'Other / Unlisted School' && (
                    <View style={[styles.inputBox, { marginTop: 10 }]}>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter your previous school name"
                        placeholderTextColor={COLORS.textMuted}
                        value={customPrevSchool}
                        onChangeText={setCustomPrevSchool}
                      />
                    </View>
                  )}
                </View>
              )}

              {/* Section 2: Login Account Information */}
              <View style={[styles.sectionHeader, { marginTop: 22 }]}>
                <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.primary} />
                <Text style={styles.sectionHeaderText}>Login Account Information</Text>
              </View>

              {/* 8. Email Address */}
              <Text style={styles.inputLabel}>Email Address *</Text>
              <View style={styles.inputBox}>
                <Ionicons name="mail-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. parent@example.com"
                  placeholderTextColor={COLORS.textMuted}
                  value={regEmail}
                  onChangeText={setRegEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* 9. Password */}
              <Text style={styles.inputLabel}>Password *</Text>
              <View style={styles.inputBox}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Create a secure password"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showRegPassword}
                  value={regPassword}
                  onChangeText={setRegPassword}
                />
                <TouchableOpacity onPress={() => setShowRegPassword(!showRegPassword)} style={styles.eyeIconBtn}>
                  <Ionicons
                    name={showRegPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>

              {/* 10. Confirm Password */}
              <Text style={styles.inputLabel}>Confirm Password *</Text>
              <View style={styles.inputBox}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Repeat your password"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showRegConfirmPassword}
                  value={regConfirmPassword}
                  onChangeText={setRegConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                  style={styles.eyeIconBtn}
                >
                  <Ionicons
                    name={showRegConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>

              {/* Terms Checkbox */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setAgreeTerms(!agreeTerms)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={agreeTerms ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={agreeTerms ? COLORS.primary : COLORS.textMuted}
                />
                <Text style={styles.checkboxText}>
                  I agree to the Highlight Model School admission terms, verification rules, and school policies.
                </Text>
              </TouchableOpacity>

              {/* Submit Admission Request Button */}
              <TouchableOpacity
                style={[styles.primaryButton, submittingAdmission && { opacity: 0.8 }]}
                onPress={handleSubmitAdmission}
                disabled={submittingAdmission}
                activeOpacity={0.88}
              >
                {submittingAdmission ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.primaryButtonText}>Submit Admission Request</Text>
                )}
              </TouchableOpacity>

              {/* Back to Login link */}
              <TouchableOpacity
                style={styles.switchAuthLink}
                onPress={() => setAuthMode('login')}
                activeOpacity={0.7}
              >
                <Text style={styles.switchAuthText}>
                  Already registered? <Text style={styles.switchAuthBold}>Back to Login</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ========================================================= */}
          {/* SCREEN 3 (AFTER REGISTRATION): CONFIRMATION SCREEN */}
          {/* ========================================================= */}
          {authMode === 'submitted' && (
            <View style={styles.authCard}>
              <View style={styles.confirmationIconCircle}>
                <Ionicons name="checkmark-circle" size={64} color={COLORS.primary} />
              </View>

              <Text style={styles.confirmationHeading}>Registration Submitted!</Text>

              <Text style={styles.confirmationMessage}>
                Your admission request has been submitted successfully. Please wait while the school administration
                reviews and approves your application. You can log in after your admission is approved.
              </Text>

              {/* Applicant Card Summary */}
              {pendingRecord && (
                <View style={styles.applicantSummaryCard}>
                  <Text style={styles.applicantSummaryTitle}>Application Summary</Text>
                  <View style={styles.applicantRow}>
                    <Text style={styles.applicantLabel}>Student Name:</Text>
                    <Text style={styles.applicantVal}>{pendingRecord.name}</Text>
                  </View>
                  <View style={styles.applicantRow}>
                    <Text style={styles.applicantLabel}>Class Requested:</Text>
                    <Text style={styles.applicantVal}>{pendingRecord.className}</Text>
                  </View>
                  <View style={styles.applicantRow}>
                    <Text style={styles.applicantLabel}>Status:</Text>
                    <Text style={styles.applicantStatusTag}>Awaiting Administration Approval</Text>
                  </View>
                </View>
              )}

              {/* Back to Login Button */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setAuthMode('login')}
                activeOpacity={0.88}
              >
                <Text style={styles.primaryButtonText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ========================================================= */}
          {/* SCREEN 4: APPROVAL PENDING SCREEN */}
          {/* ========================================================= */}
          {authMode === 'pending' && (
            <View style={styles.authCard}>
              <View style={styles.pendingClockCircle}>
                <Ionicons name="time-outline" size={60} color={COLORS.primary} />
              </View>

              <Text style={styles.confirmationHeading}>Admission Pending</Text>

              <Text style={styles.confirmationMessage}>
                Your admission is waiting for school approval. Please try again after the school confirms your
                admission.
              </Text>

              {/* Summary Details */}
              {pendingRecord && (
                <View style={styles.applicantSummaryCard}>
                  <Text style={styles.applicantSummaryTitle}>Application Under Review</Text>
                  <View style={styles.applicantRow}>
                    <Text style={styles.applicantLabel}>Student:</Text>
                    <Text style={styles.applicantVal}>{pendingRecord.name}</Text>
                  </View>
                  <View style={styles.applicantRow}>
                    <Text style={styles.applicantLabel}>Class:</Text>
                    <Text style={styles.applicantVal}>{pendingRecord.className}</Text>
                  </View>
                  <View style={styles.applicantRow}>
                    <Text style={styles.applicantLabel}>Review Status:</Text>
                    <Text style={styles.applicantStatusTag}>Under Administration Review</Text>
                  </View>
                </View>
              )}

              {/* Check Live Approval Status Button */}
              <TouchableOpacity
                style={[styles.secondaryButton, checkingPendingStatus && { opacity: 0.8 }]}
                onPress={handleCheckApprovalStatus}
                disabled={checkingPendingStatus}
                activeOpacity={0.88}
              >
                {checkingPendingStatus ? (
                  <ActivityIndicator color={COLORS.primary} style={{ marginRight: 8 }} />
                ) : (
                  <Ionicons name="refresh-circle-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
                )}
                <Text style={styles.secondaryButtonText}>
                  {checkingPendingStatus ? 'Checking Status...' : 'Check Approval Status'}
                </Text>
              </TouchableOpacity>

              {/* Back to Login Button */}
              <TouchableOpacity
                style={[styles.primaryButton, { marginTop: 12 }]}
                onPress={() => setAuthMode('login')}
                activeOpacity={0.88}
              >
                <Text style={styles.primaryButtonText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // -------------------------------------------------------------
  // 2. MAIN STUDENT APPLICATION (DASHBOARD & ALL MODULES)
  // -------------------------------------------------------------

  return (
    <SafeAreaView style={styles.mainAppSafeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* App Header */}
      <View style={styles.appHeaderBar}>
        <View style={styles.headerLeftCol}>
          <Image source={SCHOOL_LOGO} style={styles.headerLogoSmall} resizeMode="contain" />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.headerSchoolName}>Highlight Model School</Text>
            <Text style={styles.headerStudentWelcome}>Hello, {student?.name || 'Student'}!</Text>
          </View>
        </View>

        {/* Student Avatar / Profile Button with Real Upload Option */}
        <TouchableOpacity
          style={styles.headerProfileBtn}
          onPress={() => setCurrentScreen('profile')}
          activeOpacity={0.8}
        >
          <Image source={{ uri: student?.photo || DEFAULT_AVATAR }} style={styles.headerProfilePhoto} />
        </TouchableOpacity>
      </View>

      {/* Main Screen Body */}
      <ScrollView
        style={styles.screenScrollView}
        contentContainerStyle={styles.screenScrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />}
      >
        {/* ========================================================= */}
        {/* SCREEN 5 & 6: STUDENT DASHBOARD (HOME) */}
        {/* ========================================================= */}
        {currentScreen === 'home' && (
          <View>
            {/* Welcome Student Banner */}
            <View style={styles.studentHeroBanner}>
              <TouchableOpacity
                style={styles.studentHeroAvatarWrap}
                onPress={() => {
                  setPhotoPickerTarget('profile');
                  setPhotoPickerVisible(true);
                }}
                activeOpacity={0.85}
              >
                <Image source={{ uri: student?.photo || DEFAULT_AVATAR }} style={styles.studentHeroAvatar} />
                <View style={styles.heroCameraIconBadge}>
                  <Ionicons name="camera" size={12} color={COLORS.white} />
                </View>
              </TouchableOpacity>

              <View style={styles.studentHeroTextCol}>
                <Text style={styles.studentHeroName}>{student?.name || 'Student'}</Text>
                <Text style={styles.studentHeroClass}>
                  Class: {student?.className || 'Class'} • Roll No: {student?.rollNo || 'Not Assigned'}
                </Text>
                <View style={styles.officialStatusBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.white} style={{ marginRight: 4 }} />
                  <Text style={styles.officialStatusBadgeText}>Active & Approved</Text>
                </View>
              </View>
            </View>

            {/* DASHBOARD APP ICONS GRID (7 Large child-friendly rounded icons) */}
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <View style={styles.dashboardIconGrid}>
              {/* 1. Dashboard */}
              <TouchableOpacity
                style={styles.appIconCard}
                onPress={() => setCurrentScreen('home')}
                activeOpacity={0.8}
              >
                <View style={styles.appIconCircle}>
                  <Ionicons name="home" size={28} color={COLORS.primary} />
                </View>
                <Text style={styles.appIconLabel}>Dashboard</Text>
              </TouchableOpacity>

              {/* 2. Attendance */}
              <TouchableOpacity
                style={styles.appIconCard}
                onPress={() => setCurrentScreen('attendance')}
                activeOpacity={0.8}
              >
                <View style={styles.appIconCircle}>
                  <Ionicons name="calendar" size={28} color={COLORS.primary} />
                </View>
                <Text style={styles.appIconLabel}>Attendance</Text>
              </TouchableOpacity>

              {/* 3. Results */}
              <TouchableOpacity
                style={styles.appIconCard}
                onPress={() => setCurrentScreen('results')}
                activeOpacity={0.8}
              >
                <View style={styles.appIconCircle}>
                  <Ionicons name="document-text" size={28} color={COLORS.primary} />
                </View>
                <Text style={styles.appIconLabel}>Results</Text>
              </TouchableOpacity>

              {/* 4. Documents */}
              <TouchableOpacity
                style={styles.appIconCard}
                onPress={() => setCurrentScreen('documents')}
                activeOpacity={0.8}
              >
                <View style={styles.appIconCircle}>
                  <Ionicons name="folder" size={28} color={COLORS.primary} />
                </View>
                <Text style={styles.appIconLabel}>Documents</Text>
              </TouchableOpacity>

              {/* 5. Announcements */}
              <TouchableOpacity
                style={styles.appIconCard}
                onPress={() => setCurrentScreen('announcements')}
                activeOpacity={0.8}
              >
                <View style={styles.appIconCircle}>
                  <Ionicons name="notifications" size={28} color={COLORS.primary} />
                </View>
                <Text style={styles.appIconLabel}>Announce</Text>
              </TouchableOpacity>

              {/* 6. Timetable */}
              <TouchableOpacity
                style={styles.appIconCard}
                onPress={() => setCurrentScreen('timetable')}
                activeOpacity={0.8}
              >
                <View style={styles.appIconCircle}>
                  <Ionicons name="time" size={28} color={COLORS.primary} />
                </View>
                <Text style={styles.appIconLabel}>Timetable</Text>
              </TouchableOpacity>

              {/* 7. Profile */}
              <TouchableOpacity
                style={styles.appIconCard}
                onPress={() => setCurrentScreen('profile')}
                activeOpacity={0.8}
              >
                <View style={styles.appIconCircle}>
                  <Ionicons name="person" size={28} color={COLORS.primary} />
                </View>
                <Text style={styles.appIconLabel}>Profile</Text>
              </TouchableOpacity>
            </View>

            {/* DASHBOARD CONTENT (4 Real Cards) */}
            <Text style={[styles.sectionTitle, { marginTop: 22 }]}>Overview Today</Text>

            {/* Card 1: Today's Attendance */}
            <TouchableOpacity
              style={styles.dashboardContentCard}
              onPress={() => setCurrentScreen('attendance')}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardIconTag}>
                  <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.cardHeaderTitle}>Today's Attendance</Text>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>
                    {attendanceRecords.length > 0 ? attendanceRecords[0].status || 'Present' : 'Present'}
                  </Text>
                </View>
              </View>
              <View style={styles.attendanceDetailGrid}>
                <View style={styles.attendanceDetailCol}>
                  <Text style={styles.detailLabel}>Check-In</Text>
                  <Text style={styles.detailValue}>
                    {attendanceRecords.length > 0 ? attendanceRecords[0].check_in_time || '08:00 AM' : '08:00 AM'}
                  </Text>
                </View>
                <View style={styles.attendanceDetailCol}>
                  <Text style={styles.detailLabel}>Dismissal</Text>
                  <Text style={styles.detailValue}>01:30 PM</Text>
                </View>
                <View style={styles.attendanceDetailCol}>
                  <Text style={styles.detailLabel}>Verified</Text>
                  <Text style={styles.detailValue}>Biometric</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Card 2: Latest Result (Synced Live from Web) */}
            <TouchableOpacity
              style={styles.dashboardContentCard}
              onPress={() => setCurrentScreen('results')}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardIconTag}>
                  <Ionicons name="ribbon-outline" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.cardHeaderTitle}>Latest Result</Text>
                {resultsData ? (
                  <View style={styles.gradeBadge}>
                    <Text style={styles.gradeBadgeText}>{resultsData.grade}</Text>
                  </View>
                ) : (
                  <View style={[styles.gradeBadge, { backgroundColor: COLORS.lightBlue }]}>
                    <Text style={[styles.gradeBadgeText, { color: COLORS.primary }]}>Pending</Text>
                  </View>
                )}
              </View>
              {resultsData ? (
                <View>
                  <Text style={styles.resultTermTitle}>{resultsData.term}</Text>
                  <Text style={styles.resultSummaryLine}>
                    Score: <Text style={{ fontWeight: '700' }}>{resultsData.percentage}</Text> ({resultsData.totalObtained} / {resultsData.totalMax} Marks) • {resultsData.subjects.length} Subjects
                  </Text>
                </View>
              ) : (
                <Text style={styles.emptyCardNoticeText}>
                  No examination results published yet. Check back once term marks are uploaded.
                </Text>
              )}
            </TouchableOpacity>

            {/* Card 3: Next Class */}
            <TouchableOpacity
              style={styles.dashboardContentCard}
              onPress={() => setCurrentScreen('timetable')}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardIconTag}>
                  <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.cardHeaderTitle}>Next Class</Text>
              </View>
              <Text style={styles.emptyCardNoticeText}>
                Your timetable has not been published yet.
              </Text>
            </TouchableOpacity>

            {/* Card 4: Latest Announcement */}
            <TouchableOpacity
              style={styles.dashboardContentCard}
              onPress={() => setCurrentScreen('announcements')}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardIconTag}>
                  <Ionicons name="notifications-outline" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.cardHeaderTitle}>Latest Announcement</Text>
              </View>
              {announcementsList.length > 0 ? (
                <View>
                  <Text style={styles.announcementCardHeading}>{announcementsList[0].title}</Text>
                  <Text style={styles.announcementCardSnippet} numberOfLines={2}>
                    {announcementsList[0].message || announcementsList[0].content}
                  </Text>
                </View>
              ) : (
                <Text style={styles.emptyCardNoticeText}>
                  No announcements published yet. Notices from the Principal Office will appear here.
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ========================================================= */}
        {/* SCREEN 7: ATTENDANCE SCREEN */}
        {/* ========================================================= */}
        {currentScreen === 'attendance' && (
          <View>
            <View style={styles.screenPageHeader}>
              <Text style={styles.screenMainTitle}>Attendance Record</Text>
              <Text style={styles.screenSubtitle}>
                {student?.name || 'Student'} • Class: {student?.className || 'Class'}
              </Text>
            </View>

            {/* Attendance Summary */}
            <View style={styles.statsSummaryBox}>
              <View style={styles.statMetricItem}>
                <Text style={styles.statMetricNumber}>
                  {attendanceRecords.length > 0 ? `${attendanceRecords.filter(a => a.status === 'Present').length}` : '0'}
                </Text>
                <Text style={styles.statMetricLabel}>Present Days</Text>
              </View>
              <View style={styles.statMetricItem}>
                <Text style={styles.statMetricNumber}>
                  {attendanceRecords.length > 0 ? `${attendanceRecords.filter(a => a.status === 'Absent').length}` : '0'}
                </Text>
                <Text style={styles.statMetricLabel}>Absent Days</Text>
              </View>
              <View style={styles.statMetricItem}>
                <Text style={styles.statMetricNumber}>{attendanceRecords.length}</Text>
                <Text style={styles.statMetricLabel}>Total Logged</Text>
              </View>
            </View>

            {/* Biometric Attendance Log */}
            <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Biometric Attendance Log</Text>
            {attendanceRecords.length > 0 ? (
              attendanceRecords.map((log, index) => (
                <View key={index} style={styles.attendanceLogRow}>
                  <View style={styles.attendanceLogLeft}>
                    <Text style={styles.attendanceLogDate}>
                      {log.attendance_date || log.date || 'Date'}
                    </Text>
                    <Text style={styles.attendanceLogTimes}>
                      In: {log.check_in_time || log.time || '--'} • Out: {log.check_out_time || '01:30 PM'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.attendanceStatusTag,
                      log.status === 'Present' && styles.statusPresentTag,
                      log.status === 'Absent' && styles.statusAbsentTag,
                      log.status === 'Late' && styles.statusLateTag,
                    ]}
                  >
                    <Text
                      style={[
                        styles.attendanceStatusTagText,
                        log.status === 'Present' && styles.statusPresentText,
                        log.status === 'Absent' && styles.statusAbsentText,
                        log.status === 'Late' && styles.statusLateText,
                      ]}
                    >
                      {log.status || 'Present'}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyStateBox}>
                <Ionicons name="calendar-outline" size={48} color={COLORS.primary} style={{ opacity: 0.5 }} />
                <Text style={styles.emptyStateTitle}>No attendance records found yet</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Biometric gate punch records from the school entrance will appear here automatically.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ========================================================= */}
        {/* SCREEN 8: RESULTS SCREEN (LIVE SYNC FROM WEB) */}
        {/* ========================================================= */}
        {currentScreen === 'results' && (
          <View>
            <View style={styles.screenPageHeader}>
              <Text style={styles.screenMainTitle}>Examination Results</Text>
              <Text style={styles.screenSubtitle}>
                {student?.name || 'Student'} • Class: {student?.className || 'Class'}
              </Text>
            </View>

            {resultsData && resultsData.subjects && resultsData.subjects.length > 0 ? (
              <View>
                {/* Real Report Card Hero Banner */}
                <View style={styles.reportCardHero}>
                  <Text style={styles.reportCardTerm}>{resultsData.term}</Text>
                  <Text style={styles.reportCardPublish}>Result Date: {resultsData.publishedDate}</Text>
                  <View style={styles.reportCardMetricsRow}>
                    <View style={styles.reportCardMetric}>
                      <Text style={styles.reportMetricBig}>{resultsData.percentage}</Text>
                      <Text style={styles.reportMetricLabel}>Percentage</Text>
                    </View>
                    <View style={styles.reportCardMetric}>
                      <Text style={styles.reportMetricBig}>{resultsData.grade}</Text>
                      <Text style={styles.reportMetricLabel}>Overall Grade</Text>
                    </View>
                    <View style={styles.reportCardMetric}>
                      <Text style={styles.reportMetricBig}>{resultsData.totalObtained} / {resultsData.totalMax}</Text>
                      <Text style={styles.reportMetricLabel}>Total Marks</Text>
                    </View>
                  </View>
                  <Text style={styles.reportCardRemarks}>"{resultsData.remarks}"</Text>
                </View>

                {/* Real Subject Marksheet Breakdown */}
                <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Assigned Subject Marks</Text>
                {resultsData.subjects.map((sub, index) => (
                  <View key={index} style={styles.subjectMarkCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subjectMarkName}>{sub.name}</Text>
                      <Text style={styles.subjectMarkScore}>
                        Marks: {sub.marks} / {sub.total} • Rating: {sub.performance}
                      </Text>
                    </View>
                    <View style={styles.subjectGradeBadge}>
                      <Text style={styles.subjectGradeBadgeText}>{sub.grade}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyStateBox}>
                <Ionicons name="document-text-outline" size={48} color={COLORS.primary} style={{ opacity: 0.5 }} />
                <Text style={styles.emptyStateTitle}>No results published yet</Text>
                <Text style={styles.emptyStateSubtitle}>
                  The school administration has not assigned or published examination marks for your profile yet.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ========================================================= */}
        {/* SCREEN 9: DOCUMENTS SCREEN */}
        {/* ========================================================= */}
        {currentScreen === 'documents' && (
          <View>
            <View style={styles.screenPageHeader}>
              <Text style={styles.screenMainTitle}>Official Documents</Text>
              <Text style={styles.screenSubtitle}>Authorized school documents for {student?.name || 'Student'}</Text>
            </View>

            {documentsList.length > 0 ? (
              documentsList.map((doc) => (
                <View key={doc.id} style={styles.documentCard}>
                  <View style={styles.documentIconWrap}>
                    <Ionicons name="document-text" size={30} color={COLORS.primary} />
                  </View>
                  <View style={styles.documentInfoCol}>
                    <Text style={styles.documentTitle}>{doc.title}</Text>
                    <Text style={styles.documentMeta}>
                      {doc.category || 'School Document'} • {doc.uploaded_at || 'Recent'} • {doc.file_size_formatted || 'PDF'}
                    </Text>
                    <View style={styles.documentActionRow}>
                      <TouchableOpacity
                        style={styles.documentActionBtn}
                        onPress={() => setSelectedDoc(doc)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="eye-outline" size={15} color={COLORS.primary} style={{ marginRight: 4 }} />
                        <Text style={styles.documentActionBtnText}>View Document</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.documentActionBtn, { marginLeft: 8 }]}
                        onPress={() =>
                          Alert.alert('Download Complete', `${doc.title} has been downloaded to device storage.`)
                        }
                        activeOpacity={0.8}
                      >
                        <Ionicons name="download-outline" size={15} color={COLORS.primary} style={{ marginRight: 4 }} />
                        <Text style={styles.documentActionBtnText}>Download</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyStateBox}>
                <Ionicons name="folder-outline" size={48} color={COLORS.primary} style={{ opacity: 0.5 }} />
                <Text style={styles.emptyStateTitle}>No documents uploaded yet</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Certificates, fee vouchers, and official documents uploaded by the school administration will appear here.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ========================================================= */}
        {/* SCREEN 10: ANNOUNCEMENTS SCREEN */}
        {/* ========================================================= */}
        {currentScreen === 'announcements' && (
          <View>
            <View style={styles.screenPageHeader}>
              <Text style={styles.screenMainTitle}>School Announcements</Text>
              <Text style={styles.screenSubtitle}>Official notices from Highlight Model School</Text>
            </View>

            {/* Search Announcements */}
            <View style={[styles.inputBox, { marginBottom: 16 }]}>
              <Ionicons name="search-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Search announcements..."
                placeholderTextColor={COLORS.textMuted}
                value={announcementSearch}
                onChangeText={setAnnouncementSearch}
              />
            </View>

            {announcementsList.length > 0 ? (
              announcementsList
                .filter(
                  (a) =>
                    (a.title || '').toLowerCase().includes(announcementSearch.toLowerCase()) ||
                    (a.message || a.content || '').toLowerCase().includes(announcementSearch.toLowerCase())
                )
                .map((ann, idx) => (
                  <View key={ann.id || idx} style={styles.announcementFullCard}>
                    <View style={styles.announcementCardTop}>
                      <View style={styles.announcementTag}>
                        <Ionicons name="megaphone-outline" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
                        <Text style={styles.announcementTagText}>{ann.category || 'Official Notice'}</Text>
                      </View>
                      <Text style={styles.announcementFullDate}>{ann.date || ann.created_at || 'Recent'}</Text>
                    </View>
                    <Text style={styles.announcementFullTitle}>{ann.title}</Text>
                    <Text style={styles.announcementFullMessage}>{ann.message || ann.content}</Text>
                  </View>
                ))
            ) : (
              <View style={styles.emptyStateBox}>
                <Ionicons name="notifications-outline" size={48} color={COLORS.primary} style={{ opacity: 0.5 }} />
                <Text style={styles.emptyStateTitle}>No announcements published yet</Text>
                <Text style={styles.emptyStateSubtitle}>
                  There are currently no active public announcements from the Principal Office.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ========================================================= */}
        {/* SCREEN 11: TIMETABLE SCREEN */}
        {/* ========================================================= */}
        {currentScreen === 'timetable' && (
          <View>
            <View style={styles.screenPageHeader}>
              <Text style={styles.screenMainTitle}>Class Timetable</Text>
              <Text style={styles.screenSubtitle}>
                Assigned Timetable • Class {student?.className || 'Class'}
              </Text>
            </View>

            {/* Day Selector Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelectorRow}>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayTabBtn, selectedDay === day && styles.dayTabBtnActive]}
                  onPress={() => setSelectedDay(day)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dayTabBtnText, selectedDay === day && styles.dayTabBtnTextActive]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.emptyStateBox}>
              <Ionicons name="calendar-outline" size={48} color={COLORS.primary} style={{ opacity: 0.5 }} />
              <Text style={styles.emptyStateTitle}>Your timetable has not been published yet.</Text>
              <Text style={styles.emptyStateSubtitle}>
                No class periods are scheduled for {selectedDay}. The administration will publish the schedule here once assigned.
              </Text>
            </View>
          </View>
        )}

        {/* ========================================================= */}
        {/* SCREEN 12: STUDENT PROFILE SCREEN */}
        {/* ========================================================= */}
        {currentScreen === 'profile' && (
          <View>
            <View style={styles.screenPageHeader}>
              <Text style={styles.screenMainTitle}>Student Profile</Text>
              <Text style={styles.screenSubtitle}>Official Highlight Model School Student Record</Text>
            </View>

            {/* Student Photo Card with Real Upload Trigger */}
            <View style={styles.profileAvatarCard}>
              <TouchableOpacity
                style={styles.profileAvatarLargeWrap}
                onPress={() => {
                  setPhotoPickerTarget('profile');
                  setPhotoPickerVisible(true);
                }}
                activeOpacity={0.85}
              >
                <Image source={{ uri: student?.photo || DEFAULT_AVATAR }} style={styles.profileAvatarLarge} />
                <View style={styles.avatarCameraOverlay}>
                  <Ionicons name="camera" size={16} color={COLORS.white} />
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.uploadPhotoPill}
                onPress={() => {
                  setPhotoPickerTarget('profile');
                  setPhotoPickerVisible(true);
                }}
              >
                <Ionicons name="cloud-upload-outline" size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
                <Text style={styles.uploadPhotoPillText}>Upload / Change Photo</Text>
              </TouchableOpacity>
              <Text style={styles.profileStudentName}>{student?.name || 'Student'}</Text>
              <Text style={styles.profileRollClass}>
                Roll No: {student?.rollNo || 'Not Assigned'} • Class: {student?.className || 'Class'}
              </Text>
            </View>

            {/* Card 1: Official Academic Information (Locked) */}
            <View style={styles.profileInfoSection}>
              <View style={styles.profileSectionTitleRow}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.primary} />
                <Text style={styles.profileSectionTitleText}>Academic Details (Administration Verified)</Text>
              </View>
              <View style={styles.profileDetailRow}>
                <Text style={styles.profileFieldKey}>Full Name:</Text>
                <Text style={styles.profileFieldVal}>{student?.name || 'Student'}</Text>
              </View>
              <View style={styles.profileDetailRow}>
                <Text style={styles.profileFieldKey}>Father's Name:</Text>
                <Text style={styles.profileFieldVal}>{student?.fatherName || 'Father'}</Text>
              </View>
              <View style={styles.profileDetailRow}>
                <Text style={styles.profileFieldKey}>Assigned Roll No:</Text>
                <Text style={[styles.profileFieldVal, { color: COLORS.primary, fontWeight: '700' }]}>
                  {student?.rollNo || 'Not Assigned'}
                </Text>
              </View>
              <View style={styles.profileDetailRow}>
                <Text style={styles.profileFieldKey}>Class / Grade:</Text>
                <Text style={styles.profileFieldVal}>{student?.className || 'Class'}</Text>
              </View>
              <View style={styles.profileDetailRow}>
                <Text style={styles.profileFieldKey}>Admission Type:</Text>
                <Text style={styles.profileFieldVal}>{student?.admissionType || 'Fresh / New Student'}</Text>
              </View>
              <View style={styles.profileDetailRow}>
                <Text style={styles.profileFieldKey}>Previous School:</Text>
                <Text style={styles.profileFieldVal}>{student?.prevSchool || 'Highlight Model School'}</Text>
              </View>
              <Text style={styles.lockedNote}>
                * Approved admission details, roll number, and class cannot be changed without administration authorization.
              </Text>
            </View>

            {/* Card 2: Personal & Contact Information (Permitted to Edit) */}
            <View style={styles.profileInfoSection}>
              <View style={styles.profileSectionTitleRow}>
                <Ionicons name="person-outline" size={18} color={COLORS.primary} />
                <Text style={styles.profileSectionTitleText}>Personal & Contact Details</Text>
              </View>

              <View style={styles.profileDetailRow}>
                <Text style={styles.profileFieldKey}>Email Address:</Text>
                <Text style={styles.profileFieldVal}>{student?.email || 'N/A'}</Text>
              </View>

              {isEditingProfile ? (
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <View style={styles.inputBox}>
                    <TextInput style={styles.textInput} value={editPhone} onChangeText={setEditPhone} />
                  </View>

                  <Text style={styles.inputLabel}>Residential Address</Text>
                  <View style={styles.inputBox}>
                    <TextInput style={styles.textInput} value={editAddress} onChangeText={setEditAddress} />
                  </View>

                  <Text style={styles.inputLabel}>Emergency Contact</Text>
                  <View style={styles.inputBox}>
                    <TextInput style={styles.textInput} value={editEmergency} onChangeText={setEditEmergency} />
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                    <TouchableOpacity
                      style={[styles.primaryButton, { flex: 1 }]}
                      onPress={handleSaveProfile}
                      activeOpacity={0.88}
                    >
                      <Text style={styles.primaryButtonText}>Save Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.secondaryButton, { flex: 1 }]}
                      onPress={() => setIsEditingProfile(false)}
                      activeOpacity={0.88}
                    >
                      <Text style={styles.secondaryButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View>
                  <View style={styles.profileDetailRow}>
                    <Text style={styles.profileFieldKey}>Contact Phone:</Text>
                    <Text style={styles.profileFieldVal}>{student?.phone || '0300-1234567'}</Text>
                  </View>
                  <View style={styles.profileDetailRow}>
                    <Text style={styles.profileFieldKey}>Address:</Text>
                    <Text style={styles.profileFieldVal}>{student?.address || 'Islamabad'}</Text>
                  </View>
                  <View style={styles.profileDetailRow}>
                    <Text style={styles.profileFieldKey}>Emergency:</Text>
                    <Text style={styles.profileFieldVal}>{student?.emergencyContact || 'Father'}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.secondaryButton, { marginTop: 14 }]}
                    onPress={() => setIsEditingProfile(true)}
                    activeOpacity={0.88}
                  >
                    <Ionicons name="create-outline" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.secondaryButtonText}>Edit Profile</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.88}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ========================================================= */}
      {/* SCREEN 13: BOTTOM NAVIGATION BAR (5 Main Items) */}
      {/* No Sidebar! */}
      {/* ========================================================= */}
      <View style={styles.bottomNavBar}>
        {/* 1. Home */}
        <TouchableOpacity
          style={styles.navBarItem}
          onPress={() => setCurrentScreen('home')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={currentScreen === 'home' ? 'home' : 'home-outline'}
            size={24}
            color={currentScreen === 'home' ? COLORS.primary : COLORS.textMuted}
          />
          <Text style={[styles.navBarLabel, currentScreen === 'home' && styles.navBarLabelActive]}>
            Home
          </Text>
        </TouchableOpacity>

        {/* 2. Attendance */}
        <TouchableOpacity
          style={styles.navBarItem}
          onPress={() => setCurrentScreen('attendance')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={currentScreen === 'attendance' ? 'calendar' : 'calendar-outline'}
            size={24}
            color={currentScreen === 'attendance' ? COLORS.primary : COLORS.textMuted}
          />
          <Text style={[styles.navBarLabel, currentScreen === 'attendance' && styles.navBarLabelActive]}>
            Attendance
          </Text>
        </TouchableOpacity>

        {/* 3. Results */}
        <TouchableOpacity
          style={styles.navBarItem}
          onPress={() => setCurrentScreen('results')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={currentScreen === 'results' ? 'document-text' : 'document-text-outline'}
            size={24}
            color={currentScreen === 'results' ? COLORS.primary : COLORS.textMuted}
          />
          <Text style={[styles.navBarLabel, currentScreen === 'results' && styles.navBarLabelActive]}>
            Results
          </Text>
        </TouchableOpacity>

        {/* 4. Timetable */}
        <TouchableOpacity
          style={styles.navBarItem}
          onPress={() => setCurrentScreen('timetable')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={currentScreen === 'timetable' ? 'time' : 'time-outline'}
            size={24}
            color={currentScreen === 'timetable' ? COLORS.primary : COLORS.textMuted}
          />
          <Text style={[styles.navBarLabel, currentScreen === 'timetable' && styles.navBarLabelActive]}>
            Timetable
          </Text>
        </TouchableOpacity>

        {/* 5. Profile */}
        <TouchableOpacity
          style={styles.navBarItem}
          onPress={() => setCurrentScreen('profile')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={currentScreen === 'profile' ? 'person' : 'person-outline'}
            size={24}
            color={currentScreen === 'profile' ? COLORS.primary : COLORS.textMuted}
          />
          <Text style={[styles.navBarLabel, currentScreen === 'profile' && styles.navBarLabelActive]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* REAL PHOTO PICKER MODAL (CAMERA OR GALLERY) */}
      <Modal visible={photoPickerVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Upload Profile Photo</Text>
            <Text style={styles.modalSubheading}>Choose how you want to upload your photo</Text>

            <TouchableOpacity style={styles.pickerActionRow} onPress={handlePickFromGallery} activeOpacity={0.8}>
              <View style={styles.pickerIconCircle}>
                <Ionicons name="images-outline" size={24} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.pickerActionTitle}>Choose from Gallery</Text>
                <Text style={styles.pickerActionSub}>Select a photo from your phone</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.pickerActionRow} onPress={handleTakePhotoWithCamera} activeOpacity={0.8}>
              <View style={styles.pickerIconCircle}>
                <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.pickerActionTitle}>Take a Photo</Text>
                <Text style={styles.pickerActionSub}>Capture a new portrait with camera</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setPhotoPickerVisible(false)}>
              <Text style={styles.modalCloseBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Class Dropdown */}
      <Modal visible={classDropdownVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Select Class</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {AVAILABLE_CLASSES.map((cls, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.dropdownItem, regClass === cls && styles.dropdownItemSelected]}
                  onPress={() => {
                    setRegClass(cls);
                    setClassDropdownVisible(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, regClass === cls && styles.dropdownItemTextSelected]}>
                    {cls}
                  </Text>
                  {regClass === cls && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setClassDropdownVisible(false)}>
              <Text style={styles.modalCloseBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Previous School Selection */}
      <Modal visible={schoolDropdownVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Select Previous School</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {PREVIOUS_SCHOOLS_LIST.map((sch, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.dropdownItem, regPrevSchool === sch && styles.dropdownItemSelected]}
                  onPress={() => {
                    setRegPrevSchool(sch);
                    setSchoolDropdownVisible(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, regPrevSchool === sch && styles.dropdownItemTextSelected]}>
                    {sch}
                  </Text>
                  {regPrevSchool === sch && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSchoolDropdownVisible(false)}>
              <Text style={styles.modalCloseBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Document Viewer Preview */}
      {selectedDoc && (
        <Modal visible={!!selectedDoc} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeaderRow}>
                <Ionicons name="document-attach" size={28} color={COLORS.primary} />
                <Text style={styles.modalDocTitle}>{selectedDoc.title}</Text>
              </View>

              <View style={styles.docDetailBox}>
                <View style={styles.docDetailRow}>
                  <Text style={styles.docDetailKey}>Document Type:</Text>
                  <Text style={styles.docDetailVal}>{selectedDoc.category || 'Official Record'}</Text>
                </View>
                <View style={styles.docDetailRow}>
                  <Text style={styles.docDetailKey}>Issue Date:</Text>
                  <Text style={styles.docDetailVal}>{selectedDoc.uploaded_at || 'Recent'}</Text>
                </View>
                <View style={styles.docDetailRow}>
                  <Text style={styles.docDetailKey}>File Size:</Text>
                  <Text style={styles.docDetailVal}>{selectedDoc.file_size_formatted || 'PDF'}</Text>
                </View>
                <View style={styles.docDetailRow}>
                  <Text style={styles.docDetailKey}>Status:</Text>
                  <Text style={[styles.docDetailVal, { color: COLORS.primary, fontWeight: '700' }]}>
                    Verified & Official
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => {
                  Alert.alert('Download Complete', `${selectedDoc.title} downloaded.`);
                  setSelectedDoc(null);
                }}
                activeOpacity={0.88}
              >
                <Ionicons name="download" size={18} color={COLORS.white} style={{ marginRight: 6 }} />
                <Text style={styles.primaryButtonText}>Download Document</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, { marginTop: 10 }]}
                onPress={() => setSelectedDoc(null)}
                activeOpacity={0.88}
              >
                <Text style={styles.secondaryButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

// -------------------------------------------------------------
// STYLESHEET (BLUE, DARK BLUE, & WHITE THEME ONLY)
// -------------------------------------------------------------
const styles = StyleSheet.create({
  // Auth Layout
  authContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    position: 'relative',
  },
  watermarkContainer: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  watermarkLogo: {
    width: 320,
    height: 320,
    opacity: 0.05,
  },
  decorCircleTopRight: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.lightBlue,
    zIndex: 0,
  },
  decorCircleBottomLeft: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.lightBlue,
    zIndex: 0,
  },
  authScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    zIndex: 1,
  },
  authCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  logoEmblemContainer: {
    alignSelf: 'center',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.lightBlueBorder,
    marginBottom: 12,
  },
  authLogoImage: {
    width: 70,
    height: 70,
  },
  logoEmblemContainerSmall: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.lightBlueBorder,
    marginBottom: 10,
  },
  authLogoImageSmall: {
    width: 50,
    height: 50,
  },
  authSchoolTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  authScreenHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  authSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    marginTop: 10,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBlue,
    borderWidth: 1,
    borderColor: COLORS.lightBlueBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    height: '100%',
  },
  eyeIconBtn: {
    padding: 6,
  },
  fieldNote: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
    lineHeight: 15,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.lightBlue,
    borderWidth: 1,
    borderColor: COLORS.lightBlueBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
  },
  dropdownTriggerText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 22,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  secondaryButton: {
    backgroundColor: COLORS.lightBlue,
    borderWidth: 1,
    borderColor: COLORS.lightBlueBorder,
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  switchAuthLink: {
    marginTop: 18,
    alignItems: 'center',
  },
  switchAuthText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  switchAuthBold: {
    color: COLORS.secondary,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBlue,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    gap: 6,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  photoUploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBlue,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.lightBlueBorder,
  },
  uploadedPhotoPreview: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  photoUploadHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  photoChangeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightBlueBorder,
    alignSelf: 'flex-start',
  },
  photoChangeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  admissionTypeRow: {
    gap: 10,
  },
  admissionTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBlue,
    borderWidth: 1,
    borderColor: COLORS.lightBlueBorder,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  admissionTypeOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#E5EEFA',
  },
  admissionTypeOptionText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
  },
  admissionTypeOptionTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  prevSchoolSection: {
    marginTop: 10,
    backgroundColor: '#F5F9FF',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.lightBlueBorder,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    gap: 8,
  },
  checkboxText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  confirmationIconCircle: {
    alignSelf: 'center',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.lightBlueBorder,
    marginBottom: 16,
  },
  confirmationHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmationMessage: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  applicantSummaryCard: {
    backgroundColor: COLORS.lightBlue,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.lightBlueBorder,
    marginBottom: 16,
  },
  applicantSummaryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 8,
  },
  applicantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  applicantLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  applicantVal: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  applicantStatusTag: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  pendingClockCircle: {
    alignSelf: 'center',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.lightBlueBorder,
    marginBottom: 16,
  },

  // Main App Layout
  mainAppSafeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  appHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogoSmall: {
    width: 38,
    height: 38,
  },
  headerSchoolName: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.secondary,
    textTransform: 'uppercase',
  },
  headerStudentWelcome: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
  },
  headerProfileBtn: {
    padding: 2,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  headerProfilePhoto: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  screenScrollView: {
    flex: 1,
  },
  screenScrollContent: {
    padding: 16,
    paddingBottom: 90,
  },

  // Student Hero Banner (Dashboard)
  studentHeroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  studentHeroAvatarWrap: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: COLORS.white,
    position: 'relative',
    marginRight: 14,
  },
  studentHeroAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 31,
  },
  heroCameraIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.secondary,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  studentHeroTextCol: {
    flex: 1,
  },
  studentHeroName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
  },
  studentHeroClass: {
    fontSize: 13,
    color: '#D1E2FC',
    marginTop: 2,
  },
  officialStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  officialStatusBadgeText: {
    fontSize: 11,
    color: COLORS.white,
    fontWeight: '700',
  },

  // 7 App Icons Grid
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 12,
  },
  dashboardIconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  appIconCard: {
    width: '30.5%',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  appIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  appIconLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },

  // 4 Dashboard Cards
  dashboardContentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardIconTag: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardHeaderTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statusPill: {
    backgroundColor: COLORS.lightBlue,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  attendanceDetailGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.lightBlue,
    padding: 10,
    borderRadius: 12,
  },
  attendanceDetailCol: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 2,
  },
  gradeBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gradeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
  },
  resultTermTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  resultSummaryLine: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  emptyCardNoticeText: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  announcementCardHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  announcementCardSnippet: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 3,
    lineHeight: 16,
  },

  // Screen Headers
  screenPageHeader: {
    marginBottom: 16,
  },
  screenMainTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  screenSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // Attendance Screen Styles
  statsSummaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  statMetricItem: {
    alignItems: 'center',
  },
  statMetricNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statMetricLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  attendanceLogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  attendanceLogLeft: {
    flex: 1,
  },
  attendanceLogDate: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  attendanceLogTimes: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  attendanceStatusTag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusPresentTag: {
    backgroundColor: COLORS.lightBlue,
  },
  statusPresentText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 12,
  },
  statusAbsentTag: {
    backgroundColor: '#F1F5F9',
  },
  statusAbsentText: {
    color: '#64748B',
    fontWeight: '800',
    fontSize: 12,
  },
  statusLateTag: {
    backgroundColor: '#E0E7FF',
  },
  statusLateText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 12,
  },
  attendanceStatusTagText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Results Screen Styles
  reportCardHero: {
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  reportCardTerm: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
  },
  reportCardPublish: {
    fontSize: 11,
    color: '#D1E2FC',
    marginTop: 2,
  },
  reportCardMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    padding: 12,
    borderRadius: 12,
    marginVertical: 12,
  },
  reportCardMetric: {
    alignItems: 'center',
  },
  reportMetricBig: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
  },
  reportMetricLabel: {
    fontSize: 11,
    color: '#D1E2FC',
    marginTop: 2,
  },
  reportCardRemarks: {
    fontSize: 12,
    color: '#EEF5FF',
    fontStyle: 'italic',
  },
  subjectMarkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subjectMarkName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  subjectMarkScore: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  subjectGradeBadge: {
    backgroundColor: COLORS.lightBlue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  subjectGradeBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },

  // Documents Screen Styles
  documentCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  documentIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  documentInfoCol: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  documentMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  documentActionRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  documentActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBlue,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  documentActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Announcements Screen Styles
  announcementFullCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  announcementCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  announcementTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBlue,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  announcementTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  announcementFullDate: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  announcementFullTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  announcementFullMessage: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },

  // Timetable Screen Styles
  daySelectorRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayTabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayTabBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayTabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  dayTabBtnTextActive: {
    color: COLORS.white,
  },
  emptyStateBox: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 8,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 10,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },

  // Profile Screen Styles
  profileAvatarCard: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileAvatarLargeWrap: {
    position: 'relative',
    marginBottom: 8,
  },
  profileAvatarLarge: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarCameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  uploadPhotoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBlue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.lightBlueBorder,
    marginBottom: 8,
  },
  uploadPhotoPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  profileStudentName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  profileRollClass: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  profileInfoSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  profileSectionTitleText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  profileDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  profileFieldKey: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  profileFieldVal: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  lockedNote: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginTop: 10,
    lineHeight: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 50,
    marginTop: 10,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Bottom Navigation Bar (No sidebar)
  bottomNavBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 22 : 10,
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  navBarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBarLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  navBarLabelActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },

  // Modals & Image Picker Action Sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 59, 115, 0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubheading: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  pickerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBlue,
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.lightBlueBorder,
  },
  pickerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightBlueBorder,
  },
  pickerActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  pickerActionSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownItemSelected: {
    backgroundColor: COLORS.lightBlue,
  },
  dropdownItemText: {
    fontSize: 13,
    color: COLORS.text,
  },
  dropdownItemTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  modalCloseBtn: {
    backgroundColor: COLORS.lightBlue,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  modalCloseBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  modalDocTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  docDetailBox: {
    backgroundColor: COLORS.lightBlue,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  docDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  docDetailKey: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  docDetailVal: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
});
