'use strict';
const { config } = require('../../constants');
const logger = require('winston');
const vdsConnector = require('../connectors/vdsConnector');
const mongoConnector = require('../connectors/mongoConnector');

const reloadUserView = async () => {
    const connection = await mongoConnector.getConnection();
    logger.info('connecting to ' + config.db.users_collection);
    const collection = await connection.collection(config.db.users_collection);

    try {
        await collection.remove({});
        logger.info('All users removed');
    } catch (error) {
        logger.info('FATAL ERROR: Failed to remove users collection');
        process.exit();
    }

    try {
        const numUsers = await vdsConnector.getUsers(null, 'nci', async (users) => {
            await collection.insertMany(users, {
                ordered: false
            });
            logger.debug(`Page end | ${users.length} users records reloaded`);
        });
        logger.info(`Reloading user finished: ${numUsers} users reloaded`);
        logger.info('Goodbye!');
        process.exit();
    } catch (error) {
        logger.error('FATAL ERROR: ' + error);
        process.exit();
    }
};


const compareFredAndVDS = async () => {
    const connection = await mongoConnector.getConnection();
    logger.info('connecting to ' + config.db.fred_users_collection);
    const collection = await connection.collection(config.db.fred_users_collection);

    try {
        const fredUsers = await collection.find({}).toArray();
        logger.info(fredUsers.length);
        const collection2 = await connection.collection(config.db.users_collection);

        for (const fredUser of fredUsers) {
            // logger.info(fredUser);
            const vdsUser = await collection2.findOne({ UNIQUEIDENTIFIER: fredUser.NedId });
            // logger.info(vdsUser);

            if (vdsUser) {
                if (vdsUser.GIVENNAME.toUpperCase() !== fredUser.FirstName.toUpperCase() || vdsUser.NIHMIXCASESN.toUpperCase() !== fredUser.LastName.toUpperCase()) {
                    logger.info(`NED ID: ${vdsUser.UNIQUEIDENTIFIER}, Fred Name: ${fredUser.FirstName} ${fredUser.LastName}, VDS Name: ${vdsUser.GIVENNAME} ${vdsUser.NIHMIXCASESN} `);
                }
            }

            // if (!vdsUser) {
            //     logger.info(`User with NED ID ${fredUser.NedId} is not in VDS`);
            // } else {
            //     if (vdsUser.GIVENNAME !== fredUser.FirstName || vdsUser.NIHMIXCASESN !== fredUser.LastName) {
            //         logger.info(`NED ID: ${vdsUser.UNIQUEIDENTIFIER}, Fred Name: ${fredUser.FirstName} ${fredUser.LastName}, VDS Name: ${vdsUser.GIVENNAME} ${vdsUser.NIHMIXCASESN} `);

            //     }
            // }
        }
        logger.info('Bye!');
        process.exit(0);

    } catch (error) {
        logger.error('FATAL ERROR: ' + error);
        process.exit();
    }
};


module.exports = { reloadUserView, compareFredAndVDS };