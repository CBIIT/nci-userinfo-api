const config = require(process.env.NODE_CONFIG_FILE_API);
const logger = require('winston');
const fredConnector = require('../connectors/fredConnector');
const mongoConnector = require('../connectors/mongoConnector');

const reloadProperties = async () => {
    logger.info('Starting Fred Property reload ... ');
    const connection = await mongoConnector.getConnection();
    const collection = connection.collection(config.db.fred_properties_collection);

    try {
        await collection.remove({});
        logger.info('All properties removed');
    } catch (error) {
        logger.error('FATAL ERROR: Failed to remove property collection');
        process.exit(1);
    }

    try {
        const properties = await (fredConnector.getAllProperties())
        await collection.insertMany(properties.GetAllPropertyResult.Property, { ordered: false });
        logger.info('Fred properties updated ... Goodbye!');
        process.exit(0);
    } catch (error) {
        logger.error('Fatal error: ' + error);
        process.exit(1);
    }

};

const reloadUsers = async () => {
    logger.info('Starting Fred Users reload ... ');
    const connection = await mongoConnector.getConnection();
    const collection = connection.collection(config.db.fred_users_collection);

    try {
        await collection.remove({});
        logger.info('All users removed');
    } catch (error) {
        logger.error('FATAL ERROR: Failed to remove users collection');
        process.exit(1);
    }

    try {
        const users = await (fredConnector.getAllUsers())
        await collection.insertMany(users.GetAllItsmPeopleResult.Person, { ordered: false });
        logger.info('Fred users updated ... Goodbye!');
        process.exit(0);
    } catch (error) {
        logger.error('Fatal error: ' + error);
        process.exit(1);
    }
};

module.exports = { reloadUsers, reloadProperties };