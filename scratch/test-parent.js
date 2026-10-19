async function test() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'roman@gmail.com', password: 'Parent@123' })
    });
    const loginData = await loginRes.json();
    console.log('LOGIN STATUS:', loginRes.status, loginData);
    if (!loginData.token) return;

    const meRes = await fetch('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${loginData.token}` }
    });
    const meData = await meRes.json();
    console.log('/auth/me STATUS:', meRes.status, meData);

    const stuRes = await fetch('http://localhost:5000/api/students', {
      headers: { Authorization: `Bearer ${loginData.token}` }
    });
    const stuData = await stuRes.json();
    console.log('/students STATUS:', stuRes.status, stuData);
  } catch (err) {
    console.error('ERROR:', err);
  }
}

test();
