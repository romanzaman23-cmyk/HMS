-- Highlight Model School - Relational Database Schema
-- Database: highlight_school

CREATE DATABASE IF NOT EXISTS highlight_school CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE highlight_school;

-- Disable foreign key checks for clean teardown/setup
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS leave_requests;
DROP TABLE IF EXISTS result_documents;
DROP TABLE IF EXISTS results;
DROP TABLE IF EXISTS announcements;
DROP TABLE IF EXISTS device_logs;
DROP TABLE IF EXISTS fingerprint_devices;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS parents;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Roles Table
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NULL,
    avatar_url VARCHAR(255) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 3. Classes Table
CREATE TABLE classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- e.g. "Grade 5", "Grade 6", "Grade 7", "Grade 8"
    section VARCHAR(20) DEFAULT 'A',
    room_number VARCHAR(30) NULL,
    capacity INT DEFAULT 35,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Parents Table
CREATE TABLE parents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    occupation VARCHAR(100) NULL,
    address TEXT NULL,
    emergency_contact VARCHAR(30) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Students Table
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NOT NULL,
    class_id INT NOT NULL,
    roll_number VARCHAR(30) NOT NULL UNIQUE, -- e.g. "025" or "HMS-2025-025"
    full_name VARCHAR(100) NOT NULL,
    gender ENUM('Male', 'Female', 'Other') DEFAULT 'Male',
    date_of_birth DATE NULL,
    fingerprint_device_id VARCHAR(50) NULL UNIQUE, -- Device biometric enrollment identifier
    status ENUM('Active', 'Inactive', 'Suspended') DEFAULT 'Active',
    avatar_url VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE RESTRICT,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE RESTRICT,
    INDEX idx_student_roll (roll_number),
    INDEX idx_student_fingerprint (fingerprint_device_id)
) ENGINE=InnoDB;

-- 6. Attendance Table
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    check_in_time TIME NULL,
    check_out_time TIME NULL,
    status ENUM('Present', 'Absent', 'Checked Out') DEFAULT 'Present',
    source ENUM('Fingerprint', 'Manual') DEFAULT 'Fingerprint',
    device_id INT NULL,
    remarks VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_student_date (student_id, attendance_date),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_attendance_date (attendance_date),
    INDEX idx_attendance_status (status)
) ENGINE=InnoDB;

-- 7. Fingerprint Devices Table
CREATE TABLE fingerprint_devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_name VARCHAR(100) NOT NULL, -- e.g. "ZKTeco F18"
    ip_address VARCHAR(45) NOT NULL, -- e.g. "192.168.1.201"
    port INT DEFAULT 4370,
    device_uid VARCHAR(50) NOT NULL UNIQUE, -- e.g. "123456"
    location VARCHAR(100) DEFAULT 'Main Gate',
    connection_status ENUM('Connected', 'Disconnected', 'Error') DEFAULT 'Disconnected',
    last_sync_time TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 8. Device Logs Table
CREATE TABLE device_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id INT NOT NULL,
    event_type ENUM('Connection', 'Disconnection', 'Sync', 'AttendanceScan', 'Error') NOT NULL,
    message TEXT NOT NULL,
    raw_payload TEXT NULL,
    log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES fingerprint_devices(id) ON DELETE CASCADE,
    INDEX idx_log_time (log_time)
) ENGINE=InnoDB;

-- 9. Announcements Table
CREATE TABLE announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    announcement_date DATE NOT NULL,
    status ENUM('Published', 'Draft') DEFAULT 'Published',
    author_id INT NOT NULL,
    target_role ENUM('All', 'Parents', 'Teachers') DEFAULT 'All',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_announcement_date (announcement_date)
) ENGINE=InnoDB;

-- 10. Results Table (Academic Subject Results)
CREATE TABLE results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    term VARCHAR(50) NOT NULL, -- e.g. "Term 1 (2025-26)"
    subject VARCHAR(100) NOT NULL, -- e.g. "English", "Mathematics", "Science"
    marks DECIMAL(5,2) NOT NULL, -- e.g. 85.00
    total_marks DECIMAL(5,2) DEFAULT 100.00,
    grade VARCHAR(10) NOT NULL, -- e.g. "A+", "A", "B+"
    overall_performance VARCHAR(50) DEFAULT 'Excellent',
    result_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE RESTRICT,
    INDEX idx_result_term (term),
    INDEX idx_result_student (student_id)
) ENGINE=InnoDB;

-- 11. Result Documents Table (Uploaded PDF / Result Sheets)
CREATE TABLE result_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    term VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL, -- e.g. "Term 1 Result Sheet.pdf"
    file_path VARCHAR(255) NOT NULL,
    file_size_formatted VARCHAR(50) DEFAULT '2.4 MB',
    file_type VARCHAR(50) DEFAULT 'application/pdf',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_doc_student (student_id)
) ENGINE=InnoDB;

-- 12. Student Documents / Academic Performance Records
CREATE TABLE student_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    category ENUM('Result Paper', 'Performance Report', 'Academic Record', 'Certificate') DEFAULT 'Academic Record',
    file_path VARCHAR(255) NOT NULL,
    file_size_formatted VARCHAR(50) DEFAULT '1.2 MB',
    uploaded_by INT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 13. Leave Requests Table
CREATE TABLE leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    parent_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason VARCHAR(150) NOT NULL, -- e.g. "Medical Check-up", "Family Function"
    additional_details TEXT NULL,
    attachment_url VARCHAR(255) NULL,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    admin_remarks TEXT NULL,
    reviewed_by INT NULL,
    reviewed_at TIMESTAMP NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_leave_status (status)
) ENGINE=InnoDB;

-- 14. Notifications Table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('Attendance', 'Announcement', 'Result', 'Leave Request', 'Leave Status', 'System') NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notif_user_unread (user_id, is_read)
) ENGINE=InnoDB;
