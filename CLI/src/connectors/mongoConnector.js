'use strict';
const { config } = require('../../constants');
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
                    return reject(err.message);
                }
                if (!database) {
                    const message = 'Could not connect to MongoDB!';
                    logger.error(message);
                    return reject(message);
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