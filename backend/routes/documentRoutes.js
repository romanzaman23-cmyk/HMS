const express = require('express');
const router = express.Router();
const {
  getDocuments,
  uploadDocument,
  downloadDocument,
  getDocumentPreview,
  getFilePreviewByPath,
  deleteDocument,
  saveGeneratedCertificate
} = require('../controllers/documentController');
const { authenticateToken, requireRole, upload } = require('../middleware/authMiddleware');

// Public preview & download endpoints (JSON preview is 100% immune to IDM download hijacking)
router.get('/preview-file', getFilePreviewByPath);
router.get('/:id/preview', getDocumentPreview);
router.get('/:id/download', downloadDocument);

router.use(authenticateToken);

router.get('/', getDocuments);
router.post('/upload', requireRole('PRINCIPAL_ADMIN'), upload.any(), uploadDocument);
router.post('/certificate', requireRole('PRINCIPAL_ADMIN'), saveGeneratedCertificate);
router.delete('/:id', requireRole('PRINCIPAL_ADMIN'), deleteDocument);

module.exports = router;
