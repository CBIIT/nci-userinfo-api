const config = require(process.env.NODE_CONFIG_FILE_API);
const oracledb = require('oracledb');
const nVisionConfig = require('../config/nVisionConfig')(config);

const getConnection = () => {
    return oracledb.getConnection(nVisionConfig);
};


const getProperties = async () => {
    const connection = await getConnection();
    
    const result = await connection.execute(
        config.nVision.propertyQuery,
        [],
        { resultSet: true, outFormat: oracledb.OBJECT });
    return result;
};

module.exports = { getProperties };
