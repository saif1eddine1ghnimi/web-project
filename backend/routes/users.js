const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { getAllUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');

const router = express.Router();

router.use(auth);
router.get('/', authorize('admin'), getAllUsers);
router.post('/', authorize('admin'), createUser);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;