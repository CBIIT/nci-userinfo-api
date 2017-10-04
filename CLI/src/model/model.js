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
        const users = await vdsConnector.getUsers(null, 'nimhd');
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
    const connection = await mongoConnector.getConnection();
    console.log('connecting to ' + config.db.properties_collection);
    const collection = connection.collection(config.db.properties_collection);
    try {
        await collection.remove({});
        console.log('All properties removed');
    } catch (error) {
        console.log('FATAL ERROR: Failed to remove properties collection');
        process.exit();
    }

    try {
        const result = await nVisionConnector.getProperties();
        await processnVisionResults(connection, result.resultSet, collection, 1000);
        console.log('Properties reloaded!');

    } catch (error) {
        console.log('FATAL ERROR: ' + error);
        process.exit();
    }

};

/**
 * This is the description
 * @param {ClientConnection} connection 
 * @param {*} resultSet 
 * @param {*} collection 
 * @param {*} numRows
 * @return {string} "Wow!" 
 */
const processnVisionResults = (connection, resultSet, collection, numRows) => (
    new Promise((resolve, reject) => {
        console.log('processing result set');
        resultSet.getRows(
            numRows,
            (err, rows) => {
                if (err) {
                    console.log(err.message);
                    mongoConnector.releaseConnection(connection);
                    reject('Reload of properties failed: ' + err.message);
                } else if (rows.length > 0) {
                    console.log('processing ' + rows.length + ' rows');
                    collection.insertMany(rows, {
                        ordered: false
                    }, () => {
                        if (rows.length === numRows) {
                            processnVisionResults(connection, resultSet, collection, numRows);
                        } else {
                            mongoConnector.releaseConnection(connection);
                            resolve('Properties Reloaded!');
                        }
                    });
                } else {
                    console.log('received ' + rows.length + ' results');
                    mongoConnector.releaseConnection(connection);
                    resolve('Properties Reloaded!');
                }
            });
    })
);

module.exports = { reloadUsers, reloadProperties, reloadFredUsers };