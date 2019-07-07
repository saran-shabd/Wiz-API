'use strict';

const { Router } = require('express');

const router = Router();

// load routes
router.use('/auth', require('./auth'));
router.use('/profile', require('./profile'));
router.use('/search', require('./search'));

// invalid route handler
router.use('*', (request, response) => {
  response
    .status(404)
    .json({ status: false, message: 'This route does not exists' });
});

module.exports = router;
