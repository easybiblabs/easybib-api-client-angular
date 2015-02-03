/*global __dirname*/
var angular = require('angular-bsfy');
require('angular-mocks');
require('./index');

var fs = require('fs');

var chai = require('chai');
chai.should();

var sinonChai = require('sinon-chai');
chai.use(sinonChai);

// jscs:disable
var fixtures = {
  accessTokenResponse: JSON.parse(fs.readFileSync(__dirname + '/fixtures/access_token_response.json')),
  requestHeaders: {
    'Accept': 'application/vnd.com.easybib.data+json',
    'Authorization': 'Bearer bd7ba31865b69f58ea52a4298cb7ea1a826ddebd'
  },
  requestHeadersAccept: {
    'Accept': 'application/vnd.com.easybib.data+json',
    'Authorization': 'Bearer bd7ba31865b69f58ea52a4298cb7ea1a826ddebd',
    'Content-Type': 'application/json;charset=utf-8'
  },
  citationResponse: fs.readFileSync(__dirname + '/fixtures/citation_response.json')
};
// jscs:enable

describe('EasyBib Api Client', function() {
  'use strict';

  var $httpBackend, easybibApiClient;

  beforeEach(angular.mock.module('easybib-api-client'));
  beforeEach(angular.mock.module(function($provide) {
    $provide.factory('easyBibApiAccessUrl', function() {
      return function() {
        return 'http://noopurl.notld/access_token';
      };
    });
  }));

  beforeEach(inject(function($injector, _EasyBibApiClient_) {
    easybibApiClient = _EasyBibApiClient_;
    $httpBackend = $injector.get('$httpBackend');
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('get()', function() {
    it('should add access-token to request headers', function() {
      localStorage.setItem('easybib-api-access-data',
        JSON.stringify(fixtures.accessTokenResponse));

      $httpBackend.expectGET('http://noopurl.notld/citations',
        fixtures.requestHeaders)
      .respond(200, {});

      easybibApiClient.get('http://noopurl.notld/citations');

      $httpBackend.flush();
    });
  });

  describe('post()', function() {
    it('should add access-token to request headers', function() {
      localStorage.setItem('easybib-api-access-data',
        JSON.stringify(fixtures.accessTokenResponse));

      $httpBackend.expectPOST('http://noopurl.notld/citations',
        JSON.stringify({ data: 'nothing'}), fixtures.requestHeadersAccept)
      .respond(200, {});

      easybibApiClient.post('http://noopurl.notld/citations', 'nothing');

      $httpBackend.flush();
    });
  });

  describe('put()', function() {
    it('should add access-token to request headers', function() {
      localStorage.setItem('easybib-api-access-data',
        JSON.stringify(fixtures.accessTokenResponse));

      $httpBackend.expectPUT('http://noopurl.notld/citations',
        JSON.stringify({ data: 'nothing'}), fixtures.requestHeadersAccept)
      .respond(200, {});

      easybibApiClient.put('http://noopurl.notld/citations', 'nothing');

      $httpBackend.flush();
    });
  });

  describe('delete()', function() {
    it('should add access-token to request headers', function() {
      localStorage.setItem('easybib-api-access-data',
        JSON.stringify(fixtures.accessTokenResponse));

      $httpBackend.expectDELETE('http://noopurl.notld/citations',
        fixtures.requestHeaders)
      .respond(200, {});

      easybibApiClient.delete('http://noopurl.notld/citations', 'nothing');

      $httpBackend.flush();
    });
  });

  describe('request()', function() {
    it('should fetch access-token on error and retry', function(done) {
      var self = this;
      self.done = done;
      localStorage.removeItem('easybib-api-access-data');

      $httpBackend.expectGET('http://noopurl.notld/access_token')
        .respond(200, fixtures.accessTokenResponse);
      $httpBackend.expectGET('http://noopurl.notld/citations',
        fixtures.requestHeaders).respond(401, 'Bad Request');

      $httpBackend.expectGET('http://noopurl.notld/access_token')
        .respond(200, fixtures.accessTokenResponse);

      $httpBackend.expectGET('http://noopurl.notld/citations',
        fixtures.requestHeaders).respond(200, fixtures.citationResponse);

      easybibApiClient.get('http://noopurl.notld/citations')
      .then(function() {
        self.done();
      })
      .catch(function() {
        done();
      });

      $httpBackend.flush();
    });
  });
});
