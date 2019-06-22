'use strict';

const { Router } = require('express');

const tokenTypes = require('../../constants/tokenTypes');
const tokenUtils = require('../../utils/tokens');

const router = Router();

// route to validate an user access token
router.post('', tokenUtils.verifyTokenMiddleware(tokenTypes.UserAccessToken), (request, response) => {
    // if code reached here, then that means that the access token has been verified
    response.status(200).json({status: true, message: 'useraccesstoken verified'});
});

// load all sub-routes
router.use('/sign-up', require('./sign-up'));
router.use('/login', require('./login'));
router.use('/forgot-password', require('./forget-password'));

module.exports = router;
