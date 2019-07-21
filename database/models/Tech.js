'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const Tech = new Schema({
    regno: {
        type: String,
        required: true
    },
    techName: {
        type: String,
        required: true
    },
    learningYear: {
        type: String
    },
    stillUseIt: {
        type: Boolean
    },
    level: {
        type: Number
    },
    sourceName: {
        type: String
    },
    sourceUrl: {
        type: String
    }
});

mongoose.model('Tech', Tech);
