const config = require(process.env.NODE_CONFIG_FILE_API);
const logger = require('winston');
const nedConnector = require('../connectors/nedConnector');
const mongoConnector = require('../connectors/mongoConnector');
const util = require('../util/api-util');

const updateNedChanges = async () => {
    const connection = await mongoConnector.getConnection();
    logger.info('Starting NED changes update');
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


module.exports = { updateNedChanges };