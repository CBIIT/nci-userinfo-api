'use strict';
const { config } = require('./constants');
const express = require('express');
const basicAuth = require('express-basic-auth');
const bodyParser = require('body-parser');
const compression = require('compression');
const logger = require('./src/config/log');
const { initDbConnection } = require('./src/model/db');

process.on('unhandledRejection', (reason, p) => {
    logger.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
    process.exit(1);
    // application specific logging, throwing an error, or other logic here
});

logger.info('Starting app...');
var app = express();

(async () => {

    try {
        await initDbConnection();
    } catch (error) {
        logger.error('Fatal Error: ' + error.message);
        process.exit(1);
    }

    var authObject = {};
    authObject[config.basicauth.user] = config.basicauth.password;

    // Don't add routes before this line! All routes pass through the require https filter.
    app.use(requireHTTPS);
    app.use(bodyParser.json());
    app.use(compression());
    if (process.env.NODE_ENV === 'development') {
        app.use(headerLogger);
    }

    let vdsApiRouter = require('./src/routes/vdsApiRoutes')();
    let nedApiRouter = require('./src/routes/nedApiRoutes')();
    let utilRouter = require('./src/routes/excelApiRoutes')();
    let propRouter = require('./src/routes/nvRoutes')();
    let fredRouter = require('./src/routes/fredRoutes')();

    app.use('/api/util', utilRouter);


    // Enforce authentication
    app.use(basicAuth({
        users: authObject
    }));

    // Routes after this line require basic authentication
    app.use('/api/vds', vdsApiRouter);
    app.use('/api/ned', nedApiRouter);
    app.use('/api/nv', propRouter);
    app.use('/api/fred', fredRouter);


    var server = require('./src/server/server');
    server.create(app, function (err) {
        if (err) {
            logger.error('Error: Could not start server!');
            process.exit(1);
        }
    });

})();

function headerLogger(req, res, next) {
    logger.info('headers: ' + req.headers);
    next();
}

// Helper functions
function requireHTTPS(req, res, next) {
    if (!req.secure && config.ssl.active) {
        return res.redirect('https://' + req.get('host').split(':')[0] + ':' + config.web.ssl_port + req.url);
    }
    next();
}


module.exports = app; // for testing