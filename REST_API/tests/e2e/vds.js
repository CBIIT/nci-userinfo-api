/**
 * Environment variable TEST_API must be set to the API address to be tested
 *   there should be no trailing '/'
 *
 * Test data can be specified with following environment variables
 *   - IC
 *   - NIHID
 *   - MIN_USER_COUNT
 *
 */

const request = require('request');
const { expect } = require('chai');
const { config } = require('../../constants');

describe('Testing VDS APIs', function() {
    const address = process.env['TEST_API'];
    const userName = config.users[0].user;
    const password = config.users[0].password;
    const OK = 200;
    const TIME_OUT = 10 * 1000; // 10 seconds

    const minUserCount = parseInt(process.env['MIN_USER_COUNT']) || 9000;
    const ic = process.env['IC'] || 'NCI';
    const nihId = process.env['NIHID'] || '2002585450';

    it(`Should be able to get user by NIH ID: ${nihId}`, function(done) {
        this.timeout(TIME_OUT); // 10 seconds
        request(`${address}/api/vds/users/user/${nihId}`,
            {
                'auth': {
                    'username': userName,
                    'password': password
                },
                'headers': {
                    'Accept': 'application/json'
                }
            },
            function (error, response, body) {
                expect(error).to.be.a('null');
                expect(response).not.to.be.a('null');
                expect(response.statusCode).to.equal(OK);
                const results = JSON.parse(body);
                expect(results).not.to.be.a('null');
                expect(results.length).to.equal(1);
                expect(results[0].UNIQUEIDENTIFIER).to.equal(nihId);
                done();
            });
    });

    it(`Should be able to get users by IC: ${ic}`, function(done) {
        this.timeout(TIME_OUT); // 10 seconds
        request(`${address}/api/vds/users/ic/${ic}`,
            {
                'auth': {
                    'username': userName,
                    'password': password
                },
                'headers': {
                    'Accept': 'application/json'
                }
            },
            function (error, response, body) {
                expect(error).to.be.a('null');
                expect(response).not.to.be.a('null');
                expect(response.statusCode).to.equal(OK);
                const results = JSON.parse(body);
                expect(results).not.to.be.a('null');
                expect(results.length).to.above(minUserCount);
                for (const user of results) {
                    expect(user.NIHORGACRONYM).to.equal(ic);
                }
                done();
            });
    });
});