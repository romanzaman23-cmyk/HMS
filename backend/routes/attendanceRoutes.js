const express = require('express');
const router = express.Router();
const {
  getAttendance,
  getAttendanceSummary,
  getStudentAttendance,
  recordAttendanceManual,
  getPunches,
  bulkImportAttendance
} = require('../controllers/attendanceController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', getAttendance);
router.get('/summary', getAttendanceSummary);
router.get('/punches', getPunches);
router.get('/student/:id', getStudentAttendance);
router.post('/bulk', requireRole('PRINCIPAL_ADMIN'), bulkImportAttendance);
router.post('/manual', requireRole('PRINCIPAL_ADMIN'), recordAttendanceManual);

module.exports = router;
