'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProgrammingProfile = new Schema({
    regno: {
        type: String,
        unique: true
    },
    preferedLanguage: {
        type: String
    },
    codeChefUrl: {
        type: String
    },
    hackerearthUrl: {
        type: String
    },
    topCoderUrl: {
        type: String
    },
    gitHubUrl: {
        type: String
    },
    projectEulerKey: {
        type: String
    }
});

mongoose.model('ProgrammingProfile', ProgrammingProfile);
