'use strict';

const { Router } = require('express');
const mongoose = require('mongoose');

const tokenUtils = require('../../utils/tokens');
const tokenTypes = require('../../constants/tokenTypes');
const { logError } = require('../../utils/logging');

const router = Router();

/**
 * @private
 * @param { token: useraccesstoken }
 * @returns { profile }
 * @description Get competitive programming profile of a User
 */
router.get(
  '',
  tokenUtils.verifyTokenMiddlewareGetRequests(tokenTypes.UserAccessToken),
  (request, response) => {
    // get user's regno from access token
    let { regno } = request.decryptToken.decoded;

    // get programming profile of the user
    const ProgrammingProfile = mongoose.model('ProgrammingProfile');
    ProgrammingProfile.findOne({ regno })
      .then(data => {
        if (!data) {
          // user programming profile does not exists

          return response.status(200).json({
            status: true,
            message: 'Returning User Programming Profile',
            profile: {}
          });
        }

        // return user programming profile

        let {
          preferedLanguage,
          codeChefUrl,
          hackerearthUrl,
          topCoderUrl,
          gitHubUrl,
          projectEulerKey
        } = data._doc;

        response.status(200).json({
          status: true,
          message: 'Returning User Programming Profile',
          profile: {
            preferedLanguage,
            codeChefUrl,
            hackerearthUrl,
            topCoderUrl,
            gitHubUrl,
            projectEulerKey
          }
        });
      })
      .catch(error => {
        // Log Error
        logError(error, {
          message:
            'Error in getting Programming Profile of a user from database',
          location: 'routes/profile/programming',
          requestType: 'GET',
          requestUrl: '/profile/programming'
        });
        response
          .status(500)
          .json({ status: false, message: 'Internal Server Error' });
      });
  }
);

/**
 * @private
 * @param { token: useraccesstoken, preferedLanguage, codeChefUrl, hackerearthUrl, topCoderUrl, gitHubUrl, projectEulerKey }
 * @returns {}
 * @description Update (or Create if not created already) Programming Profile of the User
 */
router.post(
  '',
  tokenUtils.verifyTokenMiddleware(tokenTypes.UserAccessToken),
  (request, response) => {
    // get user regno from access token
    let { regno } = request.decryptToken.decoded;

    // extract all fields that can be changed in a programming profile
    let {
      preferedLanguage,
      codeChefUrl,
      hackerearthUrl,
      topCoderUrl,
      gitHubUrl,
      projectEulerKey
    } = request.body;

    // get all fields that are requested to be changed
    let toBeChanged = {};
    if (undefined !== preferedLanguage && '' !== preferedLanguage)
      toBeChanged.preferedLanguage = preferedLanguage;
    if (undefined !== codeChefUrl && '' !== codeChefUrl)
      toBeChanged.codeChefUrl = codeChefUrl;
    if (undefined !== hackerearthUrl && '' !== hackerearthUrl)
      toBeChanged.hackerearthUrl = hackerearthUrl;
    if (undefined !== topCoderUrl && '' !== topCoderUrl)
      toBeChanged.topCoderUrl = topCoderUrl;
    if (undefined !== gitHubUrl && '' !== gitHubUrl)
      toBeChanged.gitHubUrl = gitHubUrl;
    if (undefined !== projectEulerKey && '' !== projectEulerKey)
      toBeChanged.projectEulerKey = projectEulerKey;

    // Update/Create fields in programming profile
    const ProgrammingProfile = mongoose.model('ProgrammingProfile');
    ProgrammingProfile.findOneAndUpdate({ regno }, toBeChanged, {
      upsert: true,
      new: true
    })
      .then(() => {
        response.status(200).json({ status: true, message: 'Profile Updated' });
      })
      .catch(error => {
        // Log Error
        logError(error, {
          message:
            'Error in updating Programming profile of a user in database',
          location: 'routes/profile/programming',
          requestType: 'POST',
          requestUrl: '/profile/programming'
        });
        response
          .status(500)
          .json({ status: false, message: 'Internal Server Error' });
      });
  }
);

module.exports = router;
