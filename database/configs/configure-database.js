'use strict';

const mongoose = require('mongoose');

const { logError, logInfo } = require('../../utils/logging');
const { DB_NAME, DB_URL, DB_USERNAME, DB_PASSWORD } = process.env;

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

mongoose
  .connect(
    'mongodb://' + DB_USERNAME + ':' + DB_PASSWORD + DB_URL + '/' + DB_NAME
  )
  .then(() => {
    // Log Info
    logInfo({
      message: 'Connection with database Initiated Successfully',
      location: 'database/config/configure-database.'
    });
  })
  .catch(error => {
    // Log Error
    logError(error, {
      message: 'Could not initiate connection with database',
      location: 'database/config/configure-database.js'
    });
  });
