var express = require('express');
var apiRouter = express.Router();
var ldap = require('ldapjs');
var fs = require('fs');
var js2xmlparser = require('js2xmlparser2');
// var ldapClient;
var configRef;
var loggerRef;
var tlsOptions;


var parserOptions = {
    wrapArray: {
        enabled: true
    }
};

var router = function (logger, config) {

    loggerRef = logger;
    configRef = config;

    tlsOptions = {
        ca: [fs.readFileSync(config.vds.vdscert)]
    };

    var isNum = new RegExp('^[0-9]+$');

    // ldapClient = ldap.createClient({
    //     url: config.vds.host,
    //     reconnect: true,
    //     tlsOptions: tlsOptions,
    //     idleTimeout: 15 * 60 * 1000,
    //     timeout: 15 * 60 * 1000,
    //     connectTimeout: 15 * 60 * 1000 // 15 mins
    // });

    // ldapClient.on('connectError', function (err) {
    //     logger.error('ldap client connectError: ' + err + ' auto-reconnect.');
    // });

    // ldapClient.on('error', function (err) {
    //     logger.error('ldap client error: ' + err + ' auto-reconnect.');
    // });

    // ldapClient.on('resultError', function (err) {
    //     logger.error('ldap client resultError: ' + err + ' auto-reconnect.');
    // });

    // ldapClient.on('socketTimeout', function (err) {
    //     logger.error('ldap socket timeout: ' + err + ' auto-reconnect.');
    // });

    // ldapClient.on('timeout', function (err) {
    //     logger.error('ldap client timeout: ' + err + ' auto-reconnect.');
    // });


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

const getUsers = async (userId, ic, logger, config) => {

    return new Promise(async function (resolve, reject) {

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
        const ldapClient = await getLdapClient();
        console.log(ldapClient);

        ldapClient.bind(config.vds.dn, config.vds.password, function (err) {

            if (err) {
                logger.error('Bind error: ' + err);
                ldapClient.destroy();
                // ldapClient.unbind();
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
                    let base64Field = raw.objectGUID;
                    if (base64Field) {
                        obj.objectGUID = base64Field.toString('base64');
                    }

                    base64Field = raw['mS-DS-ConsistencyGuid'];
                    if (base64Field) {
                        obj['mS-DS-ConsistencyGuid'] = base64Field.toString('base64');
                    }
                    base64Field = raw['msExchArchiveGUID'];
                    if (base64Field) {
                        obj['msExchArchiveGUID'] = base64Field.toString('base64');
                    }
                    base64Field = raw['msRTCSIP-UserRoutingGroupId'];
                    if (base64Field) {
                        obj['msRTCSIP-UserRoutingGroupId'] = base64Field.toString('base64');
                    }
                    base64Field = raw['msExchMailboxGuid'];
                    if (base64Field) {
                        obj['msExchMailboxGuid'] = base64Field.toString('base64');
                    }
                    base64Field = raw['objectSid'];
                    if (base64Field) {
                        obj['objectSid'] = base64Field.toString('base64');
                    }
                    base64Field = raw['userCertificate'];
                    if (base64Field) {
                        obj['userCertificate'] = base64Field.toString('base64');
                    }
                    base64Field = raw['msExchSafeSendersHash'];
                    if (base64Field) {
                        obj['msExchSafeSendersHash'] = base64Field.toString('base64');
                    }
                    base64Field = raw['msExchUMSpokenName'];
                    if (base64Field) {
                        obj['msExchUMSpokenName'] = base64Field.toString('base64');
                    }
                    base64Field = raw['userSMIMECertificate'];
                    if (base64Field) {
                        obj['userSMIMECertificate'] = base64Field.toString('base64');
                    }
                    base64Field = raw['msRTCSIP-UserRoutingGroupId'];
                    if (base64Field) {
                        obj['msRTCSIP-UserRoutingGroupId'] = base64Field.toString('base64');
                    }
                    base64Field = raw['objectGUID'];
                    if (base64Field) {
                        obj['objectGUID'] = base64Field.toString('base64');
                    }
                    base64Field = raw['thumbnailPhoto'];
                    if (base64Field) {
                        obj['thumbnailPhoto'] = base64Field.toString('base64');
                    }

                    users.push(obj);
                });
                ldapRes.on('searchReference', function () { });
                ldapRes.on('page', function () {
                    logger.info('page end');
                });
                ldapRes.on('error', function (err) {
                    ldapClient.destroy();
                    // ldapClient.unbind();
                    if (err.code === 32) {
                        // Object doesn't exist. The user DN is most likely not fully provisioned yet.
                        resolve({});
                    } else {
                        reject(Error(err.message));
                    }
                });
                ldapRes.on('end', function () {
                    logger.info('destroy client');
                    logger.info(counter + ' records found');
                    ldapClient.destroy();
                    // ldapClient.unbind();
                    resolve(users);
                });
            });

        });

    });
};


const getLdapClient = async () => {
 
    try {
        const ldapClient = await ldap.createClient({
            url: configRef.vds.host,
            tlsOptions: tlsOptions,
            idleTimeout: 15 * 60 * 1000,
            timeout: 15 * 60 * 1000,
            connectTimeout: 15 * 60 * 1000 // 15 mins
        });

        ldapClient.on('connectError', function (err) {
            loggerRef.error('ldap client connectError: ' + err);
        });

        ldapClient.on('error', function (err) {
            loggerRef.error('ldap client error: ' + err);
        });

        ldapClient.on('resultError', function (err) {
            loggerRef.error('ldap client resultError: ' + err);
        });

        ldapClient.on('socketTimeout', function (err) {
            loggerRef.error('ldap socket timeout: ' + err);
        });

        ldapClient.on('timeout', function (err) {
            loggerRef.error('ldap client timeout: ' + err);
        });
        return ldapClient;
    } catch (error) {
        return Error(error);
    }
};

module.exports = router;