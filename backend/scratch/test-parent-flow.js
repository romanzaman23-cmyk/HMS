const axios = require('axios');

async function testParentFlow() {
  try {
    console.log('1. Logging in as roman@gmail.com...');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'roman@gmail.com',
      password: 'Parent@123'
    });
    console.log('Login Response:', loginRes.data.success, loginRes.data.user);
    const token = loginRes.data.token;

    console.log('\n2. Fetching /api/auth/me...');
    const meRes = await axios.get('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Auth Me User:', meRes.data.user);

    console.log('\n3. Fetching /api/students...');
    const stuRes = await axios.get('http://localhost:5000/api/students', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Students count:', stuRes.data.students?.length);
    stuRes.data.students.forEach(s => {
      console.log(` - ID: ${s.id}, Name: "${s.full_name}", Class: ${s.class_name}, Parent Email: ${s.parent_email}`);
    });

    console.log('\n4. Fetching /api/notifications...');
    const notifRes = await axios.get('http://localhost:5000/api/notifications', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Notifications status:', notifRes.data.success);

    console.log('\n5. Fetching /api/leaves...');
    const leavesRes = await axios.get('http://localhost:5000/api/leaves', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Leaves status:', leavesRes.data.success);

    console.log('\n6. Fetching /api/announcements...');
    const annRes = await axios.get('http://localhost:5000/api/announcements', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Announcements count:', annRes.data.announcements?.length);

    console.log('\n ALL API CALLS FOR PARENT DASHBOARD COMPLETED SUCCESSFULLY WITHOUT ERROR!');
  } catch (err) {
    console.error('Error in parent flow:', err.response?.data || err.message);
  }
}

testParentFlow();
