import os

path = r'c:\all projects\Highlight Model School\mobile app\App.js'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Update DEFAULT_AVATAR
old_def = "const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=250';"
new_def = "const DEFAULT_AVATAR = (apiService.getPhotoUrl && apiService.getPhotoUrl('/uploads/roman_profile.png')) || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=250';"

if old_def in code:
    code = code.replace(old_def, new_def)
    print("Replaced DEFAULT_AVATAR")

# Update Image sources that use student?.photo
code = code.replace(
    '<Image source={{ uri: student?.photo || DEFAULT_AVATAR }} style={styles.headerProfilePhoto} />',
    '<Image source={{ uri: (apiService.getPhotoUrl ? apiService.getPhotoUrl(student?.photo) : student?.photo) || DEFAULT_AVATAR }} style={styles.headerProfilePhoto} />'
)

code = code.replace(
    '<Image source={{ uri: student?.photo || DEFAULT_AVATAR }} style={styles.studentHeroAvatar} />',
    '<Image source={{ uri: (apiService.getPhotoUrl ? apiService.getPhotoUrl(student?.photo) : student?.photo) || DEFAULT_AVATAR }} style={styles.studentHeroAvatar} />'
)

code = code.replace(
    '<Image source={{ uri: student?.photo || DEFAULT_AVATAR }} style={styles.profileAvatarLarge} />',
    '<Image source={{ uri: (apiService.getPhotoUrl ? apiService.getPhotoUrl(student?.photo) : student?.photo) || DEFAULT_AVATAR }} style={styles.profileAvatarLarge} />'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated mobile App.js successfully!")
