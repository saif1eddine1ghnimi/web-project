const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { uploadDocument, getFileDocuments, getClientDocuments, deleteDocument } = require('../controllers/documentController');

const router = express.Router();

router.use(auth);
router.get('/file/:fileId', getFileDocuments);
router.get('/client/:clientId', getClientDocuments);
router.post('/upload', authorize('admin', 'employee'), uploadDocument);
router.delete('/:id', authorize('admin', 'employee'), deleteDocument);

module.exports = router;