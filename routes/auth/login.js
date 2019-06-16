'use strict';

const { Router } = require('express');
const mongoose = require('mongoose');

const stringUtils = require('../../utils/strings');
const tokenUtils = require('../../utils/tokens');
const tokenTypes = require('../../constants/tokenTypes');

const router = Router();

router.post('', (request, response) => {
    const { regno, password } = request.body;

    // check for invalid user credentials
    if (stringUtils.containsEmptyString([regno, password]))
        return response
            .status(400)
            .json({ status: false, message: 'Invalid Credentials' });

    // check registration number format
    if (!stringUtils.checkRegno(regno))
        return response
            .status(400)
            .json({ status: false, message: 'Invalid Credentials' });

    // find User with provided registration number in database
    const User = mongoose.model('User');
    User.findOne({ regno }).then(data => {
        if (!data)
            return response.status(400).json({
                status: false,
                message: 'User not registered'
            });

        // check for incorrect password
        if (!stringUtils.verifyHashStr(data.password, password))
            return response
                .status(400)
                .json({ status: false, message: 'Incorrect Password' });

        // create useraccesstoken to return to the user
        const useraccesstoken = tokenUtils.encryptToken(
            {
                firstname: data.firstname,
                lastname: data.lastname,
                regno: data.regno
            },
            tokenTypes.UserAccessToken
        );

        // return useraccesstoken to the user
        response.status(200).json({
            status: true,
            message: 'User Authenticated',
            useraccesstoken
        });
    });
});

module.exports = router;
