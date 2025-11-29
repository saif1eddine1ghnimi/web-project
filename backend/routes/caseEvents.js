const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { getCaseEvents, createCaseEvent, deleteCaseEvent } = require('../controllers/caseEventController');

const router = express.Router();

router.use(auth);
router.get('/case/:caseId', getCaseEvents);
router.post('/', authorize('admin', 'employee'), createCaseEvent);
router.delete('/:id', authorize('admin', 'employee'), deleteCaseEvent);

module.exports = router;