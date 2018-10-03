'use strict';
const { config } = require('../../constants');
const logger = require('winston');
const mongoConnector = require('../connectors/mongoConnector');

const paths = {
    'NCI CCR': {
        'sac': 'HNC7',
        'path': 'NCI CCR',
        'parentPath': 'NCI',
        'parentShortName': 'NCI',
        'shortName': 'CCR',
        'name': 'CENTER FOR CANCER RESEARCH'
    },
    'NCI DCTD': {
        'sac': 'HNCB',
        'path': 'NCI DCTD',
        'parentPath': 'NCI',
        'parentShortName': 'NCI',
        'shortName': 'DCTD',
        'name': 'DIVISION OF CANCER TREATMENT AND DIAGNOSIS'

    },
    'NCI DCCPS': {
        'sac': 'HNCD',
        'path': 'NCI DCCPS',
        'parentPath': 'NCI',
        'parentShortName': 'NCI',
        'shortName': 'DCCPS',
        'name': 'DIVISION OF CANCER CONTROL AND POPULATION SCIENCES'
    },
    'NCI DCB': {
        'sac': 'HNCC',
        'path': 'NCI DCB',
        'parentPath': 'NCI',
        'parentShortName': 'NCI',
        'shortName': 'DCB',
        'name': 'DIVISION OF CANCER BIOLOGY'
    },
    'NCI DEA': {
        'sac': 'HNC5',
        'path': 'NCI DEA',
        'parentPath': 'NCI',
        'parentShortName': 'NCI',
        'shortName': 'DEA',
        'name': 'DIVISION OF EXTRAMURAL ACTIVITIES'
    },
    'NCI DCEG': {
        'sac': 'HNC9',
        'path': 'NCI DCEG',
        'parentPath': 'NCI',
        'parentShortName': 'NCI',
        'shortName': 'DCEG',
        'name': 'DIVISION OF CANCER EPIDEMIOLOGY AND GENETICS'
    },
    'NCI OD OCPL': {
        'sac': 'HNC14',
        'path': 'NCI OD OCPL',
        'parentPath': 'NCI OD',
        'parentShortName': 'OD',
        'shortName': 'OCPL',
        'name': 'OFFICE OF COMMUNICATIONS AND PUBLIC LIAISON'
    },
    'NCI CCR LGD': {
        'sac': 'HNC7L',
        'path': 'NCI CCR LGD',
        'parentPath': 'NCI CCR',
        'parentShortName': 'CCR',
        'shortName': 'LGD',
        'name': 'LABORATORY OF GENOMIC DIVERSITY'
    },
    'NCI CCR LCCTP': {
        'sac': 'HNC7Q',
        'path': 'NCI CCR LCCTP',
        'parentPath': 'NCI CCR',
        'parentShortName': 'CCR',
        'shortName': 'LCCTP',
        'name': 'LABORATORY OF CELLULAR CARCINOGENESIS AND TUMOR PROMOTION'
    },
};


const parseOrgs = async function() {
    try {
        const connection = await mongoConnector.getConnection();
        console.log('connecting to ' + config.db.users_collection);
        const usersCollection = connection.collection(config.db.users_collection);
        const orgsCollection = connection.collection(config.db.orgs_collection);
        const sacs = {};

        for (const path in paths) {
            const org = paths[path];
            sacs[org.sac] = org;
        }

        usersCollection.find().toArray( async (err, users) => {
            var totalUsers = 0;
            var totalSacs = 0;
            if (err) {
                logger.error(err);
                process.exit();
            }

            for (const user of users) {
                totalUsers++;
                const sac = user.SAC || user.NIHSAC;
                if (!sac) {
                    continue;
                }
                const path = user.NIHORGPATH;
                const name = user.NIHOUNAME;
                if (sacs[sac]) {
                    if (path !== sacs[sac].path) {
                        logger.warn('Data inconsistency: Different org paths! Ignoring new path!');
                        logger.warn(`New: ${path}   old: ${sacs[sac].path}`);
                        continue;
                    } else if (name !== sacs[sac].name) {
                        logger.warn('Data inconsistency: Different Names, updating to new name!');
                        logger.warn(`new: "${name}"   old: "${sacs[sac].name}"`);
                        sacs[sac].name = name;
                    }
                } else {
                    totalSacs++;
                    const pathArr = path.split(' ');
                    paths[path] = {
                        'sac': sac,
                        'path': path,
                        'parentPath': pathArr.slice(0, -1).join(' '),
                        'parentShortName': pathArr.length > 1 ? pathArr[pathArr.length - 2] : '',
                        'name': name,
                        'shortName': pathArr[pathArr.length - 1]
                    };
                    sacs[sac] = paths[path];
                }
            }
            const missingPaths = {};
            for (const key in sacs) {
                const org = sacs[key];
                const parentPath = org.parentPath;
                if (parentPath && paths[parentPath]) {
                    org.parentSac = paths[parentPath].sac;
                } else {
                    org.parentSac = '';
                    if (parentPath) {
                        if (!missingPaths[parentPath]) {
                            missingPaths[parentPath] = [];
                        }
                        missingPaths[parentPath].push(org.path);
                    }
                }
            }

            const inserts = [];
            for (const key in sacs) {
                const org = sacs[key];
                const existing = await orgsCollection.find({'sac': org.sac}).toArray();
                if (existing.length > 0) {
                    logger.info(`${org.shortName} already in DB, ignoring it`);
                } else {
                    inserts.push(org);
                    //insert into DB
                    logger.info(`Inserting ${org.shortName} ...`);
                }
            }
            if (inserts.length > 0) {
                const inserted = await insertDocs(orgsCollection, inserts);
                logger.info(`${inserted} organizations inserted!`);
            }

            for (const key in missingPaths) {
                logger.warn(`Missing path: ${key} of ${missingPaths[key]}`);
            }

            logger.info(`Total users: ${totalUsers}, total Organizations: ${totalSacs}`);

            process.exit();
        });
    } catch (error) {
        logger.error('FATAL ERROR: ' + error);
        process.exit(1);
    }
};

async function insertDocs(collection, docs) {
    return new Promise((resolve, reject) => {
        collection.insertMany(docs, (err, result) => {
            if (err) {
                logger.error(`Insert failed! => ${err}`);
                reject(err);
            } else if (result.insertedCount !== docs.length) {
                logger.error(`Inserting ${docs.length} documents failed! => ${result.insertedCount} documents inserted!`);
                reject(result.insertedCount);
            } else {
                resolve(result.insertedCount);
            }
        });

    });
}

module.exports = { parseOrgs };