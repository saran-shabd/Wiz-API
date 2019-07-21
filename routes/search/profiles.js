'use strict';

const { Router } = require('express');
const mongoose = require('mongoose');

const tokenTypes = require('../../constants/tokenTypes');
const { verifyTokenMiddlewareGetRequests } = require('../../utils/tokens');
const { logError, logWarn } = require('../../utils/logging');

const router = Router();

/**
 * @private
 * @param { token: SearchAccessToken }
 * @returns { profile }
 * @description Get programming profile of the searched user
 */
router.get(
  '/programming',
  verifyTokenMiddlewareGetRequests(tokenTypes.SearchAccessToken),
  (request, response) => {
    const { regno } = request.decryptToken.decoded;

    // get programming profile of the user
    const ProgrammingProfile = mongoose.model('ProgrammingProfile');
    ProgrammingProfile.findOne({ regno })
      .then(data => {
        if (!data) {
          // user programming profile does not exists

          // log warning
          logWarn({
            message: 'Searched User with no Programming Profile',
            location: 'routes/search/profiles/programming'
          });

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
            'Error in getting Programming Profile of a searched user from database',
          location: 'routes/search/profiles',
          requestType: 'GET',
          requestUrl: '/search/profiles/programming'
        });
        response
          .status(500)
          .json({ status: false, message: 'Internal Server Error' });
      });
  }
);

/**
 * @private
 * @param { token: SearchAccessToken }
 * @returns { projects }
 * @description Get all projects of the Searched User
 */
router.get(
  '/projects',
  verifyTokenMiddlewareGetRequests(tokenTypes.SearchAccessToken),
  (request, response) => {
    // get user regno from access token
    const { regno } = request.decryptToken.decoded;

    // get all projects
    const Projects = mongoose.model('Projects');
    Projects.find({ regno })
      .then(data => {
        let result = [];
        for (let i = 0; i < data.length; ++i) {
          result.push({
            project_id: data[i]._id,
            projectName: data[i].projectName,
            briefDescription: data[i].briefDescription,
            gitHubUrl: data[i].gitHubUrl,
            startTime: data[i].startTime,
            endTime: data[i].endTime
          });
        }
        response.status(200).json({
          status: true,
          message: 'Returing all projects',
          projects: result
        });
      })
      .catch(error => {
        // Log Error
        logError(error, {
          message:
            'Error in getting all projects of a searched user from database',
          location: 'routes/search/profiles',
          requestType: 'GET',
          requestUrl: '/search/profiles/projects'
        });
        response
          .status(500)
          .json({ status: false, message: 'Internal Server Error' });
      });
  }
);

/**
 * @private
 * @param { token: SearchAccessToken }
 * @returns { profile }
 * @description Get Public Profile of the Searched User
 */
router.get(
  '/public',
  verifyTokenMiddlewareGetRequests(tokenTypes.SearchAccessToken),
  (request, response) => {
    // get user details from access token
    let { firstname, lastname, regno } = request.decryptToken.decoded;

    // get public profile of the user
    const PublicProfile = mongoose.model('PublicProfile');
    PublicProfile.findOne({ regno })
      .then(data => {
        if (!data) {
          // user's public profile has not been created

          // log warning
          logWarn({
            message: 'Searched User with no Public Profile',
            location: 'routes/search/profiles/public'
          });

          // create user's public profile
          new PublicProfile({ firstname, lastname, regno })
            .save()
            .then(() => {
              // return user public profile
              response.status(200).json({
                status: true,
                message: 'Returning Public Profile',
                profile: {
                  firstname,
                  lastname,
                  regno,
                  profilePhotoUrl: undefined,
                  branch: undefined,
                  joiningYear: undefined
                }
              });
            })
            .catch(error => {
              // Log Error
              logError(error, {
                message:
                  'Error in creating new public profile of a searched user in database',
                location: 'routes/search/profiles',
                requestType: 'GET',
                requestUrl: '/search/profiles/public'
              });
              response.status(500).json({
                status: false,
                message: 'Internal Server Error'
              });
            });
        } else {
          // return user public profile

          let {
            firstname,
            lastname,
            regno,
            profilePhotoUrl,
            branch,
            joiningYear
          } = data._doc;

          response.status(200).json({
            status: true,
            message: 'Returning Public Profile',
            profile: {
              firstname,
              lastname,
              regno,
              profilePhotoUrl,
              branch,
              joiningYear
            }
          });
        }
      })
      .catch(error => {
        // Log Error
        logError(error, {
          message:
            'Error in getting public profile of the searched user from database',
          location: 'routes/search/profiles',
          requestType: 'GET',
          requestUrl: '/search/profiles/public'
        });
        response
          .status(500)
          .json({ status: false, message: 'Internal Server Error' });
      });
  }
);

/**
 * @private
 * @param { token: SearchAccessToken }
 * @returns { techs }
 * @description Get all technologies used by the Search User
 */
router.get(
  '/tech',
  verifyTokenMiddlewareGetRequests(tokenTypes.SearchAccessToken),
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
          message:
            'Error in getting all techs of a searched user from database',
          location: 'routes/serach/profiles',
          requestType: 'GET',
          requestUrl: '/search/profiles/tech'
        });
        response
          .status(500)
          .json({ status: false, message: 'Internal Server Error' });
      });
  }
);

module.exports = router;
