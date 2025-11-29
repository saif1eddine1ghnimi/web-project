const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { getAllTasks, createTask, updateTask, getUserTasks } = require('../controllers/taskController');

const router = express.Router();

router.use(auth);
router.get('/', getAllTasks);
router.get('/my-tasks', getUserTasks);
router.post('/', authorize('admin', 'employee'), createTask);
router.put('/:id', updateTask);

module.exports = router;