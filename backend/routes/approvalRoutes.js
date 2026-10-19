const express = require('express');
const router = express.Router();
const {
  submitRegistration,
  checkRegistrationStatus,
  getRegistrations,
  approveRegistration,
  rejectRegistration
} = require('../controllers/approvalController');
const { authenticateToken, requireRole, upload } = require('../middleware/authMiddleware');

// Public route: Allow student / parent to register an account from the mobile app or web with optional photo upload
router.post('/register', upload.single('avatar'), submitRegistration);
router.get('/status', checkRegistrationStatus);
router.get('/status/:id', checkRegistrationStatus);

// Admin-only routes: view, approve, and reject registrations
router.get('/', authenticateToken, requireRole('PRINCIPAL_ADMIN'), getRegistrations);
router.put('/:id/approve', authenticateToken, requireRole('PRINCIPAL_ADMIN'), approveRegistration);
router.put('/:id/reject', authenticateToken, requireRole('PRINCIPAL_ADMIN'), rejectRegistration);
router.delete('/:id', authenticateToken, requireRole('PRINCIPAL_ADMIN'), rejectRegistration);

module.exports = router;
