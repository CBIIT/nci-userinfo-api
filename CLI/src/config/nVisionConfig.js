'use strict';
const { config } = require('../../constants');

module.exports = () => {
    return {
        user: config.nVision.user,
        password: config.nVision.password,
        connectString: config.nVision.host + ':' + config.nVision.port + '/' + config.nVision.serviceName
    };
};