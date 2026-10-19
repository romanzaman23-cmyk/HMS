const express = require('express');
const router = express.Router();
const {
  getLeaves,
  createLeaveRequest,
  approveLeave,
  rejectLeave
} = require('../controllers/leaveController');
const { authenticateToken, requireRole, upload } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', getLeaves);
router.post('/', upload.single('attachment'), createLeaveRequest);
router.put('/:id/approve', requireRole('PRINCIPAL_ADMIN'), approveLeave);
router.put('/:id/reject', requireRole('PRINCIPAL_ADMIN'), rejectLeave);

module.exports = router;
