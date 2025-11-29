const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { getClientCases, createCase, updateCase } = require('../controllers/caseController');

const router = express.Router();

router.use(auth);
router.get('/client/:clientId', getClientCases);
router.post('/', authorize('admin', 'employee'), createCase);
router.put('/:id', authorize('admin', 'employee'), updateCase);

module.exports = router;