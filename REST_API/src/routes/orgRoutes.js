'use strict';
const { config } = require('../../constants');
const logger = require('winston');
const express = require('express');
const apiRouter = express.Router();
const { getOrgByFilter } = require('../model/db');

const router = () => {

    apiRouter.route('/sac/:sac')
        .get(async function (req, res) {
            try {
                const org = await getOrgByFilter({sac: req.params.sac.toUpperCase()});
                if (org) {
                    res.json(org);
                } else {
                    res.status(400).send('Organization not found');
                }
            } catch (error) {
                res.status(500).send(error);
            }
        });

    apiRouter.route('/short-name/:shortName')
        .get(async function (req, res) {
            try {
                const org = await getOrgByFilter({shortName: req.params.shortName.toUpperCase()});
                if (org) {
                    res.json(org);
                } else {
                    res.status(400).send('Organization not found');
                }
            } catch (error) {
                res.status(500).send(error);
            }
        });

    apiRouter.route('/subbranch/sac/:sac')
        .get(async function (req, res) {
            try {
                const org = await getOrgByFilter({parentSac: req.params.sac.toUpperCase()});
                if (org) {
                    res.json(org);
                } else {
                    res.status(400).send('Organization not found');
                }
            } catch (error) {
                res.status(500).send(error);
            }
        });

    apiRouter.route('/subbranch/short-name/:shortName')
        .get(async function (req, res) {
            try {
                const orgs = await getOrgByFilter({shortName: req.params.shortName.toUpperCase()});
                if (orgs) {
                    const results = [];
                    if (orgs.length > 0) {
                        for ( const org of orgs) {
                            const sac = org['sac'];
                            const subOrgs = await getOrgByFilter({parentSac: sac});
                            if (subOrgs.length > 0) {
                                results.push(subOrgs);
                            }
                        }
                    }
                    res.json(results);
                } else {
                    res.status(400).send('Organization not found');
                }
            } catch (error) {
                res.status(500).send(error);
            }
        });

    return apiRouter;
};

module.exports = router;