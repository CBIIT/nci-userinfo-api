const config = require(process.env.NODE_CONFIG_FILE_API);
const MongoClient = require('mongodb').MongoClient;
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
                console.log('DB Connection successful');
                connection = database;
                resolve(connection);
            });
        }
    });
};

const releaseConnection = (connection) => {
    connection.close(err => {
        if (err) {
            console.log(err.message);
        }
    }
    );
};


module.exports = { getConnection, releaseConnection };