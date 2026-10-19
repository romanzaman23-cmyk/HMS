# Update apiService.js
api_path = r'c:\all projects\Highlight Model School\mobile app\apiService.js'
with open(api_path, 'r', encoding='utf-8') as f:
    text = f.read()

old_upload = """  // 11. Upload Student Avatar directly to School Management backend
  uploadAvatar: async (studentId, photoUri) => {
    try {
      const formData = new FormData();
      formData.append('avatar', {
        uri: photoUri,
        name: 'student_' + (studentId || 'roman') + '_avatar.jpg',
        type: 'image/jpeg',
      });
      const url = 'http://' + BACKEND_IP + ':5000/api/students/' + (studentId || '1792101401929') + '/avatar';
      const headers = await apiService.getAuthHeaders();
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });
      const data = await res.json();
      return data;
    } catch (e) {
      console.log('Avatar upload error:', e.message);
      return { success: false, error: e.message };
    }
  },"""

new_upload = """  // 11. Upload Student Avatar directly to School Management backend (supports base64 & multipart)
  uploadAvatar: async (studentId, photoUri, photoBase64) => {
    try {
      const url = 'http://' + BACKEND_IP + ':5000/api/students/' + (studentId || '1792101401929') + '/avatar';
      const headers = await apiService.getAuthHeaders();

      if (photoBase64 && photoBase64.startsWith('data:image')) {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ photo_base64: photoBase64 }),
        });
        const data = await res.json();
        return data;
      }

      const formData = new FormData();
      formData.append('avatar', {
        uri: photoUri,
        name: 'student_' + (studentId || 'roman') + '_avatar.jpg',
        type: 'image/jpeg',
      });
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });
      const data = await res.json();
      return data;
    } catch (e) {
      console.log('Avatar upload error:', e.message);
      return { success: false, error: e.message };
    }
  },"""

if old_upload in text:
    text = text.replace(old_upload, new_upload)
    with open(api_path, 'w', encoding='utf-8') as f:
        f.write(text)
    print("Updated uploadAvatar in apiService.js!")
else:
    print("old_upload not found in apiService.js")

# Update App.js
app_path = r'c:\all projects\Highlight Model School\mobile app\App.js'
with open(app_path, 'r', encoding='utf-8') as f:
    app_text = f.read()

app_text = app_text.replace(
    "apiService.uploadAvatar(student?.id, pickedUri)",
    "apiService.uploadAvatar(student?.id, pickedUri, b64)"
)
app_text = app_text.replace(
    "apiService.uploadAvatar(student?.id, photoUri)",
    "apiService.uploadAvatar(student?.id, photoUri, b64)"
)

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app_text)

print("Updated App.js calls to uploadAvatar with b64!")
