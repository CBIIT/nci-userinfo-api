var winston = require('winston');

var rotationSize = 100000000; // Bytes
var logLevel;

if (process.env.NODE_ENV === 'development') {
    logLevel = 'debug';
} else {
    logLevel = 'info';
}

var logger = new(winston.Logger)({
    level: logLevel,
    transports: [
        new(winston.transports.Console)({
            timestamp: function () {
                return new Date().toLocaleString();
            }
        }),
        new(winston.transports.File)({
            filename: process.env.NODE_LOG_FILE_API,
            maxsize: rotationSize,
            timestamp: function () {
                return new Date().toLocaleString();
            }
        })
    ]
});

logger.info('Log file: ' + process.env.NODE_LOG_FILE_API);
logger.info('Log level: ' + logger.level);

module.exports = logger;