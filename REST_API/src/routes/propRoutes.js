const express = require('express');
const propRouter = express.Router();
const { getProperties } = require('../model/db');


const router = () => {


    propRouter.route('/props')
        .get(async (req, res) => {

            try {
                const props = await getProperties();
                res.send(props);
            } catch (error) {
                return error;
            }
        });

    return propRouter;
};


module.exports = router;