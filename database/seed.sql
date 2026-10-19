-- Highlight Model School - Seed Data
-- Database: highlight_school

USE highlight_school;

-- 1. Insert Roles
INSERT INTO roles (id, name, description) VALUES
(1, 'PRINCIPAL_ADMIN', 'School Principal and Administrative Head'),
(2, 'PARENT', 'Student Parent/Guardian')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Insert Users
-- Passwords:
-- Admin: Admin@123 -> $2b$10$tZkS2h8v98g3Y0R6fVn6xe8r6WvQzQeXqR8B1iGvWq8Z7K.0OqNge
-- Parent: Parent@123 -> $2b$10$r.Zq8bH1tY/5Yl6y7O6jEOGeQo5KqFqBf4K4Q3vN9cT2hZ7m6sNme
-- (The seed runner also hashes dynamically if needed)
INSERT INTO users (id, role_id, email, password_hash, full_name, phone, avatar_url, is_active) VALUES
(1, 1, 'admin@highlight.school', '$2a$10$B5n8J0b9QzEomC8bQz5h1.2QZc4tZ5K2lX8y9vN2m1w3a4b5c6d7e', 'Admin Principal', '+1 555-0199', '/assets/avatars/admin.png', TRUE),
(2, 2, 'parent@highlight.school', '$2a$10$B5n8J0b9QzEomC8bQz5h1.2QZc4tZ5K2lX8y9vN2m1w3a4b5c6d7e', 'Tariq Khan', '+1 555-0245', '/assets/avatars/parent.png', TRUE)
ON DUPLICATE KEY UPDATE email=VALUES(email);

-- 3. Insert Classes
INSERT INTO classes (id, name, section, room_number, capacity) VALUES
(1, 'Grade 5', 'A', 'Room 101', 30),
(2, 'Grade 6', 'A', 'Room 102', 30),
(3, 'Grade 7', 'A', 'Room 201', 32),
(4, 'Grade 8', 'A', 'Room 202', 35)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 4. Insert Parents
INSERT INTO parents (id, user_id, occupation, address, emergency_contact) VALUES
(1, 2, 'Software Engineer', '45 Model Town, City Center', '+1 555-0249')
ON DUPLICATE KEY UPDATE user_id=VALUES(user_id);

-- 5. Insert Students
INSERT INTO students (id, parent_id, class_id, roll_number, full_name, gender, date_of_birth, fingerprint_device_id, status) VALUES
(1, 1, 1, '025', 'Ahmed Khan', 'Male', '2014-04-12', 'FP-025', 'Active'),
(2, 1, 2, '026', 'Ayesha Noor', 'Female', '2013-08-20', 'FP-026', 'Active'),
(3, 1, 3, '027', 'Ali Raza', 'Male', '2012-01-15', 'FP-027', 'Active'),
(4, 1, 4, '028', 'Sara Fatima', 'Female', '2011-11-05', 'FP-028', 'Active'),
(5, 1, 1, '029', 'Hamza Shah', 'Male', '2014-06-18', 'FP-029', 'Active'),
(6, 1, 2, '030', 'Rida Fatima', 'Female', '2013-09-24', 'FP-030', 'Active'),
(7, 1, 3, '031', 'Usman Ali', 'Male', '2012-05-30', 'FP-031', 'Active'),
(8, 1, 4, '032', 'Sana Khan', 'Female', '2011-12-14', 'FP-032', 'Active')
ON DUPLICATE KEY UPDATE roll_number=VALUES(roll_number);

-- 6. Insert Fingerprint Device
INSERT INTO fingerprint_devices (id, device_name, ip_address, port, device_uid, location, connection_status, last_sync_time, is_active) VALUES
(1, 'ZKTeco F18', '192.168.1.201', 4370, '123456', 'Main Gate', 'Connected', NOW(), TRUE)
ON DUPLICATE KEY UPDATE device_name=VALUES(device_name);

-- 7. Insert Attendance Records (Matching the reference screenshot)
INSERT INTO attendance (id, student_id, attendance_date, check_in_time, status, source, device_id) VALUES
(1, 1, CURDATE(), '08:12:00', 'Present', 'Fingerprint', 1),
(2, 2, CURDATE(), '08:15:00', 'Present', 'Fingerprint', 1),
(3, 3, CURDATE(), '08:20:00', 'Present', 'Fingerprint', 1),
(4, 4, CURDATE(), '08:25:00', 'Present', 'Fingerprint', 1),
(5, 5, CURDATE(), '08:28:00', 'Absent', 'Manual', NULL),
(6, 6, CURDATE(), '08:32:00', 'Present', 'Fingerprint', 1),
(7, 7, CURDATE(), '08:36:00', 'Present', 'Fingerprint', 1),
(8, 8, CURDATE(), '08:40:00', 'Present', 'Fingerprint', 1)
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- Attendance history for Ahmed Khan (for Parent Attendance calendar/table)
INSERT INTO attendance (student_id, attendance_date, check_in_time, status, source, device_id) VALUES
(1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '08:10:00', 'Present', 'Fingerprint', 1),
(1, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '08:18:00', 'Present', 'Fingerprint', 1),
(1, DATE_SUB(CURDATE(), INTERVAL 3 DAY), '08:15:00', 'Present', 'Fingerprint', 1),
(1, DATE_SUB(CURDATE(), INTERVAL 4 DAY), '00:00:00', 'Absent', 'Manual', NULL),
(1, DATE_SUB(CURDATE(), INTERVAL 5 DAY), '08:20:00', 'Present', 'Fingerprint', 1),
(1, DATE_SUB(CURDATE(), INTERVAL 6 DAY), '08:17:00', 'Present', 'Fingerprint', 1),
(1, DATE_SUB(CURDATE(), INTERVAL 7 DAY), '08:11:00', 'Present', 'Fingerprint', 1)
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- 8. Insert Device Logs
INSERT INTO device_logs (device_id, event_type, message, raw_payload) VALUES
(1, 'Connection', 'Device ZKTeco F18 connected successfully on port 4370', '{"ip":"192.168.1.201","port":4370,"handshake":"OK"}'),
(1, 'Sync', 'Student biometrics synced to device (8 active enrollments)', '{"synced_count":8,"device_uid":"123456"}'),
(1, 'AttendanceScan', 'Fingerprint verified for Student Ahmed Khan (Roll 025)', '{"uid":"FP-025","time":"08:12:00","verify_mode":"FINGERPRINT"}'),
(1, 'AttendanceScan', 'Fingerprint verified for Student Ayesha Noor (Roll 026)', '{"uid":"FP-026","time":"08:15:00","verify_mode":"FINGERPRINT"}');

