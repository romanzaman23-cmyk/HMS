const fs = require('fs');
const path = require('path');

const apiServicePath = path.resolve(__dirname, '../../../mobile app/apiService.js');
console.log('Target path:', apiServicePath);

if (!fs.existsSync(apiServicePath)) {
  console.error('File not found:', apiServicePath);
  process.exit(1);
}

let content = fs.readFileSync(apiServicePath, 'utf8');

if (!content.includes('getTimetable:')) {
  const methodCode = `
  // 11. Class Timetable
  getTimetable: async (token, className) => {
    try {
      const cls = className || 'Grade 1';
      const res = await fetchWithTimeout(\`\${API_BASE_URL}/timetable?class_name=\${encodeURIComponent(cls)}\`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: \`Bearer \${token}\` } : {})
        }
      }, 5000);
      if (res.ok) {
        const data = await res.json();
        return { success: true, data: data.data || {} };
      }
      return { success: false, data: {} };
    } catch (err) {
      console.log('[API] getTimetable error:', err.message);
      return { success: false, data: {} };
    }
  },
};
`;
  // Replace the closing "};" of apiService
  const lastIndex = content.lastIndexOf('};');
  if (lastIndex !== -1) {
    content = content.substring(0, lastIndex) + methodCode + content.substring(lastIndex + 2);
    fs.writeFileSync(apiServicePath, content, 'utf8');
    console.log('Successfully added getTimetable to apiService.js!');
  } else {
    console.error('Could not find closing bracket of apiService');
  }
} else {
  console.log('getTimetable already present.');
}
