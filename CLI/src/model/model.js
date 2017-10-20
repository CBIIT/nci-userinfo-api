const config = require(process.env.NODE_CONFIG_FILE_API);
const logger = require('../config/log');
const vdsConnector = require('../connectors/vdsConnector');
const mongoConnector = require('../connectors/mongoConnector');
const nVisionConnector = require('../connectors/nVisionConnector');

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
        console.log('Users reloaded');
        console.log('Goodbye!');
        process.exit();
    } catch (error) {
        console.log('FATAL ERROR: ' + error);
        process.exit();
    }
};

const reloadFredUsers = async () => {
    console.log('Pending implementation upon swith to WSSecurity');
};

const reloadProperties = async () => {

    try {
        const result = await nVisionConnector.getProperties();
        const resultMessage = await processnVisionResults(result.resultSet);
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
const processnVisionResults = async (resultSet) => (
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

module.exports = { reloadUsers, reloadProperties, reloadFredUsers };