const config = require(process.env.NODE_CONFIG_FILE_API);
const WSSecurity = require('wssecurity');
const soap = require('soap');

const wsSecurity = new WSSecurity(config.ned.username, config.ned.password);
const wsdl = config.ned.wsdl_changes;

const getChanges = async (obj) => {
    let args = {
        ICorSITE: obj.ic,
        From_Date: obj.fromDate,
    }

    if (obj.fromTime) {
        args.From_time = obj.fromTime;
    }

    if (obj.toDate) {
        args.To_Date = obj.toDate;
    }

    if (obj.toTime) {
        args.To_time = obj.toTime;
    }

    return new Promise(async (resolve, reject) => {

        soap.createClient(wsdl, (err, soapClient) => {
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