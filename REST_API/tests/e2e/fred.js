/**
 * Environment variable TEST_API must be set to the API address to be tested
 *   there should be no trailing '/'
 *
 * Test data can be specified with following environment variables
 *  - OFFICER_ID
 *  - CUSTODIAN_ID
 *  - PAGE_SIZE
 *  - MIN_PROPERTY_COUNT
 *
 */

const request = require('request');
const { expect } = require('chai');
const { config } = require('../../constants');

describe('Testing Fredric APIs', function() {
    const address = process.env['TEST_API'];
    const userName = config.users[0].user;
    const password = config.users[0].password;
    const OK = 200;
    const TIME_OUT = 10 * 1000; // 10 seconds

    const defaultPageSize = 1000;
    const minPropertyCount = parseInt(process.env['MIN_PROPERTY_COUNT']) || 90000;
    const pageSize = parseInt(process.env['PAGE_SIZE']) || 50;
    const officerId = process.env['OFFICER_ID'] || '0011231141';
    const custodianId = process.env['CUSTODIAN_ID'] || '0014049524';

    it('Should be able to get properties (default page size)', function(done) {
        this.timeout(TIME_OUT);
        request(`${address}/api/fred/props/`,
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
                expect(results.length).to.at.most(defaultPageSize);
                done();
            });
    });

    it(`Should be able to get properties specify page size to be ${pageSize}`, function(done) {
        this.timeout(TIME_OUT);
        request(`${address}/api/fred/props/?pageSize=${pageSize}`,
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
                expect(results.length).to.at.most(pageSize);
                done();
            });
    });

    it('Should be able to get property total count', function(done) {
        this.timeout(TIME_OUT);
        request(`${address}/api/fred/props/count`,
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
                expect(results.count).to.above(minPropertyCount);
                done();
            });
    });

    it('Should be able to getting Fred properties for property officer', function(done) {
        this.timeout(TIME_OUT);
        request(`${address}/api/fred/props/officer/${ officerId }`,
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
                expect(results.length).to.above(1);
                for (const prop of results) {
                    expect(prop.PropertyOfficerNedId).to.equal(officerId);
                }
                done();
            });
    });

    it('Should be able to getting Fred properties for custodian', function(done) {
        this.timeout(TIME_OUT);
        request(`${address}/api/fred/props/custodian/${ custodianId }`,
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
                expect(results.length).to.above(1);
                for (const prop of results) {
                    expect(prop.CustodianNedId).to.equal(custodianId);
                }
                done();
            });
    });
});