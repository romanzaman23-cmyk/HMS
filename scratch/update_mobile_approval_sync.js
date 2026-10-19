const fs = require('fs');
const path = require('path');

// 1. Update apiService.js
const apiServicePath = path.resolve(__dirname, '../../mobile app/apiService.js');
console.log('Target apiService:', apiServicePath);

if (fs.existsSync(apiServicePath)) {
  let apiContent = fs.readFileSync(apiServicePath, 'utf8');

  // Replace checkApprovalStatus
  const oldMethodRegex = /checkApprovalStatus:\s*async\s*\([\s\S]*?\}\s*\},/m;
  const newMethod = `checkApprovalStatus: async (identifier) => {
    const raw = String(identifier || '').trim();
    if (!raw) return { success: false, status: 'NOT_FOUND' };
    
    const urls = [
      \`\${API_BASE_URL}/approvals/status?q=\${encodeURIComponent(raw)}\`,
      \`http://\${BACKEND_IP}:5000/api/approvals/status?q=\${encodeURIComponent(raw)}\`,
      \`http://\${BACKEND_IP}:5173/api/approvals/status?q=\${encodeURIComponent(raw)}\`,
      \`http://localhost:5000/api/approvals/status?q=\${encodeURIComponent(raw)}\`
    ];

    for (const u of urls) {
      try {
        const res = await fetchWithTimeout(u, { method: 'GET' }, 3500);
        if (res.ok) {
          const data = await res.json();
          if (data && data.exists) {
            return data;
          }
        }
      } catch (err) {
        // try next endpoint
      }
    }
    return { success: false, status: 'NOT_FOUND' };
  },`;

  if (apiContent.includes('checkApprovalStatus: async (identifier) => {')) {
    apiContent = apiContent.replace(oldMethodRegex, newMethod);
    fs.writeFileSync(apiServicePath, apiContent, 'utf8');
    console.log('Updated apiService.js checkApprovalStatus successfully!');
  } else {
    console.log('checkApprovalStatus signature not matched in apiService.js');
  }
}

// 2. Update App.js
const appJsPath = path.resolve(__dirname, '../../mobile app/App.js');
console.log('Target App.js:', appJsPath);

if (fs.existsSync(appJsPath)) {
  let appContent = fs.readFileSync(appJsPath, 'utf8');

  // Replace handleCheckServerApproval
  const oldApprovalFuncRegex = /const handleCheckServerApproval = async \(\) => \{[\s\S]*?Alert\.alert\(\s*['"]Still Waiting for Approval[\s\S]*?\);\s*\};/m;

  const newApprovalFunc = `const handleCheckServerApproval = async (isSilent = false) => {
    if (!pendingApplication) return;
    if (!isSilent) setCheckingApproval(true);
    
    // Identifier can be serverId, appId, name, email, or phone
    const identifier = pendingApplication.serverId || pendingApplication.appId || pendingApplication.name || pendingApplication.email || pendingApplication.phone;
    const res = await apiService.checkApprovalStatus(identifier);
    if (!isSilent) setCheckingApproval(false);

    if (res && res.exists && res.status === 'APPROVED') {
      const assignedRoll = res.registration?.assigned_roll_no || 'HMS-050';
      const studentName = res.registration?.student_name || pendingApplication.name;
      const className = res.registration?.class_name || pendingApplication.grade;

      // Automatically enroll and unlock student in mobile app
      const newApprovedStudent = {
        id: res.registration?.id || Date.now(),
        name: studentName,
        fatherName: res.registration?.father_name || pendingApplication.fatherName || 'Father',
        rollNo: assignedRoll,
        grade: className,
        dob: pendingApplication.dob || '10/03/2001',
        bloodGroup: 'B+',
        phone: pendingApplication.phone || '03038262123',
        address: pendingApplication.address || 'Highlight Model School Area',
        emergencyContact: \`Father (\${pendingApplication.phone || ''})\`,
        attendanceRate: '100%',
        presentDays: 1,
        totalDays: 1,
        avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200',
        todayStatus: 'Present',
        punchInTime: '08:00 AM',
        punchOutTime: '01:30 PM',
        terminal: 'ZKTeco F18 (Main Gate)',
      };

      setChildren((prev) => [newApprovedStudent, ...prev.filter(c => c.name !== studentName)]);
      setSelectedChild(newApprovedStudent);
      setEditName(newApprovedStudent.name);
      setEditFatherName(newApprovedStudent.fatherName);
      setEditPhone(newApprovedStudent.phone);
      setEditAddress(newApprovedStudent.address);

      // Transition to active student dashboard
      setIsLoggedIn(true);
      setCurrentScreen('home');
      setPendingApplication(null);
      setAuthMode('login');

      Alert.alert(
        'Admission Approved by Management! 🎉',
        \`Congratulations! \${studentName} has been officially approved by the Principal Office.\\n\\nAssigned Roll No: \${assignedRoll}\\nClass: \${className}\\n\\nYour student portal is now active!\`
      );
      return;
    }

    if (!isSilent) {
      Alert.alert(
        'Still Waiting for Approval ⏳',
        \`Your admission file is currently under review by School Management.\\n\\nOnce the Principal or Administrator approves your application in the School Management portal, your student portal will unlock automatically.\`
      );
    }
  };`;

  if (appContent.includes('const handleCheckServerApproval = async () => {')) {
    appContent = appContent.replace(oldApprovalFuncRegex, newApprovalFunc);
    console.log('Replaced handleCheckServerApproval in App.js');
  }

  // Add auto-polling useEffect for approval status if not present
  if (!appContent.includes('// Auto-check approval status periodically')) {
    const autoPollHook = `
  // Auto-check approval status periodically while on waiting screen
  useEffect(() => {
    if (authMode !== 'pending' || !pendingApplication) return;
    const interval = setInterval(() => {
      handleCheckServerApproval(true);
    }, 3500);
    return () => clearInterval(interval);
  }, [authMode, pendingApplication]);
`;
    appContent = appContent.replace(
      '// Profile Save\n  const handleSaveProfile = () => {',
      `${autoPollHook}\n  // Profile Save\n  const handleSaveProfile = () => {`
    );
    console.log('Added auto-poll hook in App.js');
  }

  fs.writeFileSync(appJsPath, appContent, 'utf8');
  console.log('Updated App.js successfully!');
}
