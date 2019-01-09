'use strict';
const { config } = require('../../constants');
const logger = require('winston');
const express = require('express');
const apiRouter = express.Router();
const { getOrgByFilter, getOrgDescendantsBySac } = require('../model/db');

const router = () => {

    apiRouter.route('/sac/:sac')
        .get(async function (req, res) {
            try {
                logger.info(`Getting organization by SAC: ${req.params.sac}`);
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
                logger.info(`Getting organization by short name: ${req.params.shortName}`);
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

    apiRouter.route('/name/:name')
        .get(async function (req, res) {
            try {
                logger.info(`Getting organization by name: ${req.params.name}`);
                const org = await getOrgByFilter({name: new RegExp(req.params.name, 'i')});
                if (org) {
                    res.json(org);
                } else {
                    res.status(400).send('Organization not found');
                }
            } catch (error) {
                res.status(500).send(error);
            }
        });


    apiRouter.route('/org-path/:path')
        .get(async function (req, res) {
            try {
                logger.info(`Getting organization by org-path: ${req.params.path}`);
                const org = await getOrgByFilter({path: req.params.path.toUpperCase()});
                if (org) {
                    res.json(org);
                } else {
                    res.status(400).send('Organization not found');
                }
            } catch (error) {
                res.status(500).send(error);
            }
        });

    apiRouter.route('/subbranches/sac/:sac')
        .get(async function (req, res) {
            try {
                logger.info(`Getting subbranches by SAC: ${req.params.sac}`);
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

    apiRouter.route('/subbranches/short-name/:shortName')
        .get(async function (req, res) {
            try {
                logger.info(`Getting subbranches by short name: ${req.params.shortName}`);
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

    apiRouter.route('/subbranches/name/:name')
        .get(async function (req, res) {
            try {
                logger.info(`Getting subbranches by name: ${req.params.name}`);
                const orgs = await getOrgByFilter({name: new RegExp(req.params.name, 'i')});
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

    apiRouter.route('/descendants/sac/:sac')
        .get(async function (req, res) {
            try {
                logger.info(`Getting descendants by sac: ${req.params.sac}`);
                const org = await getOrgDescendantsBySac(req.params.sac.toUpperCase());
                if (org) {
                    res.json(org);
                } else {
                    res.status(400).send('Organization not found');
                }
            } catch (error) {
                res.status(500).send(error);
            }
        });

    apiRouter.route('/descendants/short-name/:shortName')
        .get(async function (req, res) {
            try {
                logger.info(`Getting descendants by short name: ${req.params.shortName}`);
                const orgs = await getOrgByFilter({shortName: req.params.shortName.toUpperCase()});
                if (orgs) {
                    const results = [];
                    if (orgs.length > 0) {
                        for ( const org of orgs) {
                            const sac = org['sac'];
                            const subOrgs = await getOrgDescendantsBySac(sac);
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

    apiRouter.route('/descendants/name/:name')
        .get(async function (req, res) {
            try {
                logger.info(`Getting descendants by name: ${req.params.name}`);
                const orgs = await getOrgByFilter({name: new RegExp(req.params.name, 'i')});
                if (orgs) {
                    const results = [];
                    if (orgs.length > 0) {
                        for ( const org of orgs) {
                            const sac = org['sac'];
                            const subOrgs = await getOrgDescendantsBySac(sac);
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