require('angular-bsfy');
require('angular-mocks');

var easybibApiClient = require('./easybib-api-client');

var chai = require('chai');
chai.should();

var sinonChai = require('sinon-chai');
chai.use(sinonChai);

describe('EasyBib Api Client', function() {
  'use strict';

  it('should be a function', function() {
    expect(easybibApiClient).to.be.a('function');
  });
});
