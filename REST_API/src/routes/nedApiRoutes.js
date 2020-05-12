'use strict';
const { config } = require('../../constants');
const express = require('express');
const apiRouter = express.Router();
const WSSecurity = require('wssecurity');
const soap = require('soap');
const js2xmlparser = require('js2xmlparser2');
const logger = require('winston');

const parserOptions = {
    wrapArray: {
        enabled: true
    }
};

const router = () => {

    var wsSecurity = new WSSecurity(config.ned.username, config.ned.password);

    var isNum = new RegExp('^[0-9]+$');

    apiRouter.route('/ByName')
        .post(function (req, res) {
            try {
                logger.info(`Getting NED user by name`);
                var args = {
                    FirstName: req.body.FirstName,
                    LastName: req.body.LastName
                };

                var wsdl = config.ned.wsdl_v5;
                soap.createClient(wsdl, function (err, soapClient) {
                    soapClient.setSecurity(wsSecurity);
                    soapClient.ByName(args, function (err, result) {
                        if (err) {
                            res.status(500).send(err);
                        } else {
                            if (req.accepts('xml')) {
                                res.send(js2xmlparser('result', result, parserOptions));
                            } else {
                                res.send(result);
                            }
                        }
                    });
                });
            } catch (error) {
                res.status(500).send(error);
            }
        });

    apiRouter.route('/ByNIHid')
        .post(function (req, res) {
            try {
                logger.info(`Getting NED user by NIH ID`);
                var nihId = req.body.nihid;

                if (nihId === undefined) {
                    res.status(400).send('nihid is not defined.');
                    return;
                }

                if (!isNum.test(nihId)) {
                    res.status(400).send('nihid is not numeric.');
                    return;
                }

                var args = {
                    NIHID: req.body.nihid
                };

                var wsdl = config.ned.wsdl_v5;
                soap.createClient(wsdl, function (err, soapClient) {
                    soapClient.setSecurity(wsSecurity);
                    soapClient.ByNIHId(args, function (err, result) {
                        if (err) {
                            res.status(500).send(err);
                        } else {
                            if (req.accepts('xml')) {
                                res.send(js2xmlparser('result', result, parserOptions));
                            } else {
                                res.send(result);
                            }
                        }

                    });
                });
            } catch (error) {
                res.status(500).send(error);
            }
        });

    apiRouter.route('/ByIDAccount')
        .post(function (req, res) {
            try {
                logger.info(`Getting NED user by ID`);
                var args = {
                    Identifier: req.body.Identifier
                };

                var wsdl = config.ned.wsdl_v5;
                soap.createClient(wsdl, function (err, soapClient) {
                    soapClient.setSecurity(wsSecurity);
                    soapClient.ByADaccount(args, function (err, result) {
                        if (err) {
                            res.status(500).send(err);
                        } else {
                            if (req.accepts('xml')) {
                                res.send(js2xmlparser('result', result, parserOptions));
                            } else {
                                res.send(result);
                            }
                        }
                    });
                });
            } catch (error) {
                res.status(500).send(error);
            }
        });

    apiRouter.route('/ByIc')
        .post(function (req, res) {
            try {
                logger.info(`Getting NED users by IC`);
                var args = {
                    IC_or_SAC: req.body.IcoreSite,
                    ReturnNIHIDOnly: true
                };

                var wsdl = config.ned.wsdl_v5;
                soap.createClient(wsdl, function (err, soapClient) {
                    soapClient.setSecurity(wsSecurity);
                    soapClient.ByIC(args, function (err, result) {
                        res.send(result);
                    });
                });
            } catch (error) {
                res.status(500).send(error);
            }
        });

    apiRouter.route('/ChangesByIc')
        .post(function (req, res) {
            try {
                logger.info(`Getting NED changes by IC`);
                var args = {
                    ICorSITE: req.body.IcoreSite,
                    From_Date: req.body.From_Date,

                };

                if (req.body.From_Time) {
                    args.From_time = req.body.From_Time;
                }

                if (req.body.To_Date) {
                    args.To_Date = req.body.To_Date;
                }

                if (req.body.To_time) {
                    args.To_time = req.body.To_time;
                }

                var wsdl = config.ned.wsdl_changes;

                soap.createClient(wsdl, function (err, soapClient) {
                    soapClient.setSecurity(wsSecurity);
                    soapClient.ByIC(args, function (err, result) {
                        if (err) {
                            res.status(500).send(err);
                        } else {
                            if (req.accepts('xml')) {
                                res.send(js2xmlparser('result', result, parserOptions));
                            } else {
                                res.send(result);
                            }
                        }

                    });
                });
            } catch (error) {
                res.status(500).send(error);
            }
        });

    return apiRouter;

};

module.exports = router;