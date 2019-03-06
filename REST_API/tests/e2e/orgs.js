/**
 * Environment variable TEST_API must be set to the API address to be tested
 *   there should be no trailing '/'
 *
 * Test data can be specified with following environment variables
 *   - SAC
 *   - SHORT_NAME
 *   - ORG_NAME
 *   - ORG_PATH
 *
 */

const request = require('request');
const { expect } = require('chai');

describe('Testing organization APIs', function() {
    const address = process.env['TEST_API'];
    const OK = 200;
    const TIME_OUT = 10 * 1000; // 10 seconds

    const sac = process.env['SAC'] || 'HNC1D';
    const shortNameLower = process.env['SHORT_NAME'] || 'cbiit';
    const shortNameUpper = shortNameLower.toUpperCase();
    const name = process.env['ORG_NAME'] || 'CENTER FOR BIOMEDICAL INFORMATICS & INFORMATION TECHNOLOGY';
    const path = process.env['ORG_PATH'] || 'NCI OD';

    /* organization */
    it(`Should be able to get organization by SAC: ${sac}`, function(done) {
        this.timeout(TIME_OUT); // 10 seconds
        request(`${address}/api/org/sac/${sac}`, function (error, response, body) {
            expect(error).to.be.a('null');
            expect(response).not.to.be.a('null');
            expect(response.statusCode).to.equal(OK);
            const results = JSON.parse(body);
            expect(results).not.to.be.a('null');
            expect(results.length).to.equal(1);
            expect(results[0].sac).to.equal(sac);
            done();
        });
    });

    it(`Should be able to get organization by shortName: ${shortNameLower}`, function(done) {
        this.timeout(TIME_OUT); // 10 seconds
        request(`${address}/api/org/short-name/${shortNameLower}`, function (error, response, body) {
            expect(error).to.be.a('null');
            expect(response).not.to.be.a('null');
            expect(response.statusCode).to.equal(OK);
            const results = JSON.parse(body);
            expect(results).not.to.be.a('null');
            expect(results.length).to.equal(1);
            expect(results[0].shortName).to.equal(shortNameUpper);
            done();
        });
    });

    it(`Should be able to get organization by shortName: ${shortNameUpper}`, function(done) {
        this.timeout(TIME_OUT); // 10 seconds
        request(`${address}/api/org/short-name/${shortNameUpper}`, function (error, response, body) {
            expect(error).to.be.a('null');
            expect(response).not.to.be.a('null');
            expect(response.statusCode).to.equal(OK);
            const results = JSON.parse(body);
            expect(results).not.to.be.a('null');
            expect(results.length).to.equal(1);
            expect(results[0].shortName).to.equal(shortNameUpper);
            done();
        });
    });

    it(`Should be able to get organization by org path: ${path}`, function(done) {
        this.timeout(TIME_OUT); // 10 seconds
        request(`${address}/api/org/org-path/${path}`, function (error, response, body) {
            expect(error).to.be.a('null');
            expect(response).not.to.be.a('null');
            expect(response.statusCode).to.equal(OK);
            const results = JSON.parse(body);
            expect(results).not.to.be.a('null');
            expect(results.length).to.equal(1);
            expect(results[0].path).to.equal(path);
            done();
        });
    });

    /* Subbranches */

    it(`Should be able to get subbranches by sac: ${sac}`, function(done) {
        this.timeout(TIME_OUT); // 10 seconds
        request(`${address}/api/org/subbranches/sac/${sac}`, function (error, response, body) {
            expect(error).to.be.a('null');
            expect(response).not.to.be.a('null');
            expect(response.statusCode).to.equal(OK);
            const results = JSON.parse(body);
            expect(results).not.to.be.a('null');
            expect(results.length).to.above(1);
            for (const org of results) {
                expect(org.parentShortName).to.equal(shortNameUpper);
            }
            done();
        });
    });

    it(`Should be able to get subbranches by shortName: ${shortNameLower}`, function(done) {
        this.timeout(TIME_OUT); // 10 seconds
        request(`${address}/api/org/subbranches/short-name/${shortNameLower}`, function (error, response, body) {
            expect(error).to.be.a('null');
            expect(response).not.to.be.a('null');
            expect(response.statusCode).to.equal(OK);
            const results = JSON.parse(body);
            expect(results).not.to.be.a('null');
            expect(results.length).to.at.least(1);
            expect(results[0].length).to.above(1);
            for (const parent of results) {
                for (const org of parent) {
                    expect(org.parentShortName).to.equal(shortNameUpper);
                }
            }
            done();
        });
    });

    it(`Should be able to get subbranches by shortName: ${shortNameUpper}`, function(done) {
        this.timeout(TIME_OUT); // 10 seconds
        request(`${address}/api/org/subbranches/short-name/${shortNameUpper}`, function (error, response, body) {
            expect(error).to.be.a('null');
            expect(response).not.to.be.a('null');
            expect(response.statusCode).to.equal(OK);
            const results = JSON.parse(body);
            expect(results).not.to.be.a('null');
            expect(results.length).to.at.least(1);
            expect(results[0].length).to.above(1);
            for (const parent of results) {
                for (const org of parent) {
                    expect(org.parentShortName).to.equal(shortNameUpper);
                }
            }
            done();
        });
    });

    it(`Should be able to get subbranches by Name: ${name}`, function(done) {
        this.timeout(TIME_OUT); // 10 seconds
        request(`${address}/api/org/subbranches/name/${name}`, function (error, response, body) {
            expect(error).to.be.a('null');
            expect(response).not.to.be.a('null');
            expect(response.statusCode).to.equal(OK);
            const results = JSON.parse(body);
            expect(results).not.to.be.a('null');
            expect(results.length).to.at.least(1);
            expect(results[0].length).to.above(1);
            for (const parent of results) {
                for (const org of parent) {
                    expect(org.parentShortName).to.equal(shortNameUpper);
                }
            }
            done();
        });
    });

    /* Descendants */

    it(`Should be able to get descendants by sac: ${sac}`, function(done) {
        this.timeout(TIME_OUT); // 10 seconds
        request(`${address}/api/org/descendants/sac/${sac}`, function (error, response, body) {
            expect(error).to.be.a('null');
            expect(response).not.to.be.a('null');
            expect(response.statusCode).to.equal(OK);
            const results = JSON.parse(body);
            expect(results).not.to.be.a('null');
            expect(results.length).to.above(1);
            for (const org of results) {
                expect(org.parentShortName).to.equal(shortNameUpper);
            }
            done();
        });
    });

    it(`Should be able to get descendants by shortName: ${shortNameLower}`, function(done) {
        this.timeout(TIME_OUT); // 10 seconds
        request(`${address}/api/org/descendants/short-name/${shortNameLower}`, function (error, response, body) {
            expect(error).to.be.a('null');
            expect(response).not.to.be.a('null');
            expect(response.statusCode).to.equal(OK);
            const results = JSON.parse(body);
            expect(results).not.to.be.a('null');
            expect(results.length).to.at.least(1);
            expect(results[0].length).to.above(1);
            for (const parent of results) {
                for (const org of parent) {
                    expect(org.parentShortName).to.equal(shortNameUpper);
                }
            }
            done();
        });
    });

    it(`Should be able to get descendants by shortName: ${shortNameUpper}`, function(done) {
        this.timeout(TIME_OUT); // 10 seconds
        request(`${address}/api/org/descendants/short-name/${shortNameUpper}`, function (error, response, body) {
            expect(error).to.be.a('null');
            expect(response).not.to.be.a('null');
            expect(response.statusCode).to.equal(OK);
            const results = JSON.parse(body);
            expect(results).not.to.be.a('null');
            expect(results.length).to.at.least(1);
            expect(results[0].length).to.above(1);
            for (const parent of results) {
                for (const org of parent) {
                    expect(org.parentShortName).to.equal(shortNameUpper);
                }
            }
            done();
        });
    });

    it(`Should be able to get descendants by Name: ${name}`, function(done) {
        this.timeout(TIME_OUT); // 10 seconds
        request(`${address}/api/org/descendants/name/${name}`, function (error, response, body) {
            expect(error).to.be.a('null');
            expect(response).not.to.be.a('null');
            expect(response.statusCode).to.equal(OK);
            const results = JSON.parse(body);
            expect(results).not.to.be.a('null');
            expect(results.length).to.at.least(1);
            expect(results[0].length).to.above(1);
            for (const parent of results) {
                for (const org of parent) {
                    expect(org.parentShortName).to.equal(shortNameUpper);
                }
            }
            done();
        });
    });

});