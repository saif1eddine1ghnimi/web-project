const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { getAllFiles, getFileById, createFile, updateFile, moveToPaid } = require('../controllers/fileController');

const router = express.Router();

router.use(auth);
router.get('/', getAllFiles);
router.get('/:id', getFileById);
router.post('/', authorize('admin', 'employee'), createFile);
router.put('/:id', authorize('admin', 'employee'), updateFile);
router.post('/:id/move-to-paid', authorize('admin', 'employee'), moveToPaid);

module.exports = router;