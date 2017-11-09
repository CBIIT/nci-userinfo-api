'use strict';
const { config } = require('../../constants');
const logger = require('winston');
const WSSecurity = require('wssecurity');
const soap = require('soap');
const wsSecurity = new WSSecurity(config.fred.username, config.fred.password);
const userWsdl = config.fred.user_wsdl;
const propertyWsdl = config.fred.property_wsdl;

const getAllProperties = () => {
    return getFredResultPromise(propertyWsdl, 'GetAllProperty');
};

const getAllUsers = () => {
    return getFredResultPromise(userWsdl, 'GetAllItsmPeople');
};

const getFredResultPromise = (wsdl, methodName) => {
    return new Promise(async (resolve, reject) => {
        
        soap.createClient(wsdl, (err, soapClient) => {
            if (err) {
                logger.error(err);
                reject(err);
            }

            soapClient.setSecurity(wsSecurity);

            soapClient[methodName]((err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });

        });
    });
}


module.exports = { getAllProperties, getAllUsers };