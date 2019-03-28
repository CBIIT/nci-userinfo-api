/**
 * Environment variable TEST_API must be set to the API address to be tested
 *   there should be no trailing '/'
 *
 * Test data can be specified with following environment variables
 *   - MIN_PROPERTY_COUNT
 */

const request = require('request');
const { expect } = require('chai');
const { config } = require('../../constants');

describe('Testing nVision APIs', function() {
    const address = process.env['TEST_API'];
    const userName = config.users[0].user;
    const password = config.users[0].password;
    const OK = 200;
    const TIME_OUT = (process.env['TIME_OUT'] || 10) * 1000; // default to 10 seconds

    const defaultPageSize = 1000;
    const minPropertyCount = parseInt(process.env['MIN_PROPERTY_COUNT']) || 30000;
    const pageSize = parseInt(process.env['PAGE_SIZE']) || 50;
    const nihId = process.env['NIHID'] || '2002585450';

    it('Should be able to get property count', function(done) {
        this.timeout(TIME_OUT);
        request(`${address}/api/nv/props/count`,
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
                expect(error).to.be.null
                expect(response).to.be.an('object');
                expect(response.statusCode).to.equal(OK);
                const results = JSON.parse(body);
                expect(results).to.be.an('object');
                expect(results.count).to.above(minPropertyCount);
                done();
            });
    });

    it('Should be able to get first page of properties (default page size)', function(done) {
        this.timeout(TIME_OUT);
        request(`${address}/api/nv/props/`,
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
                expect(error).to.be.null;
                expect(response).to.be.an('object');
                expect(response.statusCode).to.equal(OK);
                const results = JSON.parse(body);
                expect(results).not.to.be.an('object');
                expect(results.length).to.at.most(defaultPageSize);
                done();
            });
    });

    it(`Should be able to get first page of properties specify page size to be ${pageSize}`, function(done) {
        this.timeout(TIME_OUT);
        request(`${address}/api/nv/props/?pageSize=${pageSize}`,
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
                expect(error).to.be.null;
                expect(response).to.be.an('object');
                expect(response.statusCode).to.equal(OK);
                const results = JSON.parse(body);
                expect(results).to.be.an('array');
                expect(results.length).to.at.most(pageSize);
                done();
            });
    });

    it(`Should be able to get properties of user id: ${nihId}`, function(done) {
        this.timeout(TIME_OUT);
        request(`${address}/api/nv/props/user/${nihId}`,
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
                expect(error).to.be.null;
                expect(response).to.be.an('object');
                expect(response.statusCode).to.equal(OK);
                const results = JSON.parse(body);
                expect(results).to.be.an('array');
                expect(results.length).to.at.least(1);
                for (const prop of results) {
                    expect(prop.CURR_NED_ID).to.equal(nihId);
                }
                done();
            });
    });

    it('Should be able to get orphaned properties', function(done) {
        this.timeout(TIME_OUT);
        request(`${address}/api/nv/props/orphaned`,
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
                expect(error).to.be.null;
                expect(response).to.be.an('object');
                expect(response.statusCode).to.equal(OK);
                const results = JSON.parse(body);
                expect(results).to.be.an('array');
                for (const res of results) {
                    expect(res).to.be.a('string');
                    expect(parseInt(res)).to.be.a('number');
                }
                done();
            });
    });
});