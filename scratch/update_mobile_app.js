const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../mobile app/App.js');
console.log('Target path:', targetPath);

if (!fs.existsSync(targetPath)) {
  console.error('File not found:', targetPath);
  process.exit(1);
}

let content = fs.readFileSync(targetPath, 'utf8');

// Check if submittingReg state is present
if (!content.includes('const [submittingReg, setSubmittingReg]')) {
  content = content.replace(
    "const [pendingApplication, setPendingApplication] = useState(null);",
    "const [pendingApplication, setPendingApplication] = useState(null);\n  const [submittingReg, setSubmittingReg] = useState(false);"
  );
}

// Replace handleRegister
const oldHandleRegister = `  const handleRegister = () => {
    if (!regName.trim() || !regFatherName.trim() || !regPhone.trim()) {
      Alert.alert('Required Fields Missing', 'Please enter Student Full Name, Father Name, and Contact Number.');
      return;
    }
    if (!regEmail.trim()) {
      Alert.alert('Email Required', 'Please enter Student or Parent Email Address.');
      return;
    }
    if (!regPassword.trim() || regPassword.length < 4) {
      Alert.alert('Password Required', 'Please enter a password of at least 4 characters for student portal login.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      Alert.alert('Passwords Do Not Match', 'Please confirm that both password fields are identical.');
      return;
    }

    const newApp = {
      appId: \`HMS-REG-\${Math.floor(1000 + Math.random() * 9000)}\`,
      name: regName.trim(),
      fatherName: regFatherName.trim(),
      email: regEmail.trim(),
      password: regPassword.trim(),
      rollNo: regRollNo.trim() || \`HMS-2026-\${Math.floor(100 + Math.random() * 900)}\`,
      grade: \`\${regClass} - Section A\`,
      dob: regDob.trim() || '15 Aug 2014',
      gender: regGender,
      studentType: regStudentType,
      prevSchool: regStudentType === 'Transfer Student' ? (regPrevSchool.trim() || 'Not specified') : 'New Admission',
      phone: regPhone.trim(),
      address: regAddress.trim() || 'Highlight Model School Area, Islamabad',
      dateSubmitted: 'Today',
      status: 'Pending Principal Review',
    };

    setPendingApplication(newApp);
    setAuthMode('pending');
  };`;

const newHandleRegister = `  const handleRegister = async () => {
    if (!regName.trim() || !regFatherName.trim() || !regPhone.trim()) {
      Alert.alert('Required Fields Missing', 'Please enter Student Full Name, Father Name, and Contact Number.');
      return;
    }
    if (!regEmail.trim()) {
      Alert.alert('Email Required', 'Please enter Student or Parent Email Address.');
      return;
    }
    if (!regPassword.trim() || regPassword.length < 4) {
      Alert.alert('Password Required', 'Please enter a password of at least 4 characters for student portal login.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      Alert.alert('Passwords Do Not Match', 'Please confirm that both password fields are identical.');
      return;
    }

    setSubmittingReg(true);

    const payload = {
      student_name: regName.trim(),
      father_name: regFatherName.trim(),
      email: regEmail.trim(),
      phone: regPhone.trim(),
      password: regPassword.trim(),
      class_name: regClass,
      gender: regGender,
      date_of_birth: regDob.trim() || '2015-01-01',
      address: regAddress.trim() || 'Highlight Model School Area, Islamabad',
      source: 'Mobile App'
    };

    let serverAssignedId = null;
    let submittedSuccessfully = false;

    // Multi-endpoint fallback for robust mobile app connectivity
    const apiEndpoints = [
      \`\${API_BASE_URL}/approvals/register\`,
      'http://192.168.8.133:5000/api/approvals/register',
      'http://192.168.8.133:5173/api/approvals/register',
      'http://localhost:5000/api/approvals/register'
    ];

    for (const url of apiEndpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4500);
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          if (data && data.success) {
            submittedSuccessfully = true;
            serverAssignedId = data.registration?.id;
            break;
          }
        }
      } catch (err) {
        // try next endpoint
      }
    }

    setSubmittingReg(false);

    const newApp = {
      appId: serverAssignedId ? \`HMS-REG-\${serverAssignedId}\` : \`HMS-REG-\${Math.floor(1000 + Math.random() * 9000)}\`,
      name: regName.trim(),
      fatherName: regFatherName.trim(),
      email: regEmail.trim(),
      password: regPassword.trim(),
      rollNo: regRollNo.trim() || \`HMS-2026-\${Math.floor(100 + Math.random() * 900)}\`,
      grade: \`\${regClass} - Section A\`,
      dob: regDob.trim() || '15 Aug 2014',
      gender: regGender,
      studentType: regStudentType,
      prevSchool: regStudentType === 'Transfer Student' ? (regPrevSchool.trim() || 'Not specified') : 'New Admission',
      phone: regPhone.trim(),
      address: regAddress.trim() || 'Highlight Model School Area, Islamabad',
      dateSubmitted: 'Today',
      status: 'Pending Principal Review',
    };

    setPendingApplication(newApp);
    setAuthMode('pending');

    if (submittedSuccessfully) {
      Alert.alert(
        'Application Sent! 🎉',
        \`Admission application for \${regName.trim()} has been successfully transmitted to the Principal Office. It is now awaiting review in the Admin Approvals portal.\`
      );
    } else {
      Alert.alert(
        'Application Saved (Offline Mode)',
        \`Your admission request was stored locally on your device. Ensure your phone is connected to the school Wi-Fi network (192.168.8.133).\`
      );
    }
  };`;

if (content.includes('const handleRegister = () => {')) {
  content = content.replace(oldHandleRegister, newHandleRegister);
  console.log('Replaced handleRegister with async HTTP version');
} else {
  console.log('handleRegister already modified or signature different');
}

// Update the submit button to show loading indicator if submittingReg
const oldButton = `<TouchableOpacity style={styles.primaryGradientBtn} onPress={handleRegister} activeOpacity={0.88}>
                <Ionicons name="checkmark-done-circle" size={22} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.primaryGradientBtnText}>Submit Registration File</Text>
              </TouchableOpacity>`;

const newButton = `<TouchableOpacity 
                style={[styles.primaryGradientBtn, submittingReg && { opacity: 0.7 }]} 
                onPress={handleRegister} 
                disabled={submittingReg}
                activeOpacity={0.88}
              >
                {submittingReg ? (
                  <ActivityIndicator color="#ffffff" style={{ marginRight: 8 }} />
                ) : (
                  <Ionicons name="checkmark-done-circle" size={22} color="#ffffff" style={{ marginRight: 8 }} />
                )}
                <Text style={styles.primaryGradientBtnText}>
                  {submittingReg ? 'Submitting Application...' : 'Submit Registration File'}
                </Text>
              </TouchableOpacity>`;

if (content.includes(oldButton)) {
  content = content.replace(oldButton, newButton);
  console.log('Replaced submit button with loading indicator');
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Updated mobile app/App.js successfully!');
