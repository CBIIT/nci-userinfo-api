const config = require(process.env.NODE_CONFIG_FILE_API);
const logger = require('winston');
const vdsConnector = require('../connectors/vdsConnector');
const mongoConnector = require('../connectors/mongoConnector');

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
        logger.info('ReturnedByVDS flag set to false on all user records');

    } catch (error) {
        logger.error('FATAL ERROR: ' + error);
        process.exit();
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

module.exports = { updateUsers, reloadUsers };