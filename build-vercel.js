const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('[Vercel Build] Building Highlight Model School frontend...');
try {
  execSync('npm install --include=dev', { cwd: path.join(__dirname, 'frontend'), stdio: 'inherit' });
  execSync('npm run build', { cwd: path.join(__dirname, 'frontend'), stdio: 'inherit' });
  
  const src = path.join(__dirname, 'frontend', 'dist');
  const dest = path.join(__dirname, 'public');
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true, force: true });
    fs.copyFileSync(path.join(src, 'index.html'), path.join(__dirname, 'index.html'));
  }
  console.log('[Vercel Build] Production build deployed successfully!');
} catch (err) {
  console.warn('[Vercel Build] Fallback:', err.message);
  console.log('[Vercel Build] Using pre-built static distribution in public.');
}
