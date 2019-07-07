'use strict';

const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

const emailTypes = require('../constants/emailTypes');
const stringUtils = require('./strings');
const { logError } = require('./logging');

const templateDir = path.join(__dirname, '..', 'email-templates');

/**
 * @param {}
 * @returns { Transport }
 * @description Get configured Transport
 */
const getEmailTransport = async () => {
  const KeyValuePair = mongoose.model('KeyValuePair');
  return KeyValuePair.findOne({ name: 'alert-email-address' })
    .then(async emailData => {
      return KeyValuePair.findOne({ name: 'alert-email-password' })
        .then(passwordData => {
          return nodemailer.createTransport({
            host: 'smtp-mail.outlook.com',
            secureConnection: false,
            port: 587,
            auth: {
              user: stringUtils.decryptStr(emailData.value),
              pass: stringUtils.decryptStr(passwordData.value)
            },
            tls: {
              ciphers: 'SSLv3'
            }
          });
        })
        .catch(error => {
          // Log Error
          logError(error, {
            message: 'Could not fetch alert-email-password from database',
            location: 'utils/email/getEmailTransport()'
          });
          return null;
        });
    })
    .catch(error => {
      // Log Error
      logError(error, {
        message: 'Could not fetch alert-email-address from database',
        location: 'utils/email/getEmailTransport()'
      });
      return null;
    });
};

/**
 * @param { type }
 * @returns { File }
 * @description Get email-template File
 */
const getEmailTemplate = async type => {
  if (type === emailTypes.SignUpOtp) {
    return fs.readFileSync(
      path.join(templateDir, `${emailTypes.SignUpOtp}.html`)
    );
  } else if (type === emailTypes.ForgotPasswordOtp) {
    return fs.readFileSync(
      path.join(templateDir, `${emailTypes.ForgotPasswordOtp}.html`)
    );
  }
};

module.exports = {
  getEmailTransport,
  getEmailTemplate
};
