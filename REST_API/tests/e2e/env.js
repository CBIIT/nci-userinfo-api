/**
 * Environment variable TEST_API must be set
 */

const { expect } = require('chai');
const request = require('request');

describe('Testing environment settings', function() {
    it('Env Var TEST_API should be set', function() {
        expect(process.env['TEST_API']).to.be.a('string');
    });
});
