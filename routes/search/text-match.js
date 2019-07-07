'use strict';

const { Router } = require('express');
const mongoose = require('mongoose');

const { containsEmptyString, checkRegno } = require('../../utils/strings');
const tokenTypes = require('../../constants/tokenTypes');
const { verifyTokenMiddlewareGetRequests } = require('../../utils/tokens');

const router = Router();

/**
 * @private
 * @param { username, pageNo }
 * @returns { users }
 * @description Search User(s) using firstname or lastname or both. Returns
 *              10 results at a time
 */
router.get(
  '/username',
  verifyTokenMiddlewareGetRequests(tokenTypes.UserAccessToken),
  (request, response) => {
    let { username, pageNo } = request.body;
    if (containsEmptyString([username, pageNo]))
      return response
        .status(400)
        .json({ status: false, message: 'Invalid Credentials' });

    username = username.trim().split(' ');
    const User = mongoose.model('User');
    if (username.length === 1) {
      // search for firstname or lastname

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
                return response
                  .status(500)
                  .json({ status: false, message: 'Internal Server Error' });
              });
          }
        })
        .catch(() => {
          return response
            .status(500)
            .json({ status: false, message: 'Internal Server Error' });
        });
    } else {
      // search for firstname and lastname

      User.find({ firstname: username[0], lastname: username[1] }).then(
        data => {
          if (data.length !== 0) {
            return response
              .status(200)
              .json({ status: true, message: 'User(s) found', users: data });
          } else {
            return response
              .status(400)
              .json({ status: false, message: 'No users found' });
          }
        }
      );
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
    User.find({ regno }).then(data => {
      if (!data) {
        return response
          .status(400)
          .json({ status: false, message: 'No User found' });
      }

      return response
        .status(200)
        .json({ status: true, message: 'User found', user: data });
    });
  }
);

module.exports = router;
