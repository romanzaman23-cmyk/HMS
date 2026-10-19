const express = require('express');
const router = express.Router();
const { getClasses } = require('../controllers/classController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);
router.get('/', getClasses);

module.exports = router;
