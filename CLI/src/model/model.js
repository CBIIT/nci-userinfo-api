const config = require(process.env.NODE_CONFIG_FILE_API);
const logger = require('../config/log');
const vdsConnector = require('../connectors/vdsConnector');
const mongoConnector = require('../connectors/mongoConnector');
const nVisionConnector = require('../connectors/nVisionConnector');
const nedConnector = require('../connectors/nedConnector');
const util = require('../util/util');

const reloadUsers = async () => {
    const connection = await mongoConnector.getConnection();
    console.log('connecting to ' + config.db.users_collection);
    const collection = connection.collection(config.db.users_collection);

    try {
        await collection.remove({});
        console.log('All users removed');
    } catch (error) {
        console.log('FATAL ERROR: Failed to remove users collection');
        process.exit();
    }

    try {
        const users = await vdsConnector.getUsers(null, 'nci');
        await collection.insertMany(users, {
            ordered: false
        });
        logger.info('Users reloaded');
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
    const bulk = await collection.initializeUnorderedBulkOp();
    try {
        bulk.find({}).update({
            $set: { ReturnedByVDS: false }
        });
        await bulk.execute();
        logger.info('ExistsInVDS flag set to false on all user records');

    } catch (error) {
        logger.error('FATAL ERROR: ' + error);
    }

    try {
        logger.info('Getting VDS users');
        const users = await vdsConnector.getUsers(null, 'nci');
        logger.info('Updating user records');
        users.forEach(user => {
            bulk.find({ UNIQUEIDENTIFIER: user.UNIQUEIDENTIFIER }).upsert().replaceOne(user);
        });
        await bulk.execute();
        logger.info('User records updated');
        logger.info('Goodbye!');
        process.exit();
    } catch (error) {
        logger.error('FATAL ERROR: ' + error);
        process.exit();
    }
};

const updateNedChanges = async () => {
    const connection = await mongoConnector.getConnection();
    logger.info('Starting ned changes update');
    const collection = connection.collection(config.db.ned_changes_collection);
    const adminCollection = connection.collection(config.db.admin_collection);

    try {
        const currentDate = util.getCurrentDate();
        // get last update date from admin log or set to current date.
        const updateLog = await adminCollection.findOne({ 'state.ned_change_log': { $exists: true } });
        const fromDate = (((updateLog || {}).state || {}).ned_change_log || {}).lastUpdateDate || currentDate.date;
        const fromTime = (((updateLog || {}).state || {}).ned_change_log || {}).lastUpdateTime || '00:00:00';

        const nedChangesResult = await nedConnector.getChanges({ ic: 'NCI', fromDate: fromDate, fromTime: fromTime, toDate: currentDate.date, toTime: currentDate.time });
        const numChanges = parseInt(nedChangesResult.NUMBER_OF_RECORDS, 10);
        logger.info('Found ' + numChanges + ' NED changes since ' + fromDate + ' ' + fromTime);

        if (numChanges > 0) {
            const nedChanges = numChanges === 1 ? nedChangesResult.NED_CHANGES_RECORD.toArray() : nedChangesResult.NED_CHANGES_RECORD;
            await collection.insertMany(nedChanges, { ordered: false });
        }

        await adminCollection.updateOne(
            { state: { $exists: true } },
            {
                state: {
                    ned_change_log: {
                        lastUpdateDate: currentDate.date,
                        lastUpdateTime: currentDate.time

                    }
                }
            },
            { upsert: true }
        )
        logger.info('NED changes updated ... Goodbye!');
        process.exit();
    } catch (error) {
        logger.error(error);
        process.exit();
    }
};

const reloadFredUsers = async () => {
    console.log('Pending implementation upon switch to WSSecurity');
};

const reloadProperties = async () => {

    try {
        const result = await nVisionConnector.getProperties();
        const resultMessage = await procesnVisionResults(result.resultSet);
        console.log(resultMessage);

    } catch (error) {
        console.log(error);
        process.exit();
    }

};

/**
 * This is the description
 * @param {ClientConnection} connection 
 * @param {*} resultSet 
 * @param {*} collection 
 * @param {*} numRows
 * @return {string}  
 */
const procesnVisionResults = async (resultSet) => (
    new Promise(async (resolve, reject) => {
        console.log('processing result set');
        const connection = await mongoConnector.getConnection();
        console.log('connecting to ' + config.db.properties_collection);

        const propsCollection = connection.collection(config.db.properties_collection);
        const usersCollection = connection.collection(config.db.users_collection);
        const numRows = 1000;
        let moreResults = true;

        try {
            await propsCollection.remove({});
            console.log('All properties removed');
        } catch (error) {
            console.log('FATAL ERROR: Failed to remove properties collection');
            process.exit();
        }

        const nedIdMap = {};

        while (moreResults) {
            try {
                let rows = await resultSet.getRows(numRows);
                console.log('processing ' + rows.length + ' rows');
                await propsCollection.insertMany(rows, { ordered: false });
                if (rows.length < numRows) {
                    moreResults = false;
                    mongoConnector.releaseConnection(connection);
                    resolve('Properties reloaded');
                }
            } catch (error) {
                reject(error);
            }
        }
    })
);

module.exports = { reloadUsers, reloadProperties, reloadFredUsers, updateUsers, updateNedChanges };