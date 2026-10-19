path = r'c:\all projects\Highlight Model School\mobile app\App.js'

with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add regPhotoBase64 state
if 'const [regPhotoBase64, setRegPhotoBase64]' not in text:
    text = text.replace(
        "const [regPhoto, setRegPhoto] = useState(DEFAULT_AVATAR);",
        "const [regPhoto, setRegPhoto] = useState(DEFAULT_AVATAR);\n  const [regPhotoBase64, setRegPhotoBase64] = useState(null);"
    )
    print("Added regPhotoBase64 state!")

# 2. Add base64: true to launchImageLibraryAsync and launchCameraAsync
text = text.replace(
    """      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });""",
    """      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });"""
)

text = text.replace(
    """      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });""",
    """      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });"""
)

# 3. Store base64 in gallery picker
old_gallery_set = """      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedUri = result.assets[0].uri;
        if (photoPickerTarget === 'signup') {
          setRegPhoto(pickedUri);"""

new_gallery_set = """      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedUri = result.assets[0].uri;
        const b64 = result.assets[0].base64 ? 'data:image/jpeg;base64,' + result.assets[0].base64 : null;
        if (photoPickerTarget === 'signup') {
          setRegPhoto(pickedUri);
          setRegPhotoBase64(b64);"""

if old_gallery_set in text:
    text = text.replace(old_gallery_set, new_gallery_set, 1)
    print("Updated gallery set with b64!")
else:
    print("old_gallery_set not found")

# 4. Store base64 in camera picker
old_camera_set = """      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;
        if (photoPickerTarget === 'signup') {
          setRegPhoto(photoUri);"""

new_camera_set = """      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;
        const b64 = result.assets[0].base64 ? 'data:image/jpeg;base64,' + result.assets[0].base64 : null;
        if (photoPickerTarget === 'signup') {
          setRegPhoto(photoUri);
          setRegPhotoBase64(b64);"""

if old_camera_set in text:
    text = text.replace(old_camera_set, new_camera_set, 1)
    print("Updated camera set with b64!")
else:
    print("old_camera_set not found")

# 5. Include photo_base64 in payload
old_payload = """      photo: regPhoto,
    };"""

new_payload = """      photo: regPhoto,
      photo_base64: regPhotoBase64,
    };"""

if old_payload in text:
    text = text.replace(old_payload, new_payload, 1)
    print("Updated payload with photo_base64!")

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print("App.js updated successfully with base64 support!")
