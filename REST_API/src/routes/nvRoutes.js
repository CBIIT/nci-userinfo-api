'use strict';
const logger = require('winston');
const express = require('express');
const nvRouter = express.Router();
const js2xmlparser = require('js2xmlparser2');
const { getProperties, getPropertiesForUser, getOrphanedProperties, getPropertyCount } = require('../model/db');

const parserOptions = {
    wrapArray: {
        enabled: true
    }
};

const router = () => {

    nvRouter.route('/props')
        .get(async (req, res) => {
            try {
                logger.info('Getting all properties');
                const inputPageSize = parseInt(req.query.pageSize);
                const pageSize = inputPageSize > 0 ? inputPageSize : 1000;
                const inputPageNum = parseInt(req.query.pageNum);
                const pageNum = inputPageNum > 0 ? inputPageNum : 1;
                const props = await getProperties(pageSize, pageNum);
                if (req.accepts('xml')) {
                    res.send(js2xmlparser('properties', props, parserOptions));
                } else {
                    res.send(props);
                }
            } catch (error) {
                res.status(500).send(error);
            }
        });

    nvRouter.route('/props/count')
        .get(async (req, res) => {
            try {
                logger.info('Getting total number of all properties');
                const numProps = await getPropertyCount({});
                res.send({count: numProps});
            } catch (error) {
                res.status(500).send(error);
            }
        });


    nvRouter.route('/props/user/:nihId')
        .get(async (req, res) => {
            try {
                const nihId = req.params.nihId;
                logger.info('Getting properties for ' + nihId);
                const props = await getPropertiesForUser(nihId);
                if (req.accepts('xml')) {
                    res.send(js2xmlparser('properties', props, parserOptions));
                } else {
                    res.send(props);
                }
            } catch (error) {
                res.status(500).send(error);
            }
        });

    nvRouter.route('/props/orphaned')
        .get(async (req, res) => {
            try {
                logger.info('Getting orphaned properties');
                const props = await getOrphanedProperties();
                if (req.accepts('xml')) {
                    res.send(js2xmlparser('properties', props, parserOptions));
                } else {
                    res.send(props);
                }
            } catch (error) {
                res.status(500).send(error);
            }
        });

    return nvRouter;
};


module.exports = router;
