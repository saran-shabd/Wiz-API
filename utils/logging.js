'use strict';

const log4js = require('log4js');

// create logger
const logger = log4js.configure({
  appenders: {
    errorLogs: { type: 'file', filename: 'logs/errorLogs.log' },
    infoLogs: { type: 'file', filename: 'logs/infoLogs.log' },
    warnLogs: { type: 'file', filename: 'logs/warnLogs.log' }
  },
  categories: {
    default: { appenders: ['errorLogs'], level: 'error' },
    info: { appenders: ['infoLogs'], level: 'info' },
    warn: { appenders: ['warnLogs'], level: 'warn' }
  }
});

/**
 * @param { error, message }
 * @returns {}
 * @description create error logs
 */
const logError = (error, message) => {
  logger.getLogger().error(JSON.stringify(error), JSON.stringify(message));
};

/**
 * @param { message }
 * @returns {}
 * @description create info logs
 */
const logInfo = message => {
  logger.getLogger('info').info(JSON.stringify(message));
};

/**
 * @param { message }
 * @returns {}
 * @description create warning logs
 */
const logWarn = message => {
  logger.getLogger('info').warn(JSON.stringify(message));
};

module.exports = { logError, logInfo, logWarn };
