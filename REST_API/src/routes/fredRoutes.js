'use strict';
const logger = require('winston');
const express = require('express');
const fredRouter = express.Router();
const js2xmlparser = require('js2xmlparser2');
const { getFredProperties, getFredUsers, getFredPropertiesByPropertyOfficer, getFredPropertiesByCustodian,
    getFredUserById, getFredPropertyCount } = require('../model/db');


const parserOptions = {
    wrapArray: {
        enabled: true
    }
};


const router = () => {

    fredRouter.route('/props')
        .get(async (req, res) => {
            try {
                logger.info('Getting all Fred properties');
                const inputPageSize = parseInt(req.query.pageSize);
                const pageSize = inputPageSize > 0 ? inputPageSize : 1000;
                const inputPageNum = parseInt(req.query.pageNum);
                const pageNum = inputPageNum > 0 ? inputPageNum : 1;
                const props = await getFredProperties(pageSize, pageNum);
                if (req.accepts('xml')) {
                    res.send(js2xmlparser('properties', props, parserOptions));
                } else {
                    res.send(props);
                }
            } catch (error) {
                res.status(500).send(error);
            }
        });

    fredRouter.route('/props/count')
        .get(async (req, res) => {
            try {
                logger.info('Getting total number of all Fred properties');
                const numProps = await getFredPropertyCount({});
                res.send({count: numProps});
            } catch (error) {
                res.status(500).send(error);
            }
        });

    fredRouter.route('/props/officer/:nihId')
        .get(async (req, res) => {
            try {
                const nihId = req.params.nihId;
                logger.info('Getting Fred properties for property officer ' + nihId);
                const props = await getFredPropertiesByPropertyOfficer(nihId);
                if (req.accepts('xml')) {
                    res.send(js2xmlparser('properties', props, parserOptions));
                } else {
                    res.send(props);
                }
            } catch (error) {
                res.status(500).send(error);
            }
        });

    fredRouter.route('/props/custodian/:nihId')
        .get(async (req, res) => {
            try {
                const nihId = req.params.nihId;
                logger.info('Getting Fred properties for custodian ' + nihId);
                const props = await getFredPropertiesByCustodian(nihId);
                if (req.accepts('xml')) {
                    res.send(js2xmlparser('properties', props, parserOptions));
                } else {
                    res.send(props);
                }
            } catch (error) {
                res.status(500).send(error);
            }
        });


    fredRouter.route('/users')
        .get(async (req, res) => {
            try {
                logger.info('Getting all Fred users');
                const users = await getFredUsers();
                if (req.accepts('xml')) {
                    res.send(js2xmlparser('users', users, parserOptions));
                } else {
                    res.send(users);
                }
            } catch (error) {
                res.status(500).send(error);
            }
        });

    fredRouter.route('/users/user/:nihId')
        .get(async (req, res) => {
            try {
                const nihId = req.params.nihId;
                logger.info('Getting Fred user ' + nihId);
                const user = await getFredUserById(nihId);
                if (req.accepts('xml')) {
                    res.send(js2xmlparser('user', user, parserOptions));
                } else {
                    res.send(user);
                }
            } catch (error) {
                res.status(500).send(error);
            }
        });

    return fredRouter;
};

module.exports = router;
