'use strict';
const { config } = require('../../constants');
const logger = require('winston');
const fs = require( 'fs' );
const http = require( 'http' );
const https = require( 'https' );

function setup( ssl ) {
    if ( ssl && ssl.active ) {
        return {
            key: fs.readFileSync( ssl.key ),
            cert: fs.readFileSync( ssl.certificate )
        };
    }
}

module.exports = {
    create: function ( app, cb ) {
        var options = setup( config.ssl );
        http.createServer( app ).listen( config.web.http_port, cb );
        logger.info( 'Accepting http requests on port ' + config.web.http_port );
        if ( options ) {
            https.createServer( options, app ).listen( config.web.ssl_port, cb );
            logger.info( 'Accepting https requests on port ' + config.web.ssl_port );
        }
    }
};