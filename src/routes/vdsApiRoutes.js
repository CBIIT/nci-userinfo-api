var express = require('express');
var apiRouter = express.Router();
var ldap = require('ldapjs');
var fs = require('fs');
var ldapClient;

var router = function (logger, config) {

    const tlsOptions = {
        ca: [fs.readFileSync(config.vds.vdscert)]
    };

    var isNum = new RegExp('^[0-9]+$');

    ldapClient = ldap.createClient({
        url: config.vds.host,
        reconnect: true,
        tlsOptions: tlsOptions
    });

    ldapClient.on('connectError', function (err) {
        logger.error('ldap client connectError: ' + err + ' auto-reconnect.');
    });

    ldapClient.on('error', function (err) {
        logger.error('ldap client error: ' + err + ' auto-reconnect.');
    });

    ldapClient.on('resultError', function (err) {
        logger.error('ldap client resultError: ' + err + ' auto-reconnect.');
    });

    ldapClient.on('socketTimeout', function (err) {
        logger.error('ldap socket timeout: ' + err + ' auto-reconnect.');
    });

    ldapClient.on('timeout', function (err) {
        logger.error('ldap client timeout: ' + err + ' auto-reconnect.');
    });
    

    apiRouter.route('/users/ic/:ic')
        .get(function (req, res) {

            getUsers(null, req.params.ic, logger, config)
                .then(function (users) {

                    // users.forEach(u => {
                    //     logger.info(u.UNIQUEIDENTIFIER + ',' + u.GIVENNAME + ' ' + u.SN + ',' + u.NIHPOC + ',' + u.MANAGER + ',' + u.NIHCOTRID + ',' + u.ORGANIZATIONALSTAT);
                    // });

                    res.send(users);
                });
        });

    apiRouter.route('/users/user/:nihId')
        .get(function (req, res) {
            const nihId = req.params.nihId;

            if (nihId === undefined) {
                res.status(400).send('nihid is not defined.');
                return;
            }

            if (!isNum.test(nihId)) {
                res.status(400).send('nihid is not numeric.');
                return;
            }

            getUsers(nihId, '*', logger, config)
                .then(function (users) {
                    res.send(users);
                });
        });
    return apiRouter;
};

function getUsers(userId, ic, logger, config) {

    return new Promise(function (resolve, reject) {

        const nciSubFilter = '(NIHORGACRONYM=' + ic + ')';
        //var nciSubFilter = '';
        const filter = userId ? ('(&(UNIQUEIDENTIFIER=' + userId + ')' + nciSubFilter + ')') : nciSubFilter;
        //const filter = userId ? 'UNIQUEIDENTIFIER=' + userId : 'UNIQUEIDENTIFIER=*';

        var userSearchOptions = {
            scope: 'sub',
            // attributes: config.vds.user_attributes,
            filter: filter
        };
        var counter = 0;

        ldapClient.bind(config.vds.dn, config.vds.password, function (err) {

            if (err) {
                logger.error('Bind error: ' + err);
                ldapClient.unbind();
                reject(Error(err.message));
            }
            var users = [];
            logger.info('starting search');
            ldapClient.search(config.vds.searchBase, userSearchOptions, function (err, ldapRes) {
                if (err) {
                    logger.error('error: ' + err.code);
                }
                ldapRes.on('searchEntry', function (entry) {
                    if (++counter % 10000 === 0) {
                        logger.info(counter + ' records found and counting...');
                    }
                    users.push(entry.object);
                });
                ldapRes.on('searchReference', function () { });
                ldapRes.on('error', function (err) {
                    ldapClient.unbind();
                    if (err.code === 32) {
                        // Object doesn't exist. The user DN is most likely not fully provisioned yet.
                        resolve({});
                    } else {
                        reject(Error(err.message));
                    }
                });
                ldapRes.on('end', function () {
                    logger.info('unbind and release');
                    ldapClient.unbind();
                    resolve(users);
                });
            });

        });

    });
}

module.exports = router;