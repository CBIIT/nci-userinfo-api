'use strict';
const { config } = require('../../constants');
const oracledb = require('oracledb');
const nVisionConfig = require('../config/nVisionConfig')();

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
