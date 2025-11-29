const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { getAllClients, getClientFiles, createClient, updateClient, getClientStats } = require('../controllers/clientController');

const router = express.Router();

router.use(auth);
router.get('/', getAllClients);
router.get('/:clientId/files', getClientFiles);
router.get('/:clientId/stats', getClientStats);
router.post('/', authorize('admin', 'employee'), createClient);
router.put('/:id', authorize('admin', 'employee'), updateClient);

module.exports = router;