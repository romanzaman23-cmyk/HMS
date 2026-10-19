const fs = require('fs');
const path = require('path');

const appJsPath = path.resolve(__dirname, '../../../mobile app/App.js');
console.log('Reading App.js from:', appJsPath);

let content = fs.readFileSync(appJsPath, 'utf8');

const marker = '{/* SCREEN 12: STUDENT PROFILE SCREEN */}';
const markerPos = content.indexOf(marker);

if (markerPos !== -1) {
  const beforeMarker = content.substring(0, markerPos);
  const afterMarker = content.substring(markerPos);

  const lastClosePos = beforeMarker.lastIndexOf('        )}');
  if (lastClosePos !== -1) {
    const fixedBefore = beforeMarker.substring(0, lastClosePos) + '          </View>\n        )}' + beforeMarker.substring(lastClosePos + 10);
    fs.writeFileSync(appJsPath, fixedBefore + afterMarker, 'utf8');
    console.log('Successfully inserted </View> before )} !');
  } else {
    console.log('lastClosePos not found');
  }
} else {
  console.log('marker not found');
}
