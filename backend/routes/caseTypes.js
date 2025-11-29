const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { getCaseTypes, createCaseType, deleteCaseType } = require('../controllers/caseTypeController');

const router = express.Router();

router.use(auth);
router.get('/', getCaseTypes);
router.post('/', authorize('admin', 'employee'), createCaseType);
router.delete('/:id', authorize('admin'), deleteCaseType);

module.exports = router;