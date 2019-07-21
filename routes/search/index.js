'use strict';

const { Router } = require('express');

const router = Router();

// load routes
router.use('/text-match', require('./text-match'));
router.use('/profiles', require('./profiles'));

module.exports = router;
