'use strict';
const { config } = require('../../constants');
const logger = require('winston');
const express = require('express');
const apiRouter = express.Router();
const ldap = require('ldapjs');
const fs = require('fs');
const js2xmlparser = require('js2xmlparser2');
const tlsOptions = {
    ca: [fs.readFileSync(config.vds.vdscert)]
};
const util = require('../util/base64Processing');
const {getUsersByIc} = require('../model/db.js');

var parserOptions = {
    wrapArray: {
        enabled: true
    }
};

const router = () => {

    var isNum = new RegExp('^[0-9]+$');

    apiRouter.route('/users/ic/:ic')
        .get(async function (req, res) {
            try {
                const users = await getUsersByIc(req.params.ic);
                if (users) {
                    if (req.accepts('xml')) {
                        res.send(js2xmlparser('users', users, parserOptions));
                    } else {
                        res.json(users);
                    }
                } else {
                    res.status(400).send('Users not found');
                }
            } catch (error) {
                res.status(500).send(error);
            }
        });

    apiRouter.route('/users/ic/:ic/realtime')
        .get(function (req, res) {
            getUsers(null, req.params.ic)
                .then(function (users) {
                    if (req.accepts('xml')) {
                        res.send(js2xmlparser('users', users, parserOptions));
                    } else {
                        res.send(users);
                    }
                }).catch(function (err) {
                    res.status(500).send(err);
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

            getUsers(nihId, '*')
                .then(function (users) {
                    if (req.accepts('xml')) {
                        res.send(js2xmlparser('users', users, parserOptions));
                    } else {
                        res.send(users);
                    }
                }).catch(function (err) {
                    res.status(500).send(err);
                });
        });
    return apiRouter;
};

const getUsers = async (userId, ic) => {

    return new Promise(async function (resolve, reject) {

        const nciSubFilter = '(NIHORGACRONYM=' + ic + ')';
        const filter = userId ? ('(&(UNIQUEIDENTIFIER=' + userId + ')' + nciSubFilter + ')') : nciSubFilter;
        //const filter = userId ? 'UNIQUEIDENTIFIER=' + userId : 'UNIQUEIDENTIFIER=*';

        var userSearchOptions = {
            scope: 'sub',
            attributes: config.vds.user_attributes,
            filter: filter,
            paged: true
        };
        var counter = 0;
        const ldapClient = await getLdapClient();

        ldapClient.bind(config.vds.dn, config.vds.password, function (err) {

            if (err) {
                logger.error('Bind error: ' + err);
                ldapClient.destroy();
                reject(Error(err.message));
            }
            var users = [];
            logger.info('starting search');
            ldapClient.search(config.vds.searchBase, userSearchOptions, function (err, ldapRes) {
                if (err) {
                    logger.error(err);
                    reject(Error(err.message));
                }
                ldapRes.on('searchEntry', function (entry) {
                    if (++counter % 10000 === 0) {
                        logger.info(counter + ' records found and counting...');
                    }
                    let obj = util.convertBase64Fields(entry);
                    users.push(obj);
                });
                ldapRes.on('searchReference', function () { });
                ldapRes.on('page', function () {
                    logger.info(`page end | ${counter} users fetched`);
                });
                ldapRes.on('error', function (err) {
                    ldapClient.destroy();
                    if (err.code === 32) {
                        // Object doesn't exist. The user DN is most likely not fully provisioned yet.
                        resolve({});
                    } else {
                        logger.error('err');
                        reject(Error(err.message));
                    }
                });
                ldapRes.on('end', function () {
                    logger.info('destroy client');
                    logger.info(counter + ' records found');
                    ldapClient.destroy();
                    resolve(users);
                });
            });

        });

    });
};

const getLdapClient = async () => {

    try {
        const ldapClient = await ldap.createClient({
            url: config.vds.host,
            tlsOptions: tlsOptions,
            idleTimeout: 15 * 60 * 1000,
            timeout: 15 * 60 * 1000,
            connectTimeout: 15 * 60 * 1000 // 15 mins
        });

        // for (let event of ['connectError', 'error', 'resultError', 'socketTimeout', 'timeout']) {
        //     ldapClient.on(event, err => logger.error(`ldap client error: ${err}`));
        // }

        ldapClient.on('connectError', function (err) {
            logger.error('ldap client connectError: ' + err);
        });

        ldapClient.on('error', function (err) {
            logger.error('ldap client error: ' + err);
        });

        ldapClient.on('resultError', function (err) {
            logger.error('ldap client resultError: ' + err);
        });

        ldapClient.on('socketTimeout', function (err) {
            logger.error('ldap socket timeout: ' + err);
        });

        ldapClient.on('timeout', function (err) {
            logger.error('ldap client timeout: ' + err);
        });
        return ldapClient;
    } catch (error) {
        return Error(error);
    }
};

module.exports = router;