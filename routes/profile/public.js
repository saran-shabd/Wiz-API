'use strict';

const { Router } = require('express');
const mongoose = require('mongoose');

const tokenTypes = require('../../constants/tokenTypes');
const tokenUtils = require('../../utils/tokens');

const router = Router();

/**
 * @description Get Public Profile of the User
 */
router.get(
    '',
    tokenUtils.verifyTokenMiddleware(tokenTypes.UserAccessToken),
    (request, response) => {
        // get user details from access token
        let { firstname, lastname, regno } = request.decryptToken.decoded;

        // get public profile of the user
        const PublicProfile = mongoose.model('PublicProfile');
        PublicProfile.findOne({ regno })
            .then(data => {
                if (!data) {
                    // user's public profile has not been created

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
                            console.log(error);
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
                console.log(error);
                response
                    .status(500)
                    .json({ status: false, message: 'Internal Server Error' });
            });
    }
);

/**
 * @description Update Public Profile of the User
 */
router.post(
    '',
    tokenUtils.verifyTokenMiddleware(tokenTypes.UserAccessToken),
    (request, response) => {
        // get user regno from access token
        let { regno } = request.decryptToken.decoded;

        // extract all fields that can be changed in a public profile
        let { profilePhotoUrl, branch, joiningYear } = request.body;

        // get all fields that are requested to be changes
        let toBeChanged = {};
        if (undefined !== profilePhotoUrl && '' !== profilePhotoUrl)
            toBeChanged.profilePhotoUrl = profilePhotoUrl;
        if (undefined !== branch && '' != branch) toBeChanged.branch = branch;
        if (undefined !== joiningYear && '' !== joiningYear)
            toBeChanged.joiningYear = joiningYear;

        // update fields in public profile
        const PublicProfile = mongoose.model('PublicProfile');
        PublicProfile.findOneAndUpdate({ regno }, toBeChanged)
            .then(() => {
                response
                    .status(200)
                    .json({ status: true, message: 'Profile Updated' });
            })
            .catch(error => {
                console.log(error);
                response
                    .status(500)
                    .json({ status: false, message: 'Internal Server Error' });
            });
    }
);

module.exports = router;
