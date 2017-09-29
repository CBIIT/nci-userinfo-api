const config = require(process.env.NODE_CONFIG_FILE_API);
const logger = require('../config/log');
const ldap = require('ldapjs');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const fs = require('fs');
const tlsOptions = {
    ca: [fs.readFileSync(config.vds.vdscert)]
};
const { convertBase64Fields } = require('../util/base64Processing');
const oracledb = require('oracledb');
const nVisionConfig = require('../config/nVisionConfig')(config);
// const soap = require('soap');
// const WSSecurity = require('wssecurity');
// const wsSecurity = new WSSecurity(config.fred.username, config.fred.password);

var db, ldapClient;

var url = config.db.url;

const getDbConnection = () => {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
        } else {
            MongoClient.connect(url, (err, database) => {
                if (err) {
                    reject(err.message);
                }
                assert.equal(null, err);
                console.log('DB Connection successful');
                db = database;
                resolve(db);
            });
        }
    });
};

const getLDAPConnection = () => {
    return new Promise(resolve => {
        if (ldapClient) {
            resolve(ldapClient);
        } else {
            ldapClient = ldap.createClient({
                url: config.vds.host,
                reconnect: true,
                tlsOptions: tlsOptions,
                idleTimeout: 15 * 60 * 1000,
                timeout: 15 * 60 * 1000,
                connectTimeout: 15 * 60 * 1000 // 15 mins
            });

            ldapClient.on('connectError', (err) => {
                logger.error('ldap client connectError: ' + err + ' auto-reconnect.');
            });

            ldapClient.on('error', (err) => {
                logger.error('ldap client error: ' + err + ' auto-reconnect.');
            });

            ldapClient.on('resultError', (err) => {
                logger.error('ldap client resultError: ' + err + ' auto-reconnect.');
            });

            ldapClient.on('socketTimeout', (err) => {
                logger.error('ldap socket timeout: ' + err + ' auto-reconnect.');
            });

            ldapClient.on('timeout', (err) => {
                logger.error('ldap client timeout: ' + err + ' auto-reconnect.');
            });

            resolve(ldapClient);
        }
    });
};

const getUsers = (userId, ic) => {

    return new Promise((resolve, reject) => {

        const nciSubFilter = '(NIHORGACRONYM=' + ic + ')';
        //var nciSubFilter = '';
        const filter = userId ? ('(&(UNIQUEIDENTIFIER=' + userId + ')' + nciSubFilter + ')') : nciSubFilter;
        //const filter = userId ? 'UNIQUEIDENTIFIER=' + userId : 'UNIQUEIDENTIFIER=*';

        var userSearchOptions = {
            scope: 'sub',
            // attributes: config.vds.user_attributes,
            filter: filter,
            paged: true
        };
        var counter = 0;
        getLDAPConnection()
            .then((lc) => {
                lc.bind(config.vds.dn, config.vds.password, (err) => {

                    if (err) {
                        logger.error('Bind error: ' + err);
                        lc.unbind();
                        reject(Error(err.message));
                    }
                    var users = [];
                    logger.info('starting search');
                    lc.search(config.vds.searchBase, userSearchOptions, (err, ldapRes) => {
                        if (err) {
                            logger.error('error: ' + err.code);
                        }
                        ldapRes.on('searchEntry', (entry) => {
                            if (++counter % 10000 === 0) {
                                logger.info(counter + ' records found and counting...');
                            }
                            let obj = convertBase64Fields(entry);
                            users.push(obj);
                        });
                        ldapRes.on('searchReference', () => { });
                        ldapRes.on('page', () => {
                            logger.info('page end');
                        });
                        ldapRes.on('error', (err) => {
                            lc.unbind();
                            if (err.code === 32) {
                                resolve({});
                            } else {
                                reject(Error(err.message));
                            }
                        });
                        ldapRes.on('end', () => {
                            logger.info('unbind and release');
                            logger.info(counter + ' records found');
                            lc.unbind();
                            resolve(users);
                        });
                    });
                });
            });
    });
};

const reloadUsers = async () => {
    const db = await getDbConnection();
    console.log('connecting to ' + config.db.users_collection);
    const collection = db.collection(config.db.users_collection);

    try {
        await collection.remove({});
        console.log('All users removed');
    } catch (error) {
        console.log('FATAL ERROR: Failed to remove users collection');
        process.exit();
    }

    try {
        const users = await getUsers(null, 'nimhd');
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
    const db = await getDbConnection();
    console.log('connecting to ' + config.db.properties_collection);
    const collection = db.collection(config.db.properties_collection);
    try {
        await collection.remove({});
        console.log('All properties removed');
    } catch (error) {
        console.log('FATAL ERROR: Failed to remove properties collection');
        process.exit();
    }

    try {
        const connection = await oracledb.getConnection(nVisionConfig);
        console.log('nVision Connection successful');
        const result = await connection.execute(
            'SELECT * ' +
            'FROM PROP_EDW.PROP_AGGR_LIFE_EXPTNCY_MV_VW',
            [],
            { resultSet: true, outFormat: oracledb.OBJECT });
        console.log('We have results from nVision');
        await processnVisionResults(db, result.resultSet, collection, 1000);
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
                    doRelease(connection);
                    reject('Reload of properties failed: ' + err.message);
                } else if (rows.length > 0) {
                    console.log('processing ' + rows.length + ' rows');
                    collection.insertMany(rows, {
                        ordered: false
                    }, () => {
                        if (rows.length === numRows) {
                            processnVisionResults(connection, resultSet, collection, numRows);
                        } else {
                            doRelease(connection);
                            resolve('Properties Reloaded!');
                        }
                    });
                } else {
                    console.log('received ' + rows.length + ' results');
                    doRelease(connection);
                    resolve('Properties Reloaded!');
                }
            });
    })
);


const doRelease = (connection) => {
    connection.close(err => {
        if (err) {
            console.log(err.message);
        }
    }
    );
};


module.exports = { reloadUsers, reloadProperties, reloadFredUsers };