'use strict';
var logger = require('winston');

const rotationSize = 100000000; // Bytes
const logLevel = process.env.NODE_ENV === 'development' ? 'debug' : 'info';

logger.level = logLevel;

logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    timestamp: function () {
        return new Date().toLocaleString();
    }
});

logger.add(logger.transports.File, {
    filename: process.env.NODE_LOG_FILE_API,
    maxsize: rotationSize,
    timestamp: function () {
        return new Date().toLocaleString();
    }
});

logger.info('Log file: ' + process.env.NODE_LOG_FILE_UTIL);
logger.info('Log level: ' + logger.level);

module.exports = logger;