const config = require(process.env.NODE_CONFIG_FILE_API);
const logger = require('../config/log');
const ldap = require('ldapjs');
const fs = require('fs');
const tlsOptions = {
    ca: [fs.readFileSync(config.vds.vdscert)]
};

var ldapClient;

const getConnection = () => {
    return new Promise(resolve => {
        if (ldapClient) {
            resolve(ldapClient);
        } else {
            ldapClient = ldap.createClient({
                url: config.vds.host,
                reconnect: true,
                tlsOptions: tlsOptions,
                idleTimeout: 15 * 60 * 1000,
                timeout: 15 * 60 * 1000,
                connectTimeout: 15 * 60 * 1000 // 15 mins
            });

            ldapClient.on('connectError', (err) => {
                logger.error('ldap client connectError: ' + err + ' auto-reconnect.');
            });

            ldapClient.on('error', (err) => {
                logger.error('ldap client error: ' + err + ' auto-reconnect.');
            });

            ldapClient.on('resultError', (err) => {
                logger.error('ldap client resultError: ' + err + ' auto-reconnect.');
            });

            ldapClient.on('socketTimeout', (err) => {
                logger.error('ldap socket timeout: ' + err + ' auto-reconnect.');
            });

            ldapClient.on('timeout', (err) => {
                logger.error('ldap client timeout: ' + err + ' auto-reconnect.');
            });

            resolve(ldapClient);
        }
    });
};


const getUsers = (userId, ic) => {

    return new Promise((resolve, reject) => {

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
        getConnection()
            // getLDAPConnection()
            .then((lc) => {
                lc.bind(config.vds.dn, config.vds.password, (err) => {

                    if (err) {
                        logger.error('Bind error: ' + err);
                        lc.unbind();
                        reject(Error(err.message));
                    }
                    var users = [];
                    logger.info('starting search');
                    lc.search(config.vds.searchBase, userSearchOptions, (err, ldapRes) => {
                        if (err) {
                            logger.error('error: ' + err.code);
                        }
                        ldapRes.on('searchEntry', (entry) => {
                            if (++counter % 10000 === 0) {
                                logger.info(counter + ' records found and counting...');
                            }
                            let obj = convertBase64Fields(entry);
                            users.push(obj);
                        });
                        ldapRes.on('searchReference', () => { });
                        ldapRes.on('page', () => {
                            logger.info('page end');
                        });
                        ldapRes.on('error', (err) => {
                            lc.unbind();
                            if (err.code === 32) {
                                resolve({});
                            } else {
                                reject(Error(err.message));
                            }
                        });
                        ldapRes.on('end', () => {
                            logger.info('unbind and release');
                            logger.info(counter + ' records found');
                            lc.unbind();
                            resolve(users);
                        });
                    });
                });
            });
    });
};

const base64LdapFields = [
    'objectGUID',
    'mS-DS-ConsistencyGuid',
    'msExchArchiveGUID',
    'msRTCSIP-UserRoutingGroupId',
    'msExchMailboxGuid',
    'objectSid',
    'userCertificate',
    'msExchSafeSendersHash',
    'msExchUMSpokenName',
    'userSMIMECertificate',
    'msRTCSIP-UserRoutingGroupId',
    'thumbnailPhoto'
];
/** Converts specific fields in an LDAP result entry to  to base64.
 * @input entry 
 */
const convertBase64Fields = (entry) => {
    let obj = entry.object;
    const raw = entry.raw;

    base64LdapFields.forEach(field => {
        let base64Field = raw[field];
        if (base64Field) {
            obj[field] = base64Field.toString('base64');
        }
    });

    return obj;

};

module.exports = { getUsers };