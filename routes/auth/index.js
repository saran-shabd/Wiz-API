'use strict';

const { Router } = require('express');
const mongoose = require('mongoose');

const emailTypes = require('../../constants/emailTypes');
const emailUtils = require('../../utils/email');
const stringUtils = require('../../utils/strings');
const tokenUtils = require('../../utils/tokens');

const router = Router();

router.post('/sign-up', async (request, response) => {
    let { firstname, lastname, regno, password } = request.body;

    // check for invalid user credentials

    if (stringUtils.containsEmptyString([firstname, lastname, regno, password]))
        return response
            .status(400)
            .json({ status: false, message: 'Invalid Credentials' });

    if (
        !(
            stringUtils.checkRegno(regno) &&
            stringUtils.checkOnlyAlphas(firstname) &&
            stringUtils.checkOnlyAlphas(lastname)
        )
    )
        return response
            .status(400)
            .json({ status: false, message: 'Invalid Credentials' });

    // check if user with same registration number already exists in database

    const User = mongoose.model('User');

    let isError = false;
    User.findOne({ regno })
        .then(data => {
            if (data) {
                isError = true;
                response.status(400).json({
                    status: false,
                    message: 'User already registered'
                });
            }
        })
        .catch(error => {
            console.log(error);
            isError = true;
            response
                .status(500)
                .json({ status: false, message: 'Internal Server Error' });
        });

    if (isError) return;

    /**
     * OTP is generated, followed by its encryption. This OTP will expire in
     * 24 hours.
     *
     * OTP, along with other user credentials received, are then used
     * to create an user access token, which is then sent back to the user.
     *
     * For verifying OTP, the user access token will be decrypted, followed
     * by decrypting the OTP. This decrypted OTP will be then verified (to
     * check if it expired). If not, then the OTP will be compared to the OTP
     * sent by the user. If matched, then the user's account will be created.
     *
     * This is used to avoid storing OTPs in database, which will require
     * more memory and will also be slower than this process.
     */

    const otp = stringUtils.generateRandomAlphaNumericStr(10);
    const encryptedOtp = tokenUtils.encryptOtp({ otp });
    const signUpAccessToken = tokenUtils.encryptToken({
        firstname,
        lastname,
        regno,
        password,
        encryptedOtp
    });

    // send otp to user's email address

    firstname = firstname.toString().toLowerCase();
    const useremail = `${firstname}.${regno}@muj.manipal.edu`;

    // get alert-email configurations
    const transport = await emailUtils.getEmailTransport();

    // get email template and modify it
    let template = await emailUtils.getEmailTemplate(emailTypes.SignUpOtp);
    template = template
        .toString()
        .replace('@@name@@', `${firstname} ${lastname}`);
    template = template.toString().replace('@@otp@@', otp);

    // send email

    const mailOptions = {
        from: 'Connect ++',
        to: useremail,
        subject: 'Connect++ - Sign Up (OTP)',
        html: template
    };

    transport.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            return response
                .status(500)
                .json({ status: false, message: 'internal server error' });
        }
        response.status(200).json({
            status: true,
            message: 'OTP sent to email address',
            token: signUpAccessToken
        });
    });
});

router.post('/sign-up/verify', verifyToken, (request, response) => {
    let { otp } = request.body;

    // check for invalid user credentials

    if (stringUtils.containsEmptyString([otp]))
        return response
            .status(400)
            .json({ status: false, message: 'Invalid Credentials' });

    // decrypt otp

    let decryptOtp = tokenUtils.decryptOtp(
        request.decryptToken.decoded.encryptedOtp
    );
    if (!decryptOtp.status)
        return response
            .status(400)
            .json({ status: false, message: 'Invalid signUpAccessToken' });

    if (decryptOtp.decoded.otp !== otp)
        return response
            .status(400)
            .json({ status: false, message: 'Incorrect OTP' });

    // user successfully authenticated, store user in database

    // get user details from accesstoken
    const {
        firstname,
        lastname,
        password,
        regno
    } = request.decryptToken.decoded;

    let newUser = {
        firstname,
        lastname,
        password: stringUtils.hashStr(password), // store hashed password
        regno
    };

    const User = mongoose.model('User');
    new User(newUser)
        .save()
        .then(() => {
            // create useraccesstoken to return to the user
            const useraccesstoken = tokenUtils.encryptToken({
                firstname,
                lastname,
                regno
            });

            response.status(200).json({
                status: true,
                message: 'User Account Created',
                useraccesstoken
            });
        })
        .catch(error => {
            console.log(error);
            response
                .status(500)
                .json({ status: 500, message: 'Internal Server Error' });
        });
});

