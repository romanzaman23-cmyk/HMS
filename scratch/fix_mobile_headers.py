path = r'c:\all projects\Highlight Model School\mobile app\apiService.js'

with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Remove 'Content-Type': 'multipart/form-data' in submitRegistration and uploadAvatar
# Because React Native fetch automatically generates multipart boundary!
old_submit_fetch = """      const res = await fetchWithTimeout(`${API_BASE_URL}/approvals/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      }, 12000);"""

new_submit_fetch = """      const res = await fetchWithTimeout(`${API_BASE_URL}/approvals/register`, {
        method: 'POST',
        body: formData,
      }, 15000);"""

if old_submit_fetch in text:
    text = text.replace(old_submit_fetch, new_submit_fetch)
    print("Fixed submitRegistration fetch headers!")
else:
    print("old_submit_fetch not found in apiService.js")

old_upload_fetch = """      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });"""

new_upload_fetch = """      const headers = await apiService.getAuthHeaders();
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });"""

if old_upload_fetch in text:
    text = text.replace(old_upload_fetch, new_upload_fetch)
    print("Fixed uploadAvatar fetch headers!")
else:
    print("old_upload_fetch not found in apiService.js")

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print("apiService.js headers updated successfully!")
