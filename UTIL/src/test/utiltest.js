'use strict';
// in case we want to  mock the ned soap api
// process.env.NODE_ENV = 'test';

let chai = require('chai');
let chaiHttp = require('chai-http');
// let app = require('../../app');
// let should = chai.should();

chai.use(chaiHttp);