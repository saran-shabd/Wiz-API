'use strict';

const { Router } = require('express');

const router = Router();
const mongoose = require('mongoose');

const emailTypes = require('../../constants/emailTypes');
const emailUtils = require('../../utils/email');
const stringUtils = require('../../utils/strings');
const tokenUtils = require('../../utils/tokens');
const tokenTypes = require('../../constants/tokenTypes');
const { logError } = require('../../utils/logging');

/**
 * @public
 * @param { firstname, lastname, regno, password }
 * @returns { token: signUpAccessToken }
 * @description Send OTP to user via email after verification
 */
router.post('', async (request, response) => {
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

  // check if user with same registration number is already registered
  const User = mongoose.model('User');
  User.findOne({ regno })
    .then(async data => {
      if (data)
        return response.status(400).json({
          status: false,
          message: 'User already registered'
        });

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
      const signUpAccessToken = tokenUtils.encryptToken(
        {
          firstname,
          lastname,
          regno,
          password,
          encryptedOtp
        },
        tokenTypes.SignUpAccessToken
      );

      // send otp to user's email address

      firstname = firstname.toString().toLowerCase();
      const useremail = `${firstname}.${regno}@muj.manipal.edu`;

      // get alert-email configurations
      const transport = await emailUtils.getEmailTransport();
      if (null === transport) {
        // Error already Logged
        return response
          .status(500)
          .json({ status: false, message: 'Internal Server Error' });
      }

      // get email template and modify it
      let template = await emailUtils.getEmailTemplate(emailTypes.SignUpOtp);
      template = template
        .toString()
        .replace('@@name@@', `${firstname} ${lastname}`);
      template = template.toString().replace('@@otp@@', otp);

      // send email

      const mailOptions = {
        from: 'Connect++',
        to: useremail,
        subject: 'Connect++ - Sign Up (OTP)',
        html: template
      };

      transport.sendMail(mailOptions, (error, info) => {
        if (error) {
          // Log Error
          logError(error, {
            message: 'Error in sending email to the user',
            location: 'routes/auth/sign-up',
            requestType: 'POST',
            requestUrl: '/auth/sign-up'
          });
          return response.status(500).json({
            status: false,
            message: 'internal server error'
          });
        }
        response.status(200).json({
          status: true,
          message: 'OTP sent to email address',
          token: signUpAccessToken
        });
      });
    })
    .catch(error => {
      // Log Error
      logError(error, {
        message: 'Error in finding User in database',
        location: 'routes/auth/sign-up',
        requestType: 'POST',
        requestUrl: '/auth/sign-up'
      });
      response
        .status(500)
        .json({ status: false, message: 'Internal Server Error' });
    });
});

/**
 * @private
 * @param { token: signUpAccessToken, otp }
 * @returns { useraccesstoken }
 * @description Sign Up User after final verification
 */
router.post(
  '/verify',
  tokenUtils.verifyTokenMiddleware(tokenTypes.SignUpAccessToken),
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
        const useraccesstoken = tokenUtils.encryptToken(
          {
            firstname,
            lastname,
            regno
          },
          tokenTypes.UserAccessToken
        );

        response.status(200).json({
          status: true,
          message: 'User Account Created',
          useraccesstoken
        });
      })
      .catch(error => {
        if (error.code === 11000)
          return response.status(400).json({
            status: false,
            message: 'User already registered'
          });

        // Log Error
        logError(error, {
          message: 'Error in storing new user in database',
          location: 'routes/auth/sign-up',
          requestType: 'POST',
          requestUrl: '/auth/sign-up/verify'
        });

        response.status(500).json({
          status: 500,
          message: 'Internal Server Error'
        });
      });
  }
);

module.exports = router;