-- 9. Insert Announcements
INSERT INTO announcements (id, title, description, announcement_date, status, author_id, target_role) VALUES
(1, 'School Closure Notice', 'School will remain closed on 5th Oct 2025 due to scheduled national public holiday observances and administrative maintenance.', '2025-10-01', 'Published', 1, 'All'),
(2, 'Parent Teacher Meeting', 'PTM will be held on 10th Oct 2025 at 9:00 AM in the Main Auditorium. Please ensure to arrive on time to review academic progress.', '2025-09-30', 'Published', 1, 'Parents'),
(3, 'New Library Books', 'We are pleased to inform you that new books including science encyclopedia and STEM journals have arrived in the library.', '2025-09-26', 'Published', 1, 'All')
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- 10. Insert Results for Ahmed Khan (Grade 5, Term 1)
INSERT INTO results (student_id, class_id, term, subject, marks, total_marks, grade, overall_performance, result_date) VALUES
(1, 1, 'Term 1 (2025-26)', 'English', 85.00, 100.00, 'A', 'Excellent', '2025-09-28'),
(1, 1, 'Term 1 (2025-26)', 'Mathematics', 92.00, 100.00, 'A+', 'Outstanding', '2025-09-28'),
(1, 1, 'Term 1 (2025-26)', 'Science', 88.00, 100.00, 'A', 'Excellent', '2025-09-28'),
(1, 1, 'Term 1 (2025-26)', 'Urdu', 90.00, 100.00, 'A+', 'Outstanding', '2025-09-28'),
(1, 1, 'Term 1 (2025-26)', 'Social Studies', 86.00, 100.00, 'A', 'Excellent', '2025-09-28');

-- 11. Insert Result Document
INSERT INTO result_documents (student_id, term, title, file_path, file_size_formatted, file_type) VALUES
(1, 'Term 1 (2025-26)', 'Term 1 Result Sheet.pdf', 'uploads/sample-term1-result.pdf', '2.4 MB', 'application/pdf');

-- 12. Insert Leave Requests for Ahmed Khan
INSERT INTO leave_requests (id, student_id, parent_id, start_date, end_date, reason, additional_details, status) VALUES
(1, 1, 1, '2025-10-05', '2025-10-06', 'Medical Checkup', 'My child is unable to attend school due to a scheduled medical appointment with the paediatrician. Kindly approve the leave request.', 'Pending'),
(2, 1, 1, '2025-09-12', '2025-09-13', 'Family Function', 'Attending an out-of-town wedding ceremony with immediate family members.', 'Approved'),
(3, 1, 1, '2025-08-01', '2025-08-02', 'Fever', 'Suffering from mild seasonal flu and advised bed rest by doctor.', 'Approved')
ON DUPLICATE KEY UPDATE reason=VALUES(reason);

-- 13. Insert Notifications for Parent
INSERT INTO notifications (user_id, title, message, type, is_read, action_url) VALUES
(2, 'Attendance Alert', 'Ahmed Khan checked in at school today at 08:12 AM.', 'Attendance', FALSE, '/parent/attendance'),
(2, 'New Announcement', 'A new announcement has been posted: School Closure Notice.', 'Announcement', FALSE, '/parent/announcements'),
(2, 'Term Result Released', 'Result for Term 1 (2025-26) is available now. Overall Grade: A+.', 'Result', FALSE, '/parent/results'),
(2, 'Leave Request Approved', 'Your leave request for Ahmed Khan (12 Sep 2025) has been approved.', 'Leave Status', TRUE, '/parent/leave-request');

-- Notifications for Principal / Admin
INSERT INTO notifications (user_id, title, message, type, is_read, action_url) VALUES
(1, 'Pending Leave Request', 'Tariq Khan submitted a leave request for Ahmed Khan (Medical Checkup).', 'Leave Request', FALSE, '/admin/leave-management'),
(1, 'Device Status', 'Fingerprint device ZKTeco F18 is online at Main Gate.', 'System', TRUE, '/admin/devices');
