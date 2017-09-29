// in case we want to  mock the ned soap api
// process.env.NODE_ENV = 'test';

let chai = require('chai');
let chaiHttp = require('chai-http');
let app = require('../../app');
// let should = chai.should();

chai.use(chaiHttp);

describe('/POST ByNIHid', () => {
    it('it should get a person by NIH ID', (done) => {
        let nihId = {
            nihid: '2002124076'
        };
        chai.request(app)
            .post('/api/vds/user')
            .send(nihId)
            .end((err, res) => {
                res.should.have.status(200);
                res.body[0].should.have.property('dn');
                done();
            });
    });
});

describe('/POST ByNIHid with wrong (non-numeric) NIH ID input', () => {
    it('it should return status code 400 ', (done) => {
        let nihId = {
            nihid: '12345abc'
        };
        chai.request(app)
            .post('/api/vds/user')
            .send(nihId)
            .end((err, res) => {
                res.should.have.status(400);
                res.error.text.should.equal('nihid is not numeric.');
                done();
            });
    });
});

describe('/POST ByNIHid with missing nihid argument', () => {
    it('it should return status code 400 ', (done) => {
        let nihId = {
            not_nihid: '12345abc'
        };
        chai.request(app)
            .post('/api/vds/user')
            .send(nihId)
            .end((err, res) => {
                res.should.have.status(400);
                res.error.text.should.equal('nihid is not defined.');
                done();
            });
    });
});