router.post('/login', (request, response) => {
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
        const useraccesstoken = tokenUtils.encryptToken({
            firstname: data.firstname,
            lastname: data.lastname,
            regno: data.regno
        });

        // return useraccesstoken to the user
        response.status(200).json({
            status: true,
            message: 'User Authenticated',
            useraccesstoken
        });
    });
});

router.post('/forgot-password', async (request, response) => {
    const { regno } = request.body;

    // check for invalid user credentials
    if (
        stringUtils.containsEmptyString([regno]) ||
        !stringUtils.checkRegno(regno)
    )
        response
            .status(400)
            .json({ status: false, message: 'Invalid Credentials' });

    // find User with provided registration number in database
    const User = mongoose.model('User');
    User.findOne({ regno }).then(async data => {
        if (!data)
            return response
                .status(400)
                .json({ status: false, message: 'User not registered' });

        // get user details
        let { firstname, lastname } = data;

        // generate otp and accesstoken to return to the user
        const otp = stringUtils.generateRandomAlphaNumericStr(10);
        const encryptedOtp = tokenUtils.encryptOtp({ otp });
        const forgotPasswordAccessToken = tokenUtils.encryptToken({
            firstname,
            lastname,
            regno,
            encryptedOtp
        });

        // get alert-email configurations
        const transport = await emailUtils.getEmailTransport();

        // get email template and modify it
        let template = await emailUtils.getEmailTemplate(
            emailTypes.ForgotPasswordOtp
        );
        template = template
            .toString()
            .replace('@@name@@', `${firstname} ${lastname}`);
        template = template.toString().replace('@@otp@@', otp);

        // send email

        firstname = firstname.toString().toLowerCase();
        const useremail = `${firstname}.${regno}@muj.manipal.edu`;

        const mailOptions = {
            from: 'Connect ++',
            to: useremail,
            subject: 'Connect++ - Password Recovery (OTP)',
            html: template
        };

        transport.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                return response
                    .status(500)
                    .json({ status: false, message: 'internal server error' });
            }
            response.status(200).json({
                status: true,
                message: 'OTP sent to email address',
                token: forgotPasswordAccessToken
            });
        });
    });
});

router.post('/forgot-password/verify', verifyToken, (request, response) => {
    let { otp } = request.body;

    // check for invalid user credentials
    if (stringUtils.containsEmptyString([otp]))
        return response
            .status(400)
            .json({ status: false, message: 'Invalid Credentials' });

    // decrypt otp

    let decryptOtp = tokenUtils.decryptOtp(
        request.decryptToken.decoded.encryptedOtp
    );
    if (!decryptOtp.status)
        return response
            .status(400)
            .json({ status: false, message: 'Invalid signUpAccessToken' });

    if (decryptOtp.decoded.otp !== otp)
        return response
            .status(400)
            .json({ status: false, message: 'Incorrect OTP' });

    // otp verified

    // get user details from the token
    const {
        firstname,
        lastname,
        regno,
        encryptedOtp
    } = request.decryptToken.decoded;

    let accessToken = tokenUtils.encryptToken({
        firstname,
        lastname,
        regno,
        encryptedOtp
    });
    response
        .status(200)
        .json({ status: true, message: 'OTP Verified', token: accessToken });
});

router.post('/forgot-password/update', verifyToken, (request, response) => {
    const { password } = request.body;

    // check for invalid user credentials
    if (stringUtils.containsEmptyString([password]))
        return response
            .status(400)
            .json({ status: false, message: 'Invalid Credentials' });

    // get user details from the token
    const { regno } = request.decryptToken.decoded;

    // update user password in database
    const User = mongoose.model('User');
    User.findOneAndUpdate(
        { regno },
        { password: stringUtils.hashStr(password) }
    )
        .then(() => {
            response
                .status(200)
                .json({ status: true, message: 'Password Updated' });
        })
        .catch(error => {
            console.log(error);
            response
                .status(500)
                .json({ status: false, message: 'Internal Server Error' });
        });
});

// middleware function to verify tokens, for securing routes
function verifyToken(request, response, next) {
    let { token } = request.body;
    if (stringUtils.containsEmptyString([token]))
        return response
            .status(400)
            .json({ status: false, message: 'Invalid Credentials' });
    let decryptedToken = tokenUtils.decryptToken(token);
    if (!decryptedToken.status)
        return response
            .status(400)
            .json({ status: false, message: 'Invalid Token' });

    request.decryptToken = decryptedToken;
    next();
}

module.exports = router;
