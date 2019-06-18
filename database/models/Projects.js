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
        type: String,
        required: true
    },
    gitHubUrl: {
        type: String,
        required: true
    },
    startTime: {
        type: String, // format : Month, Year
        required: true
    },
    endTime: {
        type: String // format : Month, Year
    }
});

mongoose.model('Projects', Projects);
