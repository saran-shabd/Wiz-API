'use strict';

const { Router } = require('express');
const mongoose = require('mongoose');

const { containsEmptyString, checkRegno } = require('../../utils/strings');
const tokenTypes = require('../../constants/tokenTypes');
const { verifyTokenMiddlewareGetRequests } = require('../../utils/tokens');
const { logError } = require('../../utils/logging');

const router = Router();

/**
 * @private
 * @param { username, pageNo }
 * @returns { users }
 * @description Search User(s) using firstname or lastname or both
 */
router.get(
  '/username',
  verifyTokenMiddlewareGetRequests(tokenTypes.UserAccessToken),
  (request, response) => {
    let { username, pageNo } = request.body;

    // check for invalid credentials
    if (containsEmptyString([username, pageNo]))
      return response
        .status(400)
        .json({ status: false, message: 'Invalid Credentials' });

    username = username.trim().split(' ');
    const User = mongoose.model('User');

    if (username.length === 1) {
      // search for firstname OR lastname

      // search for firstname
      User.find({ firstname: username[0] })
        .then(data => {
          if (data.length !== 0) {
            // User(s) found matching firstname
            return response
              .status(200)
              .json({ status: true, message: 'User(s) found', users: data });
          } else {
            // search for lastname
            User.find({ lastname: username[0] })
              .then(data => {
                if (data.length !== 0) {
                  // User(s) found matching lastname
                  return response.status(200).json({
                    status: true,
                    message: 'User(s) found',
                    users: data
                  });
                } else {
                  return response
                    .status(400)
                    .json({ status: false, message: 'No users found' });
                }
              })
              .catch(() => {
                // Log Error
                logError(error, {
                  message: 'Error in searching for lastname in database',
                  location: 'routes/search/text-match',
                  requestType: 'GET',
                  requestUrl: '/search/text-match/username'
                });
                return response
                  .status(500)
                  .json({ status: false, message: 'Internal Server Error' });
              });
          }
        })
        .catch(() => {
          // Log Error
          logError(error, {
            message: 'Error in searching for firstname in database',
            location: 'routes/search/text-match',
            requestType: 'GET',
            requestUrl: '/search/text-match/username'
          });
          return response
            .status(500)
            .json({ status: false, message: 'Internal Server Error' });
        });
    } else {
      // search for firstname AND lastname

      User.find({ firstname: username[0], lastname: username[1] })
        .then(data => {
          if (data.length !== 0) {
            return response
              .status(200)
              .json({ status: true, message: 'User(s) found', users: data });
          } else {
            return response
              .status(400)
              .json({ status: false, message: 'No users found' });
          }
        })
        .catch(error => {
          // Log Error
          logError(error, {
            message: 'Error in searching for fullname in database',
            location: 'routes/search/text-match',
            requestType: 'GET',
            requestUrl: '/search/text-match/username'
          });
          response
            .status(500)
            .json({ status: false, message: 'Internal Server Error' });
        });
    }
  }
);

/**
 * @private
 * @param { regno }
 * @returns { user }
 * @description Search User using Registration Number
 */
router.get(
  '/regno',
  verifyTokenMiddlewareGetRequests(tokenTypes.UserAccessToken),
  (request, response) => {
    let { regno } = request.body;

    // check for invalid credentials
    if (containsEmptyString([regno]))
      return response
        .status(400)
        .json({ status: false, message: 'Invalid Credentials' });
    if (!checkRegno(regno))
      return response
        .status(400)
        .json({ status: false, message: 'Invalid Credentials' });

    // search for the User
    const User = mongoose.model('User');
    User.find({ regno })
      .then(data => {
        if (!data) {
          return response
            .status(400)
            .json({ status: false, message: 'No User found' });
        }

        return response
          .status(200)
          .json({ status: true, message: 'User found', user: data });
      })
      .catch(error => {
        // Log Error
        logError(error, {
          message: 'Error in searching for regno in database',
          location: 'routes/search/text-match',
          requestType: 'GET',
          requestUrl: '/search/text-match/regno'
        });
        response
          .status(500)
          .json({ status: false, message: 'Internal Server Error' });
      });
  }
);

module.exports = router;
