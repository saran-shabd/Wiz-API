'use strict';

const { Router } = require('express');
const mongoose = require('mongoose');

const tokenUtils = require('../../utils/tokens');
const stringUtils = require('../../utils/strings');
const tokenTypes = require('../../constants/tokenTypes');
const { logError } = require('../../utils/logging');

const router = Router();

/**
 * @description Get all technologies used by the User
 */
router.get(
  '',
  tokenUtils.verifyTokenMiddlewareGetRequests(tokenTypes.UserAccessToken),
  (request, response) => {
    // get regno of the user from access token
    let { regno } = request.decryptToken.decoded;

    // get all techs of the User
    const Tech = mongoose.model('Tech');
    Tech.find({ regno })
      .then(data => {
        let result = [];
        for (let i = 0; i < data.length; ++i) {
          result.push({
            tech_id: data[i]._id,
            techName: data[i].techName,
            learningYear: data[i].learningYear,
            stillUseIt: data[i].stillUseIt,
            level: data[i].level,
            sourceName: data[i].sourceName,
            sourceUrl: data[i].sourceUrl
          });
        }
        response.status(200).json({
          status: true,
          message: 'Returning all Techs',
          techs: result
        });
      })
      .catch(error => {
        // Log Error
        logError(error, {
          message: 'Error in getting all techs of a user from database',
          location: 'routes/profile/tech',
          requestType: 'GET',
          requestUrl: '/profile/tech'
        });
        response
          .status(500)
          .json({ status: false, message: 'Internal Server Error' });
      });
  }
);

/**
 * @description Add Tech of a User
 */
router.post(
  '/add',
  tokenUtils.verifyTokenMiddleware(tokenTypes.UserAccessToken),
  (request, response) => {
    // get regno of the user from the access token
    let { regno } = request.decryptToken.decoded;

    let {
      techName,
      learningYear,
      stillUseIt,
      level,
      sourceName,
      sourceUrl
    } = request.body;

    // check for invalid user credentials
    if (
      stringUtils.containsEmptyString([
        techName,
        learningYear,
        stillUseIt,
        level,
        sourceName,
        sourceUrl
      ])
    )
      return response
        .status(400)
        .json({ status: false, message: 'Invalid Credentials' });

    // store tech in database
    const Tech = mongoose.model('Tech');
    new Tech({
      regno,
      techName,
      learningYear,
      stillUseIt,
      level,
      sourceName,
      sourceUrl
    })
      .save()
      .then(() => {
        response.status(200).json({ status: true, message: 'Tech saved' });
      })
      .catch(error => {
        if (error.name === 'ValidationError')
          return response.status(400).json({
            status: false,
            message: 'Cannot set any field to null'
          });

        // Log Error
        logError(error, {
          message: 'Error in creating new tech of a user in database',
          location: 'routes/profile/tech',
          requestType: 'POST',
          requestUrl: '/profile/tech/add'
        });

        response
          .status(500)
          .json({ status: false, message: 'Internal Server Error' });
      });
  }
);

/**
 * @description Update Tech of the User
 */
router.post(
  '/update',
  tokenUtils.verifyTokenMiddleware(tokenTypes.UserAccessToken),
  (request, response) => {
    // extract all details of the Tech that can be updated
    let {
      tech_id,
      techName,
      learningYear,
      stillUseIt,
      level,
      sourceName,
      sourceUrl
    } = request.body;

    // check for invalid user credentials
    if (stringUtils.containsEmptyString([tech_id]))
      return response
        .status(400)
        .json({ status: false, message: 'Invalid Credentials' });

    // get all fields that are requested to be updated
    let toBeUpdated = {};
    if (undefined !== techName && '' !== techName)
      toBeUpdated.techName = techName;
    if (undefined !== learningYear && '' !== learningYear)
      toBeUpdated.learningYear = learningYear;
    if (undefined !== stillUseIt && '' !== stillUseIt)
      toBeUpdated.stillUseIt = stillUseIt;
    if (undefined !== level && '' !== level) toBeUpdated.level = level;
    if (undefined !== sourceName && '' !== sourceName)
      toBeUpdated.sourceName = sourceName;
    if (undefined !== sourceUrl && '' !== sourceUrl)
      toBeUpdated.sourceUrl = sourceUrl;

    // update the Tech of the User
    const Tech = mongoose.model('Tech');
    Tech.findOneAndUpdate({ _id: tech_id }, toBeUpdated)
      .then(() => {
        response.status(200).json({ status: true, message: 'Tech Updated' });
      })
      .catch(error => {
        if (error.name === 'CastError' && error.kind === 'ObjectId')
          // invalid project_id
          return response.status(400).json({
            status: false,
            message: 'Invalid Credentials'
          });

        // Log Error
        logError(error, {
          message: 'Error in updating tech of a user in database',
          location: 'routes/profile/tech',
          requestType: 'POST',
          requestUrl: '/profile/tech/update'
        });

        response
          .status(500)
          .json({ status: false, message: 'Internal Server Error' });
      });
  }
);

/**
 * @description Delete Tech of a User
 */
router.delete(
  '',
  tokenUtils.verifyTokenMiddleware(tokenTypes.UserAccessToken),
  (request, response) => {
    let { tech_id } = request.body;

    // check for invalid user credentials
    if (stringUtils.containsEmptyString([tech_id]))
      return response
        .status(400)
        .json({ status: false, message: 'Invalid Credentials' });

    // delete Tech
    const Tech = mongoose.model('Tech');
    Tech.findOneAndRemove({ _id: tech_id })
      .then(() => {
        response.status(200).json({ status: true, message: 'Tech Deleted' });
      })
      .catch(error => {
        if (error.name === 'CastError' && error.kind === 'ObjectId')
          // invalid tech_id
          return response.status(400).json({
            status: false,
            message: 'Invalid Credentials'
          });

        // Log Error
        logError(error, {
          message: 'Error in deleting tech of a user from database',
          location: 'routes/profile/tech',
          requestType: 'DELETE',
          requestUrl: '/profile/tech'
        });

        response
          .status(500)
          .json({ status: false, message: 'Internal Server Error' });
      });
  }
);

module.exports = router;
