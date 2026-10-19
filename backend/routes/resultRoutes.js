const express = require('express');
const router = express.Router();
const {
  getResults,
  getResultDocuments,
  getStudentResultsPackage,
  createResult,
  uploadResultDocument,
  downloadResultDocument,
  getResultDocumentPreview,
  deleteResultDocument,
  processPromotion
} = require('../controllers/resultController');
const { authenticateToken, requireRole, upload } = require('../middleware/authMiddleware');

// Public preview & download result document endpoints (NO token required, immune to IDM download hijacking)
router.get('/documents/:id/preview', getResultDocumentPreview);
router.get('/documents/:id/download', downloadResultDocument);
router.get('/public', getResults);
router.get('/public/:id', getStudentResultsPackage);

router.use(authenticateToken);

router.get('/', getResults);
router.get('/documents', getResultDocuments);
router.get('/student/:id', getStudentResultsPackage);
router.post('/', requireRole('PRINCIPAL_ADMIN'), upload.any(), createResult);
router.post('/upload-document', requireRole('PRINCIPAL_ADMIN'), upload.any(), uploadResultDocument);
router.post('/process-promotion', requireRole('PRINCIPAL_ADMIN'), processPromotion);
router.delete('/documents/:id', requireRole('PRINCIPAL_ADMIN'), deleteResultDocument);

module.exports = router;
