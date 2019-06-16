'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const KeyValuePair = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: String,
    required: true
  }
});

mongoose.model('KeyValuePair', KeyValuePair);
