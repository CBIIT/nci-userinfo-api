const config = require(process.env.NODE_CONFIG_FILE_API);
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;


const getProperties = async () => {
    const connection = await getConnection();
    const collection = connection.collection(config.db.properties_collection);
    const results = await collection.find({}, { _id: 0 }).toArray();

    return results;
};

const getPropertiesForUser = async (nihId) => {
    const connection = await getConnection();
    const collection = connection.collection(config.db.properties_collection);
    const results = await collection.find({ CURR_NED_ID: nihId }, { _id: 0 }).toArray();

    return results;
};

const getOrphanedProperties = async () => {

    const connection = await getConnection();
    const propsCollection = connection.collection(config.db.properties_collection);
    const usersCollection = connection.collection(config.db.users_collection);

    let nvNedIds = [];
    try {
        nvNedIds = await propsCollection.distinct('CURR_NED_ID');
        nvNedIds = nvNedIds.sort();
    } catch (error) {
        console.log(error);
        return error;
    }

    let vdsNedIds = [];
    try {
        vdsNedIds = await usersCollection.distinct('UNIQUEIDENTIFIER');
        vdsNedIds = vdsNedIds.sort();
    } catch (error) {
        console.log(error);
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

    // const results = await propsCollection.find({ CURR_NED_ID: { $in: orphaned } }).limit(5).toArray();

    return orphaned.sort();
};

const getConnection = () => {

    try {
        const connection = MongoClient.connect(config.db.url);
        return connection;
    } catch (error) {
        return Error(error);
    }
};


module.exports = { getProperties, getPropertiesForUser, getOrphanedProperties };