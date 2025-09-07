const request = require('supertest');
const { app } = require('../server');

describe('server', () => {
  it('serves index page', (done) => {
    request(app)
      .get('/')
      .expect(200, done);
  });
});
