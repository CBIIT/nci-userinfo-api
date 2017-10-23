const express = require('express');
const nvRouter = express.Router();
var js2xmlparser = require('js2xmlparser2');
const { getProperties, getPropertiesForUser } = require('../model/db');

const parserOptions = {
    wrapArray: {
        enabled: true
    }
};

const router = () => {


    nvRouter.route('/props')
        .get(async (req, res) => {

            try {
                const props = await getProperties();
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
            console.log(nihId);
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

    return nvRouter;
};


module.exports = router;