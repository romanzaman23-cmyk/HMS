const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  uploadStudentAvatar,
  deleteStudent,
  bulkImportStudents
} = require('../controllers/studentController');
const { authenticateToken, requireRole, upload } = require('../middleware/authMiddleware');

// Student avatar upload: Allowed for Admin, Parent, and direct Mobile App sync
router.post('/:id/avatar', upload.single('avatar'), uploadStudentAvatar);

router.use(authenticateToken);

router.get('/', getStudents);
router.get('/:id', getStudentById);
router.post('/bulk', requireRole('PRINCIPAL_ADMIN'), bulkImportStudents);
router.post('/', requireRole('PRINCIPAL_ADMIN'), createStudent);
router.put('/:id', updateStudent); // Allowed for Admin and Parent
router.delete('/:id', requireRole('PRINCIPAL_ADMIN'), deleteStudent);

module.exports = router;
