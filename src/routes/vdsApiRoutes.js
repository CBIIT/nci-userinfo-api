var express = require('express');
var apiRouter = express.Router();
var ldap = require('ldapjs');
var fs = require('fs');
var js2xmlparser = require('js2xmlparser2');
var ldapClient;

var parserOptions = {
    wrapArray: {
        enabled: true
    }
};

var router = function (logger, config) {

    const tlsOptions = {
        ca: [fs.readFileSync(config.vds.vdscert)]
    };

    var isNum = new RegExp('^[0-9]+$');

    ldapClient = ldap.createClient({
        url: config.vds.host,
        reconnect: true,
        tlsOptions: tlsOptions,
        idleTimeout: 15 * 60 * 1000,
        timeout: 15 * 60 * 1000,
        connectTimeout: 15 * 60 * 1000 // 15 mins
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
                    if (req.accepts('xml')) {
                        res.send(js2xmlparser('users', users, parserOptions));
                    } else {
                        res.send(users);
                    }
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
                    if (req.accepts('xml')) {
                        res.send(js2xmlparser('users', users, parserOptions));
                    } else {
                        res.send(users);
                    }
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
            filter: filter,
            paged: true
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
                    let obj = entry.object;
                    const raw = entry.raw;
                    let guidField = raw.objectGUID;
                    if (guidField) {
                        obj.objectGUID = guidField.toString('base64');
                    }
                    guidField = raw['mS-DS-ConsistencyGuid'];
                    if (guidField) {
                        obj['mS-DS-ConsistencyGuid'] = guidField.toString('base64');
                    }
                    guidField = raw['msExchArchiveGUID'];
                    if (guidField) {
                        obj['msExchArchiveGUID'] = guidField.toString('base64');
                    }
                    guidField = raw['msRTCSIP-UserRoutingGroupId'];
                    if (guidField) {
                        obj['msRTCSIP-UserRoutingGroupId'] = guidField.toString('base64');
                    }
                    guidField = raw['msExchMailboxGuid'];
                    if (guidField) {
                        obj['msExchMailboxGuid'] = guidField.toString('base64');
                    }
                    guidField = raw['objectSid'];
                    if (guidField) {
                        obj['objectSid'] = guidField.toString('base64');
                    }
                    guidField = raw['userCertificate'];
                    if (guidField) {
                        obj['userCertificate'] = guidField.toString('base64');
                    }
                    guidField = raw['msExchSafeSendersHash'];
                    if (guidField) {
                        obj['msExchSafeSendersHash'] = guidField.toString('base64');
                    }
                    guidField = raw['msExchUMSpokenName'];
                    if (guidField) {
                        obj['msExchUMSpokenName'] = guidField.toString('base64');
                    }
                    guidField = raw['userSMIMECertificate'];
                    if (guidField) {
                        obj['userSMIMECertificate'] = guidField.toString('base64');
                    }
                    guidField = raw['msRTCSIP-UserRoutingGroupId'];
                    if (guidField) {
                        obj['msRTCSIP-UserRoutingGroupId'] = guidField.toString('base64');
                    }
                    guidField = raw['objectGUID'];
                    if (guidField) {
                        obj['objectGUID'] = guidField.toString('base64');
                    }
                    
                    users.push(obj);
                });
                ldapRes.on('searchReference', function () { });
                ldapRes.on('page', function () {
                    logger.info('page end');
                });
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
                    logger.info(counter + ' records found');
                    ldapClient.unbind();
                    resolve(users);
                });
            });

        });

    });
}

module.exports = router;