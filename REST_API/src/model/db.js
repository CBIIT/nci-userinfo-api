'use strict';
const { config } = require('../../constants');
const logger = require('winston');
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
let connection = null;
const fredPropertyProjection = config.fred.property_attributes.reduce(function (acc, cur) {
    acc['_id'] = 0;
    acc[cur] = 1;
    return acc;
}, {});

const getProperties = async (pageSize, pageNum) => {
    const connection = getConnection();
    const collection = connection.collection(config.db.properties_collection);
    const results = await collection.find({}, {_id: 0}).skip(pageSize * (pageNum -1)).limit(pageSize).toArray();
    return results;
};

const getPropertiesForUser = async (nihId) => {
    const connection = getConnection();
    const collection = connection.collection(config.db.properties_collection);
    const results = await collection.find({ CURR_NED_ID: nihId }, {_id: 0}).toArray();
    return results;
};

const getOrphanedProperties = async () => {
    const connection = getConnection();
    const propsCollection = connection.collection(config.db.properties_collection);
    const usersCollection = connection.collection(config.db.users_collection);

    let nvNedIds = [];
    try {
        nvNedIds = await propsCollection.distinct('CURR_NED_ID');
        nvNedIds = nvNedIds.sort();
    } catch (error) {
        logger.error(error);
        return error;
    }

    let vdsNedIds = [];
    try {
        vdsNedIds = await usersCollection.distinct('UNIQUEIDENTIFIER');
        vdsNedIds = vdsNedIds.sort();
    } catch (error) {
        logger.error(error);
        return error;
    }

    let left = nvNedIds.shift();
    let right = vdsNedIds.shift();
    let orphaned = [];
    while (left) {
        if (left && left === right) {
            // do nothing
            left = nvNedIds.shift();
            right = vdsNedIds.shift();
        } else if (right && (!left || left > right)) {
            // user without properties - ignore.
            right = vdsNedIds.shift();
        } else if (left && (!right || left < right)) {

            // orphaned property on left
            orphaned.push(left);
            left = nvNedIds.shift();
        }
    }

    return orphaned.sort();
};

const getFredUsers = async () => {
    const connection = getConnection();
    const collection = connection.collection(config.db.fred_users_collection);
    const results = await collection.find({}, { _id: 0 }).toArray();
    return results;
};

const getFredProperties = async (pageSize, pageNum) => {
    const connection = getConnection();
    const collection = connection.collection(config.db.fred_properties_collection);
    const results = await collection.find({}, fredPropertyProjection).skip(pageSize * (pageNum -1)).limit(pageSize).toArray();
    return results;
};

const getFredPropertiesByPropertyOfficer = async (propertyOfficerNedId) => {
    const connection = getConnection();
    const collection = connection.collection(config.db.fred_properties_collection);
    const results = await collection.find({ PropertyOfficerNedId: propertyOfficerNedId }, fredPropertyProjection).toArray();
    return results;
};

const getFredPropertiesByCustodian = async (custodianNedId) => {
    const connection = getConnection();
    const collection = connection.collection(config.db.fred_properties_collection);
    const results = await collection.find({ CustodianNedId: custodianNedId }, fredPropertyProjection).toArray();
    return results;
};

const getFredUserById = async (nihId) => {
    const connection = getConnection();
    const collection = connection.collection(config.db.fred_users_collection);
    const results = await collection.findOne({ NedId: nihId }, { _id: 0 });
    return results;
};

const getOrgByFilter = async (filter) => {
    const connection = getConnection();
    const collection = connection.collection(config.db.orgs_collection);
    const results = await collection.find(filter, { _id: 0 }).toArray();
    return results;
};

const initDbConnection = () => {
    return new Promise(async (resolve, reject) => {
        try {

            connection = await MongoClient.connect(config.db.url, { poolSize: 10 });
            resolve();
        } catch (error) {
            reject(error);
        }
    });

};

const getConnection = () => {
    return connection;
};


module.exports = { initDbConnection, getProperties, getPropertiesForUser, getOrphanedProperties, getFredProperties, getFredUsers, getFredPropertiesByPropertyOfficer, getFredPropertiesByCustodian, getFredUserById, getOrgByFilter };
