const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { getExpenseTypes, addFileExpense, getFileExpenses, deleteExpense } = require('../controllers/expenseController');

const router = express.Router();

router.use(auth);
router.get('/types', getExpenseTypes);
router.get('/file/:fileId', getFileExpenses);
router.post('/', authorize('admin', 'employee'), addFileExpense);
router.delete('/:id', authorize('admin', 'employee'), deleteExpense);

module.exports = router;