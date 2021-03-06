'use strict';
const { config } = require('./constants');
const express = require('express');
const basicAuth = require('express-basic-auth');
const bodyParser = require('body-parser');
const compression = require('compression');
const logger = require('./src/config/log');
const { initDbConnection } = require('./src/model/db');
const { acl } = require('./security');
const graphqlHTTP = require('express-graphql');
const { schema, root } = require('./src/model/graphQLSchema');

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

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    const authObject = config.users.reduce(function (acc, cur) {
        acc[cur.user] = cur.password;
        return acc;
    }, {});

    // Don't add routes before this line! All routes pass through the require https filter.
    app.use(requireHTTPS);
    app.use(compression());
    app.use(function(req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        next();
    });

    let vdsApiRouter = require('./src/routes/vdsApiRoutes')();
    let nedApiRouter = require('./src/routes/nedApiRoutes')();
    let propRouter = require('./src/routes/nvRoutes')();
    let fredRouter = require('./src/routes/fredRoutes')();
    let orgRouter = require('./src/routes/orgRoutes')();
    app.use('/api/org', orgRouter)

    // Enforce authentication
    app.use(basicAuth({
        users: authObject
    }));

    // Enforce authorization
    app.use(authorize);
    app.use('/graphql', graphqlHTTP({
        schema: schema,
        rootValue: root,
        graphiql: false, 
    }));

    app.use(bodyParser.json());
    // Routes after this line require basic authentication and access authorization
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


// Helper functions
function getUserId(auth) {
    const credentials = new Buffer(auth.split(' ').pop(), 'base64').toString('ascii').split(':');
    return credentials[0] || null;
}

function authorize(req, res, next) {

    try {
        const url = req.url.toLowerCase(),
            delimiter = '/',
            tokens = url.split(delimiter).slice(0, 3),
            baseUrl = tokens.join(delimiter);

        const method = req.method.toLowerCase();
        const auth = req.get('authorization');
        const user = getUserId(auth);
        acl.isAllowed(user, baseUrl, method, (err, response) => {
            if (response) {
                next();
            } else {
                res.status(403).send('Access Forbidden');
            }
        });

    } catch (err) {
        res.status(403).send('Access Forbidden');
    }
}

function requireHTTPS(req, res, next) {

    if (!req.secure && config.ssl.active) {
        return res.redirect('https://' + req.get('host').split(':')[0] + ':' + config.web.ssl_port + req.url);
    }
    next();
}


module.exports = app; // for testing