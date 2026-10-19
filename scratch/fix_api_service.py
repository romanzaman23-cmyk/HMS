path = r'c:\all projects\Highlight Model School\mobile app\apiService.js'

with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Let's inspect where checkApprovalStatus ends
cut_idx = text.find('// Helper to resolve full photo URL')
if cut_idx != -1:
    text = text[:cut_idx]
else:
    # remove trailing closing braces if any
    closing_idx = text.rfind('};\n\nexport default apiService;')
    if closing_idx != -1:
        text = text[:closing_idx]

clean_code = text.rstrip() + '''

  // Helper to resolve full photo URL from relative or absolute path
  getPhotoUrl: (photoPath) => {
    if (!photoPath) return null;
    const str = String(photoPath).trim();
    if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('file://') || str.startsWith('data:')) {
      return str;
    }
    const clean = str.startsWith('/') ? str : '/' + str;
    return 'http://' + BACKEND_IP + ':5000' + clean;
  },

  // 11. Upload Student Avatar directly to School Management backend
  uploadAvatar: async (studentId, photoUri) => {
    try {
      const formData = new FormData();
      formData.append('avatar', {
        uri: photoUri,
        name: 'student_' + (studentId || 'roman') + '_avatar.jpg',
        type: 'image/jpeg',
      });
      const url = 'http://' + BACKEND_IP + ':5000/api/students/' + (studentId || '1792101401929') + '/avatar';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      const data = await res.json();
      return data;
    } catch (e) {
      console.log('Avatar upload error:', e.message);
      return { success: false, error: e.message };
    }
  },
};

export default apiService;
'''

with open(path, 'w', encoding='utf-8') as f:
    f.write(clean_code)

print("apiService.js cleaned and fixed successfully!")
