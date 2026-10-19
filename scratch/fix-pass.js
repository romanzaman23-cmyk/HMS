const path = require('path');
const bcrypt = require(path.join(__dirname, '../backend/node_modules/bcryptjs'));
const fs = require('fs');

async function fix() {
  const storePath = path.join(__dirname, '../backend/data/store.json');
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  const user = store.users.find(u => u.email === 'roman@gmail.com');
  if (user) {
    user.password_hash = await bcrypt.hash('Parent@123', 10);
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
    console.log('Updated roman@gmail.com password to Parent@123');
  }
}

fix();
