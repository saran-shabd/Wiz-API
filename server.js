'use strict';

const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// middleware for body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// configure database
require('./database/configs/configure-database');

// load mongoose models
require('./database/configs/configure-models');

// load all routes
app.use('/', require('./routes'));

const port = process.env.PORT || 4000;
app.listen(port, console.log(`server is up and running at port ${port}`));
