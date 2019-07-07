'use strict';

const { Router } = require('express');
const mongoose = require('mongoose');

const emailTypes = require('../../constants/emailTypes');
const emailUtils = require('../../utils/email');
const stringUtils = require('../../utils/strings');
const tokenUtils = require('../../utils/tokens');
const tokenTypes = require('../../constants/tokenTypes');
const { logError } = require('../../utils/logging');

const router = Router();

router.post('', async (request, response) => {
  const { regno } = request.body;

  // check for invalid user credentials
  if (
    stringUtils.containsEmptyString([regno]) ||
    !stringUtils.checkRegno(regno)
  )
    return response
      .status(400)
      .json({ status: false, message: 'Invalid Credentials' });

  // find User with provided registration number in database
  const User = mongoose.model('User');
  User.findOne({ regno })
    .then(async data => {
      if (!data)
        return response
          .status(400)
          .json({ status: false, message: 'User not registered' });

      // get user details
      let { firstname, lastname } = data;

      // generate otp and accesstoken to return to the user
      const otp = stringUtils.generateRandomAlphaNumericStr(10);
      const encryptedOtp = tokenUtils.encryptOtp({ otp });
      const forgotPasswordAccessToken = tokenUtils.encryptToken(
        {
          firstname,
          lastname,
          regno,
          encryptedOtp
        },
        tokenTypes.ForgotPasswordAccessToken
      );

      // get alert-email configurations
      const transport = await emailUtils.getEmailTransport();
      if (null === transport) {
        // Error already logged
        return response
          .status(500)
          .json({ status: 500, message: 'Internal Server Error' });
      }

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
        from: 'Connect++',
        to: useremail,
        subject: 'Connect++ - Password Recovery (OTP)',
        html: template
      };

      transport.sendMail(mailOptions, (error, info) => {
        if (error) {
          // Log Error
          logError(error, {
            message: 'Error in sending email to the user',
            location: 'routes/auth/forget-password',
            requestType: 'POST',
            requestUrl: '/auth/forget-password'
          });
          return response
            .status(500)
            .json({ status: false, message: 'Internal Server Error' });
        }
        response.status(200).json({
          status: true,
          message: 'OTP sent to email address',
          token: forgotPasswordAccessToken
        });
      });
    })
    .catch(error => {
      // Log Error
      logError(error, {
        message: 'Error in finding User in database',
        location: 'routes/auth/forget-password',
        requestType: 'POST',
        requestUrl: '/auth/forget-password'
      });
      response
        .status(500)
        .json({ status: false, message: 'Internal Server Error' });
    });
});

router.post(
  '/verify',
  tokenUtils.verifyTokenMiddleware(tokenTypes.ForgotPasswordAccessToken),
  (request, response) => {
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

    let accessToken = tokenUtils.encryptToken(
      {
        firstname,
        lastname,
        regno,
        encryptedOtp
      },
      tokenTypes.ForgotPasswordVerifyAccessToken
    );
    response.status(200).json({
      status: true,
      message: 'OTP Verified',
      token: accessToken
    });
  }
);

router.post(
  '/update',
  tokenUtils.verifyTokenMiddleware(tokenTypes.ForgotPasswordVerifyAccessToken),
  (request, response) => {
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
        // Log Error
        logError(error, {
          message: 'Error in updating user password',
          location: 'routes/auth/forget-password',
          requestType: 'POST',
          requestUrl: '/auth/forget-password/update'
        });
        response
          .status(500)
          .json({ status: false, message: 'Internal Server Error' });
      });
  }
);

module.exports = router;
