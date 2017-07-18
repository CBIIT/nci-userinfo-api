var fs = require( 'fs' );
var http = require( 'http' );
var https = require( 'https' );

function setup( ssl ) {
    if ( ssl && ssl.active ) {
        return {
            key: fs.readFileSync( ssl.key ),
            cert: fs.readFileSync( ssl.certificate )
        };
    }
}

module.exports = {
    create: function ( logger, config, app, cb ) {
        var options = setup( config.ssl );
        var server;
        server = http.createServer( app ).listen( config.web.http_port, cb );
        logger.info( 'Accepting http requests on port ' + config.web.http_port );
        if ( options ) {
            server = https.createServer( options, app ).listen( config.web.ssl_port, cb );
            logger.info( 'Accepting https requests on port ' + config.web.ssl_port );
        }

        server.on('error', function(err) {
            logger.error('Server errror: ' + err);
        });

    }
};