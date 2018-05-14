'use strict';
const { config } = require('../../constants');
const logger = require('winston');
const ldap = require('ldapjs');
const fs = require('fs');
const tlsOptions = {
    ca: [fs.readFileSync(config.vds.vdscert)]
};
const util = require('../util/base64Processing');
const { getUserById, getPropertiesForUser } = require('../model/db');

const getUserGraphQLMongo = async (userId) => {

    return new Promise(async (resolve, reject) => {
        try {
            let user = await getUserById(userId);
            user = mapFields(user);
            user.administrative_officer = await getUserById(user.administrative_officer_id);
            if (user.administrative_officer) {
                user.administrative_officer = mapFields(user.administrative_officer);
            }
            user.point_of_contact = await getUserById(user.point_of_contact_id);
            if (user.point_of_contact) {
                user.point_of_contact = mapFields(user.point_of_contact);
            }
            user.manager = await getUserById(user.manager_id);
            if (user.manager) {
                user.manager = mapFields(user.manager);
            }
            user.cotr = await getUserById(user.cotr_id);
            if (user.cotr) {
                user.cotr = mapFields(user.cotr);
            }
            user.properties = await getPropertiesForUser(userId);
            resolve(user);
        } catch (error) {
            reject(error);
        }

    });

};

const getUsersGraphQL = async (userId, ic) => {

    return new Promise(async (resolve, reject) => {

        const nciSubFilter = '(NIHORGACRONYM=' + ic + ')';
        const filter = userId ? ('(&(UNIQUEIDENTIFIER=' + userId + ')' + nciSubFilter + ')') : nciSubFilter;
        //const filter = userId ? 'UNIQUEIDENTIFIER=' + userId : 'UNIQUEIDENTIFIER=*';

        const userSearchOptions = {
            scope: 'sub',
            // attributes: config.vds.user_attributes,
            filter: filter,
            paged: true
        };
        let counter = 0;
        const ldapClient = await getLdapClient();

        ldapClient.bind(config.vds.dn, config.vds.password, (err) => {

            if (err) {
                logger.error('Bind error: ' + err);
                ldapClient.destroy();
                reject(Error(err.message));
            }
            let users = [];
            logger.info('starting search');
            ldapClient.search(config.vds.searchBase, userSearchOptions, (err, ldapRes) => {
                if (err) {
                    reject(Error(err.message));
                }
                ldapRes.on('searchEntry', (entry) => {
                    if (++counter % 10000 === 0) {
                        logger.info(counter + ' records found and counting...');
                    }
                    let obj = util.convertBase64Fields(entry);
                    obj = mapFields(obj);
                    users.push(obj);
                });
                ldapRes.on('searchReference', () => { });
                ldapRes.on('page', () => {
                    logger.info(`page end | ${counter} users fetched so far.`);
                });
                ldapRes.on('error', (err) => {
                    ldapClient.destroy();
                    if (err.code === 32) {
                        // Object doesn't exist. The user DN is most likely not fully provisioned yet.
                        resolve({});
                    } else {
                        logger.error(err);
                        reject(Error(err.message));
                    }
                });
                ldapRes.on('end', () => {
                    logger.info('destroy client');
                    logger.info(counter + ' records found');
                    ldapClient.destroy();
                    resolve(users);
                });
            });

        });

    });
};


const mapFields = (user) => {

    user.ned_id = user.UNIQUEIDENTIFIER;
    // when users are transferring they temporarily have more than one distinguishedName. Hence, we will handle distinguishedName as an array in all cases.
    user.distinguished_name = typeof user.distinguishedName === 'string' ? [user.distinguishedName] : user.distinguishedName;
    user.inactive = inactive(user);
    user.first_name = user.GIVENNAME;
    user.middle_name = user.MIDDLENAME;
    user.last_name = user.NIHMIXCASESN;
    user.title = user.TITLE;
    user.email = getEmail(user);
    user.phone = user.TELEPHONENUMBER;
    user.status = user.ORGANIZATIONALSTAT;
    user.sac = user.NIHSAC;
    user.administrative_officer_id = user.NIHSERVAO;
    user.cotr_id = user.NIHCOTRID;
    user.manager_id = user.MANAGER;
    user.locality = user.L;
    user.point_of_contact_id = user.NIHPOC;
    user.division = getDivision(user);
    user.site = user.NIHSITE;
    user.building = getBuilding(user);
    user.room = user.ROOMNUMBER;
    user.member_of = user.memberOf;
    user.effective_start_date = user.NIHDIRENTRYEFFECTIVEDATE;
    user.effective_end_date = user.NIHDIRENTRYEXPIRATIONDATE;
    return user;
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

        ldapClient.on('connectError', (err) => {
            logger.error('ldap client connectError: ' + err);
        });

        ldapClient.on('error', (err) => {
            logger.error('ldap client error: ' + err);
        });

        ldapClient.on('resultError', (err) => {
            logger.error('ldap client resultError: ' + err);
        });

        ldapClient.on('socketTimeout', (err) => {
            logger.error('ldap socket timeout: ' + err);
        });

        ldapClient.on('timeout', (err) => {
            logger.error('ldap client timeout: ' + err);
        });
        return ldapClient;
    } catch (error) {
        return Error(error);
    }
};

const getEmail = (obj) => {

    let result = null;

    const proxyEmails = obj.proxyAddresses;
    if (proxyEmails) {
        if (Array.isArray(proxyEmails)) {
            proxyEmails.forEach(email => {
                const data = email.split(':');
                if (data[0] === 'SMTP') {
                    result = data[1];
                }
            });
        } else {
            const data = proxyEmails.split(':');
            if (data[0] === 'SMTP') {
                result = data[1];
            }
        }
    }
    return result;
};

const getDivision = (obj) => {

    let result = '';

    if (obj.NIHORGPATH) {
        const orgPathArr = obj.NIHORGPATH.split(' ') || [];
        const len = orgPathArr.length;

        if (len > 0 && len <= 2) {
            result = orgPathArr[len - 1];
        } else if (len > 2) {
            if (orgPathArr[1] === 'OD') {
                result = orgPathArr[2];
            } else {
                result = orgPathArr[1];
            }
        }
    }

    return result;

};

const getBuilding = (obj) => {
    let result = null;

    if (obj.BUILDINGNAME) {
        result = obj.BUILDINGNAME;
    } else {
        if (obj.NIHPHYSICALADDRESS && obj.NIHPHYSICALADDRESS.startsWith('9606 MEDICAL CENTER DR')) {
            result = '9609';
        } else if (obj.NIHPHYSICALADDRESS && obj.NIHPHYSICALADDRESS.startsWith('9605 MEDICAL CENTER DR')) {
            result = '9605';
        }
    }

    return result;
};


const inactive = (user) => {
    let result = false;

    if (user.distinguished_name && user.distinguished_name.join().includes('_InActive')) {
        result = true;
    }

    const today = new Date();
    if (user.NIHDIRENTRYEFFECTIVEDATE) {
        const startDate = new Date(user.NIHDIRENTRYEFFECTIVEDATE);
        if (startDate > today) {
            result = true;
        }
    }

    if (user.NIHDIRENTRYEXPIRATIONDATE) {
        const endDate = new Date(user.NIHDIRENTRYEXPIRATIONDATE);


        if (endDate < today) {
            result = true;
        }
    }

    return result;
};

module.exports = { getUsersGraphQL, getUserGraphQLMongo };
