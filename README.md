# Highlight Model School - Management Web Application

> **Motto**: *Better Learning | Brighter Future*

A modern, production-ready, full-stack school management web application designed and built with fidelity to the official UI reference specification. It features **two authenticated portals**:

1. **Principal / Admin Portal**: Complete school administration, real-time biometric attendance oversight, student directory, ZKTeco fingerprint device management, leave approvals, circular publishing, result posting, and document archiving.
2. **Parent Portal**: Dedicated monitoring center for parents with student profiles, daily and monthly attendance tracking, school circulars, academic result cards with performance gauges, leave applications with principal review feedback, and downloadable school documents.

---

## Visual Design & Aesthetics

- **Color Palette**: Curated Deep Blue & Navy (`#0e2238`, `#0a192f`), Vibrant Accent Blue (`#1a73e8`, `#2563eb`), Clean White Cards, and Crisp Status Badges (Present: Green `#10b981`, Absent: Red `#ef4444`, Pending: Amber `#f59e0b`).
- **Typography**: Clean, professional sans-serif typography using Inter.
- **Biometric Terminal Graphics**: Custom visual representation of the **ZKTeco F18** standalone biometric terminal with live status indicator and optical fingerprint sensor glow.
- **School Branding Banner**: Signature footer banner with official school emblem and motto: *"Better Learning | Brighter Future"*.

---

## Technology Stack

### Frontend
- **Framework**: React.js (Vite)
- **Language**: JavaScript (ES Modules, NO TypeScript)
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS + Custom CSS Design System
- **Icons**: Lucide React
- **HTTP Client**: Axios with Bearer token interceptor and error handling
- **Responsive**: Desktop, Tablet, and Mobile layouts

### Backend
- **Runtime**: Node.js
- **Server**: Express.js
- **Language**: JavaScript (CommonJS, NO TypeScript)
- **Architecture**: REST API with MVC pattern
- **Database Driver**: `mysql2/promise` with connection pooling
- **Security**: JWT authentication (`jsonwebtoken`), password hashing with `bcryptjs`, CORS, input sanitization
- **File Uploads**: `multer` with secure local disk storage and protected file endpoints
- **Hardware Integration**: Node.js `net.Socket` TCP/IP communication for ZKTeco-compatible biometric attendance devices (Port `4370`)

### Database
- **Engine**: MySQL (Relational InnoDB Schema)
- **Tables (14 Relational Tables)**:
  - `roles`, `users`, `classes`, `parents`, `students`
  - `attendance`, `fingerprint_devices`, `device_logs`
  - `announcements`, `results`, `result_documents`
  - `student_documents`, `leave_requests`, `notifications`

---

## Directory Structure

```text
Highlight Model School/
├── database/
│   ├── schema.sql              # MySQL database schema (14 relational tables)
│   └── seed.sql                # Initial seed data matching the UI screenshot
├── backend/
│   ├── config/
│   │   └── db.js               # MySQL2 pool with auto-reconnect & fallback cache
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── studentController.js
│   │   ├── classController.js
│   │   ├── attendanceController.js
│   │   ├── deviceController.js
│   │   ├── announcementController.js
│   │   ├── resultController.js
│   │   ├── leaveController.js
│   │   ├── documentController.js
│   │   └── notificationController.js
│   ├── middleware/
│   │   └── authMiddleware.js   # JWT verification & role authorization
│   ├── routes/                 # REST API route handlers
│   ├── services/
│   │   └── fingerprintService.js # ZKTeco TCP socket client & punch processor
│   ├── scripts/
│   │   └── init-db.js          # One-command DB schema & seed runner
│   ├── uploads/                # Secure server document & PDF store
│   ├── .env.example
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SchoolLogo.jsx
│   │   │   ├── BrandFooter.jsx
│   │   │   ├── NotificationBell.jsx
│   │   │   └── ZKTecoDeviceGraphic.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── layouts/
│   │   │   ├── AdminLayout.jsx
│   │   │   └── ParentLayout.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── AdminAttendance.jsx
│   │   │   │   ├── AdminStudents.jsx
│   │   │   │   ├── AdminDevice.jsx
│   │   │   │   ├── AdminLeaves.jsx
│   │   │   │   ├── AdminAnnouncements.jsx
│   │   │   │   ├── AdminResults.jsx
│   │   │   │   ├── AdminDocuments.jsx
│   │   │   │   └── AdminSettings.jsx
│   │   │   └── parent/
│   │   │       ├── ParentDashboard.jsx
│   │   │       ├── ParentAttendance.jsx
│   │   │       ├── ParentAnnouncements.jsx
│   │   │       ├── ParentResults.jsx
│   │   │       ├── ParentLeaves.jsx
│   │   │       └── ParentDocuments.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── .gitignore
└── README.md
```

---

## Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **MySQL** installed locally or reachable via network

### 2. Environment Variables Configuration
In `backend/.env`:
```env
PORT=5000
NODE_ENV=development

# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=highlight_school

# JWT Secret
JWT_SECRET=highlight_model_school_jwt_super_secret_key_2025_secure

# Fingerprint Biometric Device Defaults (ZKTeco Protocol TCP/IP)
DEFAULT_DEVICE_IP=192.168.1.201
DEFAULT_DEVICE_PORT=4370
DEFAULT_DEVICE_UID=123456
DEFAULT_DEVICE_LOCATION=Main Gate
```

### 3. Initialize MySQL Database & Seed Data
Run the initialization script from the `backend/` directory:
```bash
cd backend
npm run db:init
```
*Note: If your local MySQL service is stopped or not running yet, the backend includes an active synchronized data layer with the seeded school data so you can test the application.*

### 4. Running the Backend Server
```bash
cd backend
npm install
npm run dev
```
Backend runs on: `http://localhost:5000`  
Health check: `http://localhost:5000/api/health`

### 5. Running the Frontend Application
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on: `http://localhost:5173`

---

## Default Login Credentials

| Role | Email | Password |
|---|---|---|
| **Principal / Admin** | `admin@highlight.school` | `Admin@123` |
| **Parent Portal** | `parent@highlight.school` | `Parent@123` |

*The login page also provides convenient 1-click quick login buttons to switch between Principal and Parent roles instantly during testing.*

---

## Real Biometric Device Attendance Flow

The application implements an end-to-end ZKTeco-style TCP/IP architecture:

1. **Configurable Hardware Parameters**: The device IP, port (`4370`), device UID, and location are configurable from the Admin Portal.
2. **Real Connection State**: The device status displays the true network connection state via socket health probes.
3. **Attendance Scan Ingestion**:
   - When a student places their finger on the sensor, an attendance punch event is processed.
   - The backend looks up the student using their `fingerprint_device_id`.
   - The attendance record is inserted/updated in MySQL with `status = 'Present'`, `source = 'Fingerprint'`, and the exact check-in time (`08:12 AM`).
   - The Principal/Admin attendance dashboard updates in real time.
   - An in-app notification is triggered for the parent:
     > *“Ahmed Khan checked in at 8:12 AM.”*
   - The parent's dashboard and attendance history immediately display the latest check-in.
4. **Live Scan Simulator**: The **Devices (Fingerprint)** page features an interactive simulator button (`Trigger Scan Punch`) to test this complete check-in and alert sequence.
#   H M S  
 