'use strict';
const logger = require('winston');
const express = require('express');
const fredRouter = express.Router();
const js2xmlparser = require('js2xmlparser2');
const { getFredProperties, getFredUsers } = require('../model/db');


const parserOptions = {
    wrapArray: {
        enabled: true
    }
};


const router = () => {

    fredRouter.route('/props')
        .get(async (req, res) => {
            logger.info('Getting all Fred properties');
            try {
                const props = await getFredProperties();
                if (req.accepts('xml')) {
                    res.send(js2xmlparser('properties', props, parserOptions));
                } else {
                    res.send(props);
                }
            } catch (error) {
                return error;
            }
        });


    fredRouter.route('/users')
        .get(async (req, res) => {
            logger.info('Getting all Fred users');
            try {
                const users = await getFredUsers();
                if (req.accepts('xml')) {
                    res.send(js2xmlparser('properties', users, parserOptions));
                } else {
                    res.send(users);
                }
            } catch (error) {
                return error;
            }
        });

    return fredRouter;
};

module.exports = router;
