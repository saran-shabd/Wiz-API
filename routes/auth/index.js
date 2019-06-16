'use strict';

const { Router } = require('express');

const router = Router();

// load all sub-routes
router.use('/sign-up', require('./sign-up'));
router.use('/login', require('./login'));
router.use('/forgot-password', require('./forget-password'));

module.exports = router;
