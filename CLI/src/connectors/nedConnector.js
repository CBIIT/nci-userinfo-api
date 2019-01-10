'use strict';
const { config } = require('../../constants');
const logger = require('winston');
const WSSecurity = require('wssecurity');
const soap = require('soap');

const wsSecurity = new WSSecurity(config.ned.username, config.ned.password);
const wsdl = config.ned.wsdl_changes;

const getChanges = (obj) => {
    let args = {
        ICorSITE: obj.ic,
        From_Date: obj.fromDate,
    };

    if (obj.fromTime) {
        args.From_time = obj.fromTime;
    }

    if (obj.toDate) {
        args.To_Date = obj.toDate;
    }

    if (obj.toTime) {
        args.To_time = obj.toTime;
    }

    return new Promise((resolve, reject) => {

        soap.createClient(wsdl, (err, soapClient) => {
            if (err) {
                logger.error('Error happened when trying to get soap client!');
                reject(err);
            }
            if (!soapClient) {
                const message = 'Could not get soap client!';
                logger.error(message);
                reject(message);
            }
            soapClient.setSecurity(wsSecurity);

            soapClient.ByIC(args, function (err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    });
};

module.exports = { getChanges };