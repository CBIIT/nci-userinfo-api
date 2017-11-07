const config = require(process.env.NODE_CONFIG_FILE_API);
const MongoClient = require('mongodb').MongoClient;
const logger = require('winston');
const assert = require('assert');

var connection;

const getConnection = () => {
    return new Promise((resolve, reject) => {
        if (connection) {
            resolve(connection);
        } else {
            MongoClient.connect(config.db.url, (err, database) => {
                if (err) {
                    reject(err.message);
                }
                assert.equal(null, err);
                logger.info('Mongo Connection successful');
                connection = database;
                resolve(connection);
            });
        }
    });
};

const releaseConnection = (connection) => {
    connection.close(err => {
        if (err) {
            logger.error(err.message);
        } else {
            logger.info('Mongo Connection closed');
        }
    }
    );
};


module.exports = { getConnection, releaseConnection };