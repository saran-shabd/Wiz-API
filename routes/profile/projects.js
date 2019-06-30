'use strict';

const { Router } = require('express');
const mongoose = require('mongoose');

const tokenTypes = require('../../constants/tokenTypes');
const tokenUtils = require('../../utils/tokens');
const stringUtils = require('../../utils/strings');

const router = Router();

/**
 * @description Get all projects of the User
 */
router.get(
  '',
  tokenUtils.verifyTokenMiddlewareGetRequests(tokenTypes.UserAccessToken),
  (request, response) => {
    // get user regno from access token
    let { regno } = request.decryptToken.decoded;

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
        console.log(error);
        response
          .status(500)
          .json({ status: false, message: 'Internal Server Error' });
      });
  }
);

/**
 * @description Add Project for a User
 */
router.post(
  '/add',
  tokenUtils.verifyTokenMiddleware(tokenTypes.UserAccessToken),
  (request, response) => {
    // get user regno from access token
    let { regno } = request.decryptToken.decoded;

    let {
      projectName,
      briefDescription,
      gitHubUrl,
      startMonth,
      startYear,
      endMonth,
      endYear
    } = request.body;

    // check for invalid credentials
    if (
      stringUtils.containsEmptyString([
        projectName,
        briefDescription,
        gitHubUrl,
        startMonth,
        startYear
      ])
    )
      return response
        .status(400)
        .json({ status: false, message: 'Invalid Credentials' });

    // parse startTime and endTime
    let startTime;
    if (null === startMonth && null === startYear) startTime = null;
    else startTime = `${startMonth}, ${startYear}`;
    let endTime;
    if (null === endMonth && null === endYear) endTime = null;
    else endTime = `${endMonth}, ${endYear}`;

    // store project in database
    const Projects = mongoose.model('Projects');
    new Projects({
      projectName,
      briefDescription,
      gitHubUrl,
      regno,
      startTime,
      endTime
    })
      .save()
      .then(() => {
        response.status(200).json({ status: true, message: 'Project Saved' });
      })
      .catch(error => {
        if (error.code === 11000)
          return response.status(400).json({
            status: false,
            message: 'Project with same name already exists'
          });
        if (error.name === 'ValidationError')
          return response.status(400).json({
            status: false,
            message: 'Cannot set any field to null'
          });
        console.log(error);
        response
          .status(500)
          .json({ status: false, message: 'Internal Server Error' });
      });
  }
);

/**
 * @description Update Project Details
 */
router.post(
  '/update',
  tokenUtils.verifyTokenMiddleware(tokenTypes.UserAccessToken),
  (request, response) => {
    // extract all fields from the request object that can be updated
    let {
      project_id,
      projectName,
      briefDescription,
      gitHubUrl,
      startMonth,
      startYear,
      endMonth,
      endYear
    } = request.body;

    if (stringUtils.containsEmptyString([project_id]))
      return response
        .status(400)
        .json({ status: false, message: 'Invalid Credentials' });

    // get all fields that are requested to be updated
    let toBeUpdated = {};
    if (undefined !== projectName && '' !== projectName)
      toBeUpdated.projectName = projectName;
    if (undefined !== briefDescription && '' !== briefDescription)
      toBeUpdated.briefDescription = briefDescription;
    if (undefined !== gitHubUrl && '' !== gitHubUrl)
      toBeUpdated.gitHubUrl = gitHubUrl;
    if (undefined !== startMonth && '' != startMonth)
      toBeUpdated.startMonth = startMonth;
    if (undefined !== startYear && '' !== startYear)
      toBeUpdated.startYear = startYear;
    if (undefined !== endMonth && '' != endMonth)
      toBeUpdated.endMonth = endMonth;
    if (undefined !== endYear && '' !== endYear) toBeUpdated.endYear = endYear;

    // update fields in project
    const Projects = mongoose.model('Projects');
    Projects.findOneAndUpdate({ _id: project_id }, toBeUpdated)
      .then(() => {
        response.status(200).json({ status: true, message: 'Project Updated' });
      })
      .catch(error => {
        if (error.name === 'CastError' && error.kind === 'ObjectId')
          // invalid project_id
          return response.status(400).json({
            status: false,
            message: 'Invalid Credentials'
          });
        console.log(error);
        response
          .status(500)
          .json({ status: false, message: 'Internal Server Error' });
      });
  }
);

/**
 * @description Delete project of a User
 */
router.delete(
  '',
  tokenUtils.verifyTokenMiddleware(tokenTypes.UserAccessToken),
  (request, response) => {
    let { project_id } = request.body;

    // check for invalid user credentials
    if (stringUtils.containsEmptyString([project_id]))
      return response
        .status(400)
        .json({ status: false, message: 'Invalid Credentials' });

    // delete the project
    const Projects = mongoose.model('Projects');
    Projects.findOneAndRemove({ _id: project_id })
      .then(() => {
        response.status(200).json({ status: true, message: 'Project Deleted' });
      })
      .catch(error => {
        if (error.name === 'CastError' && error.kind === 'ObjectId')
          // invalid project_id
          return response.status(400).json({
            status: false,
            message: 'Invalid Credentials'
          });
        console.log(error);
        response
          .status(500)
          .json({ status: false, message: 'Internal Server Error' });
      });
  }
);

module.exports = router;
