const path = require('path');
const bcrypt = require(path.join(__dirname, '../backend/node_modules/bcryptjs'));
const fs = require('fs');

async function check() {
  const store = JSON.parse(fs.readFileSync(path.join(__dirname, '../backend/data/store.json'), 'utf8'));
  const user = store.users.find(u => u.email === 'roman@gmail.com');
  console.log('User found:', user?.email, user?.password_hash);
  if (!user) return;

  const candidates = ['Parent@123', 'admin', 'Admin@123', '123456', 'roman', 'roman123', 'khalid', 'khalid123', '6565623', '03038262123', '12345678', 'password'];
  for (const p of candidates) {
    const ok = await bcrypt.compare(p, user.password_hash);
    if (ok) {
      console.log('MATCHED PASSWORD:', p);
      return;
    }
  }
  console.log('None of the candidates matched!');
}

check();
