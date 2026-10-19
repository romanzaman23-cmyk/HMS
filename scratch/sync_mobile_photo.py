path = r'c:\all projects\Highlight Model School\mobile app\App.js'

with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

gallery_target = """        if (photoPickerTarget === 'signup') {
          setRegPhoto(pickedUri);
        } else {
          setStudent((prev) => (prev ? { ...prev, photo: pickedUri } : null));
        }
        Alert.alert('Photo Updated!"""

gallery_replacement = """        if (photoPickerTarget === 'signup') {
          setRegPhoto(pickedUri);
        } else {
          setStudent((prev) => (prev ? { ...prev, photo: pickedUri } : null));
          if (apiService.uploadAvatar) {
            apiService.uploadAvatar(student?.id, pickedUri).then(res => {
              if (res?.success && res?.avatar_url) {
                setStudent((prev) => (prev ? { ...prev, photo: res.avatar_url } : null));
              }
            }).catch(e => console.log('Auto avatar upload note:', e));
          }
        }
        Alert.alert('Photo Updated!"""

camera_target = """        if (photoPickerTarget === 'signup') {
          setRegPhoto(photoUri);
        } else {
          setStudent((prev) => (prev ? { ...prev, photo: photoUri } : null));
        }
        Alert.alert('Photo Captured!"""

camera_replacement = """        if (photoPickerTarget === 'signup') {
          setRegPhoto(photoUri);
        } else {
          setStudent((prev) => (prev ? { ...prev, photo: photoUri } : null));
          if (apiService.uploadAvatar) {
            apiService.uploadAvatar(student?.id, photoUri).then(res => {
              if (res?.success && res?.avatar_url) {
                setStudent((prev) => (prev ? { ...prev, photo: res.avatar_url } : null));
              }
            }).catch(e => console.log('Auto avatar upload note:', e));
          }
        }
        Alert.alert('Photo Captured!"""

if gallery_target in code:
    code = code.replace(gallery_target, gallery_replacement, 1)
    print("Replaced gallery handler!")
else:
    print("Gallery target not found!")

if camera_target in code:
    code = code.replace(camera_target, camera_replacement, 1)
    print("Replaced camera handler!")
else:
    print("Camera target not found!")

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("App.js photo sync updated successfully!")
