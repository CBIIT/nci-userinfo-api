'use strict';
const { config } = require('../../constants');
const logger = require('winston');
const vdsConnector = require('../connectors/vdsConnector');
const mongoConnector = require('../connectors/mongoConnector');

const reloadUsers = async () => {
    const connection = await mongoConnector.getConnection();
    logger.info('connecting to ' + config.db.users_collection);
    const collection = connection.collection(config.db.users_collection);

    try {
        await collection.remove({});
        logger.info('All users removed');
    } catch (error) {
        logger.info('FATAL ERROR: Failed to remove users collection');
        process.exit();
    }

    try {
        const numUsers = await vdsConnector.getUsers(null, 'nci', async (users) => {
            users.forEach(user => {
                user.NEDId = user.UNIQUEIDENTIFIER;
                user.FirstName = user.GIVENNAME;
                user.MiddleName = user.MIDDLENAME;
                user.LastName = user.NIHMIXCASESN;
                user.Email = getEmail(user);
                user.Phone = user.TELEPHONENUMBER;
                user.Classification = user.ORGANIZATIONALSTAT;
                user.SAC = user.NIHSAC;
                user.AdministrativeOfficerId = user.NIHSERVAO;
                user.COTRId = user.NIHCOTRID;
                user.ManagerId = user.MANAGER;
                user.Locality - user.L;
                user.PointOfContactId = user.NIHPOC;
                user.Division = getDivision(user);
                user.Locality = user.L;
                user.Site = user.NIHSITE;
                user.Building = getBuilding(user);
                user.Room = user.ROOMNUMBER;
            });

            await collection.insertMany(users, {
                ordered: false
            });
            logger.debug(`Page end | ${users.length} user records reloaded`);
        });

        logger.info(`Reloading users finished: ${numUsers} users reloaded`);
        logger.info('Goodbye!');
        process.exit();
    } catch (error) {
        logger.error('FATAL ERROR: ' + error);
        process.exit();
    }
};

const updateUsers = async () => {
    const connection = await mongoConnector.getConnection();
    logger.info('Starting user collection update');
    const collection = connection.collection(config.db.users_collection);
    try {
        await collection.update({}, { $set: { ReturnedByVDS: false } }, { upsert: false, multi: true });
        logger.info('ReturnedByVDS flag set to false on all user records');

    } catch (error) {
        logger.error('FATAL ERROR: ' + error);
        process.exit(1);
    }

    try {
        logger.info('Getting VDS users');
        const numUsers = await vdsConnector.getUsers(null, 'nci', async (users) => {
            const ops = [];

            users.forEach(user => {
                user.NEDId = user.UNIQUEIDENTIFIER;
                user.FirstName = user.GIVENNAME;
                user.MiddleName = user.MIDDLENAME;
                user.LastName = user.NIHMIXCASESN;
                user.Email = getEmail(user);
                user.Phone = user.TELEPHONENUMBER;
                user.Classification = user.ORGANIZATIONALSTAT;
                user.SAC = user.NIHSAC;
                user.AdministrativeOfficerId = user.NIHSERVAO;
                user.COTRId = user.NIHCOTRID;
                user.ManagerId = user.MANAGER;
                user.Locality - user.L;
                user.PointOfContactId = user.NIHPOC;
                user.Division = getDivision(user);
                user.Locality = user.L;
                user.Site = user.NIHSITE;
                user.Building = getBuilding(user);
                user.Room = user.ROOMNUMBER;
                ops.push({
                    replaceOne:
                        {
                            filter: { UNIQUEIDENTIFIER: user.UNIQUEIDENTIFIER },
                            replacement: user,
                            upsert: true
                        }
                });
            });
            await collection.bulkWrite(ops);
            logger.debug(`Page end | ${users.length} user records updated`);
        });
        logger.info(`Updating users finished: ${numUsers} users updated`);
        logger.info('Goodbye!');
        process.exit(0);
    } catch (error) {
        logger.error('FATAL ERROR: ' + error);
        process.exit(1);
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
    if (result == null) result = obj.MAIL;
    if (result == null) return obj.NIHPRIMARYSMTP;
    return result;
};

const getBuilding = (obj) => {

    if (obj.BUILDINGNAME) {
        return 'BG ' + obj.BUILDINGNAME;
    } else {
        return 'N/A';
    }
};

const getDivision = (obj) => {

    let result = 'N/A';

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


module.exports = { updateUsers, reloadUsers };
