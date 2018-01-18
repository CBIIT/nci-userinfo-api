'use strict';
const { config } = require('./constants');
const express = require('express');
const logger = require('./src/config/log');

process.on('unhandledRejection', (reason, p) => {
    logger.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
    process.exit(1);
    // application specific logging, throwing an error, or other logic here
});

logger.info('Starting app...');
var app = express();

(async () => {
    // Don't add routes before this line! All routes pass through the require https filter.
    app.use(requireHTTPS);
    let utilRouter = require('./src/routes/excelApiRoutes')();
    app.use('/api/util', utilRouter);

    var server = require('./src/server/server');
    server.create(app, function (err) {
        if (err) {
            logger.error('Error: Could not start server!');
            process.exit(1);
        }
    });

})();

function requireHTTPS(req, res, next) {

    if (!req.secure && config.ssl.active) {
        return res.redirect('https://' + req.get('host').split(':')[0] + ':' + config.web.ssl_port + req.url);
    }
    next();
}


module.exports = app; // for testing