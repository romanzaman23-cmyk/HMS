const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
  addPrincipal,
  deletePrincipal
} = require('../controllers/settingController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.use(authenticateToken);
router.use(requireRole('PRINCIPAL_ADMIN'));

router.get('/', getSettings);
router.put('/', updateSettings);
router.post('/principals', addPrincipal);
router.delete('/principals/:id', deletePrincipal);

module.exports = router;
