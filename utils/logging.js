'use strict';

const log4js = require('log4js');

// create Error logger
const logger = log4js.configure({
  appenders: {
    errorLogs: { type: 'file', filename: 'logs/errorLogs.log' },
    infoLogs: { type: 'file', filename: 'logs/infoLogs.log' }
  },
  categories: {
    default: { appenders: ['errorLogs'], level: 'error' },
    info: { appenders: ['infoLogs'], level: 'info' }
  }
});

/**
 * @param { error, message }
 * @description create error logs
 */
const logError = (error, message) => {
  logger.getLogger().error(JSON.stringify(error), JSON.stringify(message));
};

/**
 * @param { message }
 * @description create info logs
 */
const logInfo = message => {
  logger.getLogger('info').info(JSON.stringify(message));
};

module.exports = { logError, logInfo };
