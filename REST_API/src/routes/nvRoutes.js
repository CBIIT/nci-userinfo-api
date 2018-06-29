'use strict';
const logger = require('winston');
const express = require('express');
const nvRouter = express.Router();
const js2xmlparser = require('js2xmlparser2');
const { getProperties, getPropertiesForUser, getOrphanedProperties } = require('../model/db');

const parserOptions = {
    wrapArray: {
        enabled: true
    }
};

const router = () => {

    nvRouter.route('/props')
        .get(async (req, res) => {
            logger.info('Getting all properties');
            try {
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
                return error;
            }
        });


    nvRouter.route('/props/user/:nihId')
        .get(async (req, res) => {
            const nihId = req.params.nihId;
            logger.info('Getting properties for ' + nihId);
            try {
                const props = await getPropertiesForUser(nihId);
                if (req.accepts('xml')) {
                    res.send(js2xmlparser('properties', props, parserOptions));
                } else {
                    res.send(props);
                }
            } catch (error) {
                return error;
            }
        });

    nvRouter.route('/props/orphaned')
        .get(async (req, res) => {
            try {
                const props = await getOrphanedProperties();
                if (req.accepts('xml')) {
                    res.send(js2xmlparser('properties', props, parserOptions));
                } else {
                    res.send(props);
                }
            } catch (error) {
                return error;
            }
        });

    return nvRouter;
};


module.exports = router;
