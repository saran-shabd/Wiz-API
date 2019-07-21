'use strict';

const { Router } = require('express');
const mongoose = require('mongoose');

const { containsEmptyString, checkRegno } = require('../../utils/strings');
const tokenTypes = require('../../constants/tokenTypes');
const {
  verifyTokenMiddlewareGetRequests,
  encryptToken
} = require('../../utils/tokens');
const { logError } = require('../../utils/logging');

const router = Router();

/**
 * @private
 * @param {}
 * @returns { users }
 * @description Get all users basic information
 */
router.get(
  '/get-all',
  verifyTokenMiddlewareGetRequests(tokenTypes.UserAccessToken),
  (request, response) => {
    const User = mongoose.model('User');
    User.find()
      .then(data => {
        return response
          .status(200)
          .json({ status: true, message: 'Returning all users', users: data });
      })
      .catch(error => {
        // Log Error
        logError(error, {
          message: 'Error in fetching all users from database',
          location: 'routes/search/text-match',
          requestType: 'GET',
          requestUrl: '/search/text-match/get-all'
        });
        response
          .status(500)
          .json({ status: false, message: 'Internal Server Error' });
      });
  }
);

/**
 * @private
 * @param { fullname }
 * @returns { users }
 * @description Get SearchAccessToken for the searched user using fullname
 */
router.get(
  '/user/fullname',
  verifyTokenMiddlewareGetRequests(tokenTypes.UserAccessToken),
  (request, response) => {
    const { fullname } = request.query;

    // check for invalid credentials
    if (containsEmptyString([fullname])) {
      return response
        .status(400)
        .json({ status: false, message: 'Invalid Credentials' });
    }

    // search the user
    const User = mongoose.model('User');
    User.findOne({
      firstname: fullname.split(' ')[0],
      lastname: fullname.split(' ')[1]
    })
      .then(data => {
        if (!data) {
          // user not found
          return response
            .status(400)
            .json({ status: false, message: 'User Not Found' });
        } else {
          // user found
          return response.status(200).json({
            status: true,
            message: 'User Found',
            searchAccessToken: encryptToken(
              { ...data._doc },
              tokenTypes.SearchAccessToken
            )
          });
        }
      })
      .catch(error => {
        // Log Error
        logError(error, {
          message: 'Error in getting user profile from database using fullname',
          location: 'routes/search/text-match',
          requestType: 'GET',
          requestUrl: '/search/text-match/user/fullname'
        });
        response
          .status(500)
          .json({ status: false, message: 'Internal Server Error' });
      });
  }
);

/**
 * @private
 * @param { regno }
 * @returns { users }
 * @description Get SearchAccessToken for the searched user using registration number
 */
router.get(
  '/user/regno',
  verifyTokenMiddlewareGetRequests(tokenTypes.UserAccessToken),
  (request, response) => {
    const { regno } = request.query;

    // check for invalid credentials
    if (containsEmptyString([regno]) || !checkRegno(regno)) {
      return response
        .status(400)
        .json({ status: false, message: 'Invalid Credentials' });
    }

    // search the user
    const User = mongoose.model('User');
    User.findOne({ regno })
      .then(data => {
        if (!data) {
          // user not found
          return response
            .status(400)
            .json({ status: false, message: 'User Not Found' });
        } else {
          // user found
          return response.status(200).json({
            status: true,
            message: 'User Found',
            searchAccessToken: encryptToken(
              { ...data._doc },
              tokenTypes.SearchAccessToken
            )
          });
        }
      })
      .catch(error => {
        // Log Error
        logError(error, {
          message: 'Error in getting user profile from database using regno',
          location: 'routes/search/text-match',
          requestType: 'GET',
          requestUrl: '/search/text-match/user/regno'
        });
        response
          .status(500)
          .json({ status: false, message: 'Internal Server Error' });
      });
  }
);

module.exports = router;
