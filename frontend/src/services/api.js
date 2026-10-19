import axios from 'axios';
import mockStoreData from '../data/mockStore.json';

// Initialize a working in-browser reactive store from mockStore
function getWorkingStore() {
  try {
    const saved = localStorage.getItem('hms_live_store');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return JSON.parse(JSON.stringify(mockStoreData));
}

function saveWorkingStore(store) {
  try {
    localStorage.setItem('hms_live_store', JSON.stringify(store));
  } catch (e) {}
}

// Standalone Mock Executor for Live Cloud / Vercel Deployments
function executeMockRequest(url, method, rawData) {
  const store = getWorkingStore();
  const lowerUrl = (url || '').toLowerCase();
  const lowerMethod = (method || 'get').toLowerCase();

  // 1. Auth Login Fallback
  if (lowerUrl.includes('/auth/login')) {
    let body = {};
    try {
      body = typeof rawData === 'string' ? JSON.parse(rawData) : (rawData || {});
    } catch (e) {}

    const email = (body.email || '').trim().toLowerCase();
    const password = (body.password || '').trim();

    const validUsers = [
      {
        id: 1,
        email: 'admin@highlight.school',
        passwords: ['admin@123', 'admin', '123456'],
        role: 'PRINCIPAL_ADMIN',
        name: 'Admin Principal',
        phone: '+92 300 0000000',
        avatar_url: '/uploads/roman_real.png'
      },
      {
        id: 2,
        email: 'romanzaman23@gmail.com',
        passwords: ['123123', 'admin@123', '123456'],
        role: 'PRINCIPAL_ADMIN',
        name: 'Roman Zaman',
        phone: '+92 300 0000000',
        avatar_url: '/uploads/roman_real.png'
      },
      {
        id: 3,
        email: 'parent@highlight.school',
        passwords: ['parent@123', '123456'],
        role: 'PARENT',
        name: 'Tariq Khan (Parent)',
        phone: '+92 300 1234567',
        avatar_url: '/uploads/roman_real.png'
      }
    ];

    const matched = validUsers.find(
      (u) => u.email.toLowerCase() === email && u.passwords.some(p => p.toLowerCase() === password.toLowerCase())
    );

    if (matched) {
      const fakeUser = {
        id: matched.id,
        email: matched.email,
        name: matched.name,
        role: matched.role,
        phone: matched.phone,
        avatar_url: matched.avatar_url
      };
      const fakeToken = 'live_hms_jwt_token_' + Date.now();
      return {
        data: {
          success: true,
          token: fakeToken,
          user: fakeUser
        }
      };
    } else {
      throw new Error('Invalid email or password. Please verify credentials.');
    }
  }

  // 2. Auth Me Fallback
  if (lowerUrl.includes('/auth/me')) {
    const storedUser = localStorage.getItem('hms_user');
    if (storedUser) {
      return {
        data: {
          success: true,
          user: JSON.parse(storedUser)
        }
      };
    }
  }

  // 3. Classes
  if (lowerUrl.includes('/classes')) {
    return {
      data: {
        success: true,
        classes: store.classes || []
      }
    };
  }

  // 4. Students
  if (lowerUrl.includes('/students')) {
    if (lowerMethod === 'get') {
      return {
        data: {
          success: true,
          students: store.students || []
        }
      };
    }
    if (lowerMethod === 'post') {
      let newStudent = {};
      try {
        newStudent = typeof rawData === 'string' ? JSON.parse(rawData) : (rawData || {});
      } catch (e) {}
      newStudent.id = (store.students || []).length + 1;
      newStudent.status = newStudent.status || 'Active';
      store.students = [newStudent, ...(store.students || [])];
      saveWorkingStore(store);
      return {
        data: {
          success: true,
          message: 'Student enrolled successfully!',
          student: newStudent
        }
      };
    }
    return { data: { success: true } };
  }

  // 5. Attendance Summary
  if (lowerUrl.includes('/attendance/summary')) {
    return {
      data: {
        success: true,
        summary: {
          totalStudents: 248,
          presentToday: 218,
          absentToday: 30,
          attendanceRate: 88,
          absentRate: 12,
          totalLeaves: 5,
          pendingLeaves: 2,
          newThisWeek: 2
        }
      }
    };
  }

  // 6. Attendance records
  if (lowerUrl.includes('/attendance')) {
    return {
      data: {
        success: true,
        records: store.attendance || []
      }
    };
  }

  // 7. Devices
  if (lowerUrl.includes('/devices')) {
    return {
      data: {
        success: true,
        device: {
          device_name: 'ZKTeco F18',
          location: 'Main Gate',
          connection_status: 'Connected',
          ip_address: '192.168.1.201',
          port: 4370,
          last_sync_time: new Date().toISOString()
        }
      }
    };
  }

  // 8. Timetable
  if (lowerUrl.includes('/timetable')) {
    return {
      data: {
        success: true,
        timetable: store.timetable || []
      }
    };
  }

  // 9. Announcements
  if (lowerUrl.includes('/announcements')) {
    return {
      data: {
        success: true,
        announcements: store.announcements || []
      }
    };
  }

  // 10. Leaves
  if (lowerUrl.includes('/leaves')) {
    return {
      data: {
        success: true,
        leaves: store.leaves || []
      }
    };
  }

  // 11. Approvals
  if (lowerUrl.includes('/approvals')) {
    return {
      data: {
        success: true,
        approvals: store.approvals || []
      }
    };
  }

  // 12. Results
  if (lowerUrl.includes('/results')) {
    return {
      data: {
        success: true,
        results: store.results || []
      }
    };
  }

  // 13. Settings
  if (lowerUrl.includes('/settings')) {
    return {
      data: {
        success: true,
        settings: store.settings || {}
      }
    };
  }

  // 14. Notifications
  if (lowerUrl.includes('/notifications')) {
    return {
      data: {
        success: true,
        notifications: []
      }
    };
  }

  // Default fallback
  return { data: { success: true } };
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000
});

// Request interceptor: If running live on Vercel without a cloud backend, serve immediately from mock
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hms_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    } else if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    // Direct client-side handling on Vercel domain when no external backend is set
    const isLiveVercel = typeof window !== 'undefined' && 
      (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('.app')) &&
      !import.meta.env.VITE_API_BASE_URL;

    if (isLiveVercel) {
      config.adapter = async (cfg) => {
        try {
          const res = executeMockRequest(cfg.url, cfg.method, cfg.data);
          return {
            data: res.data,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: cfg,
            request: {}
          };
        } catch (err) {
          return Promise.reject({
            response: {
              status: 400,
              data: { success: false, message: err.message || 'Action failed' }
            },
            message: err.message || 'Action failed'
          });
        }
      };
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Catches 405 (Vercel static rewrite), 404, or network error
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response ? error.response.status : null;
    const url = error.config ? (error.config.url || '') : '';
    const method = error.config ? (error.config.method || 'get').toLowerCase() : 'get';

    // 401 unauthenticated
    if (status === 401 && !url.includes('/auth/login')) {
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('hms_token');
        localStorage.removeItem('hms_user');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Catch 405, 404, 500, network errors
    if (status === 405 || status === 404 || status >= 500 || !status) {
      try {
        const mockRes = executeMockRequest(url, method, error.config?.data);
        return Promise.resolve(mockRes);
      } catch (mockErr) {
        return Promise.reject(mockErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
