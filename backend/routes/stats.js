const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { getDashboardStats, getClientStatistics, getMonthlyStats } = require('../controllers/statsController');

const router = express.Router();

router.use(auth);
router.get('/dashboard', getDashboardStats);
router.get('/clients', getClientStatistics);
router.get('/monthly/:year?', getMonthlyStats);

module.exports = router;