'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const PublicProfile = new Schema({
    firstname: {
        type: String
    },
    lastname: {
        type: String
    },
    regno: {
        type: String,
        unique: true
    },
    profilePhotoUrl: {
        type: String
    },
    branch: {
        type: String
    },
    joiningYear: {
        type: String
    }
});

mongoose.model('PublicProfile', PublicProfile);
