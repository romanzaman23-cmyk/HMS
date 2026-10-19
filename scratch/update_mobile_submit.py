import os

# 1. Update apiService.js
api_service_path = r'c:\all projects\Highlight Model School\mobile app\apiService.js'
with open(api_service_path, 'r', encoding='utf-8') as f:
    api_text = f.read()

old_submit = """  // 3. Submit New Student Admission to Principal Office
  submitRegistration: async (studentData) => {
    try {
      const payload = {
        student_name: studentData.name,
        father_name: studentData.fatherName,
        email: studentData.email,
        phone: studentData.phone,
        password: studentData.password,
        class_name: studentData.className || studentData.grade,
        gender: studentData.gender || 'Male',
        date_of_birth: studentData.dob || '2015-01-01',
        address: studentData.address,
        student_type: studentData.studentType,
        prev_school: studentData.prevSchool,
        source: 'Mobile App',
      };

      const res = await fetchWithTimeout(`${API_BASE_URL}/approvals/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }, 8000);

      const data = await res.json();
      return data;
    } catch (err) {
      return { success: false, message: `Submission failed: ${err.message}` };
    }
  },"""

new_submit = """  // 3. Submit New Student Admission to Principal Office with uploaded photo
  submitRegistration: async (studentData) => {
    try {
      const formData = new FormData();
      formData.append('student_name', studentData.name || '');
      formData.append('father_name', studentData.fatherName || '');
      formData.append('email', studentData.email || '');
      formData.append('phone', studentData.phone || '0300-1234567');
      formData.append('password', studentData.password || 'Student@123');
      formData.append('class_name', studentData.className || studentData.grade || 'Grade 1');
      formData.append('gender', studentData.gender || 'Male');
      formData.append('date_of_birth', studentData.dob || '2015-01-01');
      formData.append('address', studentData.address || '');
      formData.append('student_type', studentData.studentType || 'Fresh / New Student');
      formData.append('prev_school', studentData.prevSchool || '');
      formData.append('source', 'Mobile App');

      if (studentData.photo && (studentData.photo.startsWith('file://') || studentData.photo.startsWith('content://'))) {
        formData.append('avatar', {
          uri: studentData.photo,
          name: 'student_reg_' + Date.now() + '.jpg',
          type: 'image/jpeg',
        });
      } else if (studentData.photo && studentData.photo.startsWith('data:image')) {
        formData.append('photo_base64', studentData.photo);
      } else if (studentData.photo) {
        formData.append('photo_url', studentData.photo);
      }

      const res = await fetchWithTimeout(`${API_BASE_URL}/approvals/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      }, 12000);

      const data = await res.json();
      return data;
    } catch (err) {
      return { success: false, message: `Submission failed: ${err.message}` };
    }
  },"""

if old_submit in api_text:
    api_text = api_text.replace(old_submit, new_submit)
    with open(api_service_path, 'w', encoding='utf-8') as f:
        f.write(api_text)
    print("Updated apiService.js submitRegistration!")
else:
    print("old_submit not found in apiService.js")

# 2. Update App.js handleSubmitAdmission payload
app_path = r'c:\all projects\Highlight Model School\mobile app\App.js'
with open(app_path, 'r', encoding='utf-8') as f:
    app_text = f.read()

old_payload = """    const payload = {
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
    };"""

new_payload = """    const payload = {
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
      photo: regPhoto,
    };"""

if old_payload in app_text:
    app_text = app_text.replace(old_payload, new_payload)
    with open(app_path, 'w', encoding='utf-8') as f:
        f.write(app_text)
    print("Updated App.js payload with photo!")
else:
    print("old_payload not found in App.js")
