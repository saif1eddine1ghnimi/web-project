const express = require('express');
const { login, clientLogin } = require('../controllers/authController');
const router = express.Router();

router.post('/login', login);
router.post('/client-login', clientLogin);

module.exports = router;