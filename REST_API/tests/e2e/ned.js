/**
 * Environment variable TEST_API must be set to the API address to be tested
 *   there should be no trailing '/'
 *
 * Test data can be specified with following environment variables
 *  - FIRST_NAME
 *  - LAST_NAME
 *  - NIHID
 *  - AD_ACCOUNT
 *  - MIN_USER_COUNT
 *  - IC
 *  - FROM_DATE
 *  - TO_DATE
 *  - MIN_CHANGES_COUNT
 *
 */

const request = require('request');
const { expect } = require('chai');
const { config } = require('../../constants');

describe('Testing NED APIs', function() {
    const address = process.env['TEST_API'];
    const userName = config.users[0].user;
    const password = config.users[0].password;
    const OK = 200;
    const TIME_OUT = 10 * 1000; // 10 seconds

    const MIN_USER_COUNT = process.env['MIN_USER_COUNT'] || 9000;
    const firstName = process.env['FIRST_NAME'] || 'Ming';
    const lastName = process.env['LAST_NAME'] || 'Ying';
    const nihId = process.env['NIHID'] || '2002585450';
    const adAccount = process.env['AD_ACCOUNT'] || 'yingm3'
    const ic = process.env['IC'] || 'NCI'
    const fromDate = process.env['FROM_DATE'] || '2019-03-05'
    const toDate = process.env['TO_DATE'] || '2019-03-06'
    const MIN_CHANGES_COUNT = process.env['MIN_CHANGES_COUNT'] || 400

    it(`Should be able to get NED user by name: ${firstName + lastName}`, function(done) {
        this.timeout(TIME_OUT);
        request(`${address}/api/ned/ByName/`,
            {
                'auth': {
                    'username': userName,
                    'password': password
                },
                'headers': {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                'method': 'POST',
                'json': {
                    'FirstName': firstName,
                    'LastName': lastName
                }
            },
            function (error, response, body) {
                expect(error).to.be.a('null');
                expect(response).not.to.be.a('null');
                expect(response.statusCode).to.equal(OK);
                expect(body).to.be.an('object');
                const user = body.NEDPersonBase;
                expect(user).not.to.be.a('null');
                expect(user.Names.Name.GivenName).to.equal(firstName);
                expect(user.Names.Name.MixCaseSurname).to.equal(lastName);
                done();
            });
    });

    it(`Should be able to get NED user by NIH ID: ${nihId}`, function(done) {
        this.timeout(TIME_OUT);
        request(`${address}/api/ned/ByNIHid/`,
            {
                'auth': {
                    'username': userName,
                    'password': password
                },
                'headers': {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                'method': 'POST',
                'json': {
                    'nihid': nihId
                }
            },
            function (error, response, body) {
                expect(error).to.be.a('null');
                expect(response).not.to.be.a('null');
                expect(response.statusCode).to.equal(OK);
                expect(body).to.be.an('object');
                const user = body.NEDPerson;
                expect(user).not.to.be.a('null');
                expect(user.Uniqueidentifier).to.equal(nihId);
                done();
            });
    });

    it(`Should be able to get NED user by AD Account: ${adAccount}`, function(done) {
        this.timeout(TIME_OUT);
        request(`${address}/api/ned/ByIDAccount/`,
            {
                'auth': {
                    'username': userName,
                    'password': password
                },
                'headers': {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                'method': 'POST',
                'json': {
                    'Identifier': adAccount
                }
            },
            function (error, response, body) {
                expect(error).to.be.a('null');
                expect(response).not.to.be.a('null');
                expect(response.statusCode).to.equal(OK);
                expect(body).to.be.an('object');
                const user = body.NEDPerson;
                expect(user).not.to.be.a('null');
                expect(user.NIHSSO.SSOUsername).to.equal(adAccount);
                done();
            });
    });

    it(`Should be able to get NED changes IC: ${ic}`, function(done) {
        this.timeout(TIME_OUT);
        request(`${address}/api/ned/ChangesByIc/`,
            {
                'auth': {
                    'username': userName,
                    'password': password
                },
                'headers': {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                'method': 'POST',
                'json': {
                    'IcoreSite': ic,
                    'From_Date': fromDate,
                    'To_Date': toDate
                }
            },
            function (error, response, body) {
                expect(error).to.be.a('null');
                expect(response).not.to.be.a('null');
                expect(response.statusCode).to.equal(OK);
                expect(body).to.be.an('object');
                expect(body.NUMBER_OF_RECORDS).to.above(MIN_CHANGES_COUNT);
                const changes = body.NED_CHANGES_RECORD;
                expect(changes).not.to.be.a('null');
                expect(changes.length).to.equal(parseInt(body.NUMBER_OF_RECORDS));
                for (const user of changes) {
                    expect(user.NIHORGACRONYM).to.equal(ic);
                }
                done();
            });
    });

    it(`Should be able to get NED users by IC: ${ic}`, function(done) {
        this.timeout(TIME_OUT * 2);
        request(`${address}/api/ned/ByIc/`,
            {
                'auth': {
                    'username': userName,
                    'password': password
                },
                'headers': {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                'method': 'POST',
                'json': {
                    'IcoreSite': ic
                }
            },
            function (error, response, body) {
                expect(error).to.be.a('null');
                expect(response).not.to.be.a('null');
                expect(response.statusCode).to.equal(OK);
                expect(body).to.be.an('object');
                expect(body.NumberOfRecords).to.above(MIN_USER_COUNT);
                const users = body.NEDPersonBase;
                expect(users).not.to.be.a('null');
                expect(users.length).to.equal(parseInt(body.NumberOfRecords));
                for (const user of users) {
                    expect(user.NIHOrgAcronym).to.equal(ic);
                }
                done();
            });
    });

});