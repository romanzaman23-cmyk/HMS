const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../mobile app/App.js');
console.log('Target mobile App.js:', targetPath);

let content = fs.readFileSync(targetPath, 'utf8');

content = content.replace(
  "const [loginEmail, setLoginEmail] = useState('romanzaman23@gmail.com');",
  "const [loginEmail, setLoginEmail] = useState('');"
);

content = content.replace(
  "const [loginPassword, setLoginPassword] = useState('Parent@123');",
  "const [loginPassword, setLoginPassword] = useState('');"
);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully cleared mobile App.js login credentials');
