'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const Projects = new Schema({
    regno: {
        type: String,
        required: true
    },
    projectName: {
        type: String,
        unique: true,
        required: true
    },
    briefDescription: {
        type: String
    },
    gitHubUrl: {
        type: String
    },
    startTime: {
        type: String // format : Month, Year
    },
    endTime: {
        type: String // format : Month, Year
    }
});

mongoose.model('Projects', Projects);
