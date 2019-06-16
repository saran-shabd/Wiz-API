'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const User = new Schema({
    firstname: {
        type: String,
        required: true,
        trim: true
    },
    lastname: {
        type: String,
        required: true,
        trim: true
    },
    regno: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
});

mongoose.model('User', User);
