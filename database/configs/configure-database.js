'use strict';

const mongoose = require('mongoose');

const { DB_NAME, DB_URL, DB_USERNAME, DB_PASSWORD } = process.env;

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

mongoose
    .connect(
        'mongodb://' + DB_USERNAME + ':' + DB_PASSWORD + DB_URL + '/' + DB_NAME
    )
    .then(() => console.log('connected to database successfully'))
    .catch(error => console.log(error));
