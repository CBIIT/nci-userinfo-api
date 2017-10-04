const config = require(process.env.NODE_CONFIG_FILE_API);
const oracledb = require('oracledb');
const nVisionConfig = require('../config/nVisionConfig')(config);

const getConnection = () => {
    return oracledb.getConnection(nVisionConfig);
};


const getProperties = async () => {
    const connection = await getConnection();
    const result = await connection.execute(
        'SELECT * ' +
        'FROM PROP_EDW.PROP_AGGR_LIFE_EXPTNCY_MV_VW',
        [],
        { resultSet: true, outFormat: oracledb.OBJECT });
    // connection.close();
    return result;
};

module.exports = { getProperties };
