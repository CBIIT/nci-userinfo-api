module.exports = function (config) {
    return {
        user: config.nVision.user,
        password: config.nVision.password,
        connectString: config.nVision.host + ':' + config.nVision.port + '/' + config.nVision.serviceName
    };
};