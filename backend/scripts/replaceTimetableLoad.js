const fs = require('fs');
const path = require('path');

const appJsPath = path.resolve(__dirname, '../../../mobile app/App.js');
let content = fs.readFileSync(appJsPath, 'utf8');

const target = 'setTimetableData({});';
const replacement = `try {
        const ttRes = await apiService.getTimetable(token, studentData.className);
        if (ttRes && ttRes.success && ttRes.data && Object.keys(ttRes.data).length > 0) {
          setTimetableData(ttRes.data);
        } else {
          setTimetableData({});
        }
      } catch (e) {
        setTimetableData({});
      }`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(appJsPath, content, 'utf8');
  console.log('Successfully updated setTimetableData in App.js!');
} else {
  console.log('Target not found in App.js');
}
