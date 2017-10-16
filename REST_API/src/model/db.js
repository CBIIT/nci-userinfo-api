const config = require(process.env.NODE_CONFIG_FILE_API);
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;


const getProperties = async () => {
    const connection = await getConnection();
    const collection = connection.collection(config.db.properties_collection);
    const results = await collection.find({},{_id: 0}).limit(100).toArray();

    return results;
};

const getConnection = () => {

    try {
        const connection = MongoClient.connect(config.db.url);
        return connection;
    } catch (error) {
        return Error(error);
    }
};


module.exports = {getProperties};