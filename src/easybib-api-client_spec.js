/*global __dirname*/
require('angular');
require('angular-storage');
require('angular-mocks');
require('./index');

var fs = require('fs');

var chai = require('chai');
chai.should();

var sinonChai = require('sinon-chai');
chai.use(sinonChai);

var assert = require('assert');

// jscs:disable
var fixtures = {
  accessTokenResponse: JSON.parse(fs.readFileSync(__dirname + '/fixtures/access_token_response.json')),
  requestHeaders: {
    'Accept': 'application/vnd.com.easybib.data+json',
    'Authorization': 'Bearer bd7ba31865b69f58ea52a4298cb7ea1a826ddebd'
  },
  requestHeadersExt: {
    'Accept': 'application/vnd.com.easybib.data+json',
    'Authorization': 'Bearer bd7ba31865b69f58ea52a4298cb7ea1a826ddebd',
    'Content-Type': 'application/json;charset=utf-8'
  },
  citationResponse: fs.readFileSync(__dirname + '/fixtures/citation_response.json')
};
// jscs:enable

describe('EasyBib Api Client', function() {
  'use strict';

  var $httpBackend, easybibApiClient, $timeout, $rootScope;

  beforeEach(angular.mock.module('easybib-api-client'));
  beforeEach(angular.mock.module(function($provide) {
    $provide.factory('easyBibApiAccessUrl', function() {
      return function() {
        return 'http://noopurl.notld/access_token';
      };
    });
  }));

  beforeEach(inject(function($injector) {
    easybibApiClient = $injector.get('EasyBibApiClient');
    $timeout = $injector.get('$timeout');
    $httpBackend = $injector.get('$httpBackend');
    $rootScope = $injector.get('$rootScope');
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

  describe('get()', function() {
    it('should use the globalOptions', function() {
      localStorage.setItem('easybib-api-access-data',
        JSON.stringify(fixtures.accessTokenResponse));

      $httpBackend.expectGET('http://url-set-via-opts.example.com',
        fixtures.requestHeaders)
        .respond(200, {});

      easybibApiClient.globalHttpOptions = {url: 'http://url-set-via-opts.example.com'};

      easybibApiClient.get('http://noopurl.notld/citations');

      $httpBackend.flush();
    });
  });

  describe('post()', function() {
    it('should add access-token to request headers', function() {
      localStorage.setItem('easybib-api-access-data',
        JSON.stringify(fixtures.accessTokenResponse));

      $httpBackend.expectPOST('http://noopurl.notld/citations',
        JSON.stringify({data: 'nothing'}), fixtures.requestHeadersExt)
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
        JSON.stringify({data: 'nothing'}), fixtures.requestHeadersExt)
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
    it('should fetch access-token on 401 error and retry', function() {
      localStorage.removeItem('easybib-api-access-data');
      easybibApiClient.get('http://noopurl.notld/citations');

      $httpBackend.expectGET('http://noopurl.notld/access_token')
        .respond(200, fixtures.accessTokenResponse);

      $httpBackend.expectGET('http://noopurl.notld/citations',
        fixtures.requestHeaders).respond(401, 'Bad Request');

      // important: this is called implictly by .flush
      $rootScope.$digest();
      $httpBackend.flush(2, false);

      $httpBackend.expectGET('http://noopurl.notld/access_token')
        .respond(200, fixtures.accessTokenResponse);

      $httpBackend.expectGET('http://noopurl.notld/citations',
        fixtures.requestHeaders).respond(200, fixtures.citationResponse);

      $timeout.flush();

      $httpBackend.flush(2, false);
    });

    it('should fetch access-token on 400 error and retry', function() {
      localStorage.removeItem('easybib-api-access-data');
      easybibApiClient.get('http://noopurl.notld/citations');

      $httpBackend.expectGET('http://noopurl.notld/access_token')
        .respond(200, fixtures.accessTokenResponse);

      $httpBackend.expectGET('http://noopurl.notld/citations',
        fixtures.requestHeaders).respond(400, 'Bad Request');

      // important: this is called implictly by .flush
      $rootScope.$digest();
      $httpBackend.flush(2, false);

      $httpBackend.expectGET('http://noopurl.notld/access_token')
        .respond(200, fixtures.accessTokenResponse);

      $httpBackend.expectGET('http://noopurl.notld/citations',
        fixtures.requestHeaders).respond(200, fixtures.citationResponse);

      $timeout.flush();

      $httpBackend.flush(2, false);
    });

    it('retryCount is used correctly', function() {
      localStorage.removeItem('easybib-api-access-data');
      easybibApiClient.retryCount = 2;
      easybibApiClient.get('http://noopurl.notld/citations');

      $httpBackend.expectGET('http://noopurl.notld/access_token')
        .respond(200, fixtures.accessTokenResponse);

      $httpBackend.expectGET('http://noopurl.notld/citations',
        fixtures.requestHeaders).respond(401, 'Bad Request');

      // important: this is called implictly by .flush
      $rootScope.$digest();
      $httpBackend.flush(2, false);

      $httpBackend.expectGET('http://noopurl.notld/access_token')
        .respond(200, fixtures.accessTokenResponse);

      // NOTE: phantom reloads page if 2 errors of the same kind a returned
      $httpBackend.expectGET('http://noopurl.notld/citations',
        fixtures.requestHeaders).respond(400, fixtures.citationResponse);

      $timeout.flush(1000);
      $httpBackend.flush(2, false);

      $httpBackend.expectGET('http://noopurl.notld/access_token')
        .respond(200, fixtures.accessTokenResponse);

      // NOTE: phantom reloads page if 2 errors of the same kind a returned
      $httpBackend.expectGET('http://noopurl.notld/citations',
        fixtures.requestHeaders).respond(400, fixtures.citationResponse);

      $timeout.flush(1000);
      $httpBackend.flush(2, false);

    });

    it('should not fetch access-token on 404 error', function() {
      localStorage.removeItem('easybib-api-access-data');
      easybibApiClient.get('http://noopurl.notld/citations');

      $httpBackend.expectGET('http://noopurl.notld/access_token')
        .respond(200, fixtures.accessTokenResponse);

      $httpBackend.expectGET('http://noopurl.notld/citations',
        fixtures.requestHeaders).respond(404, 'Bad Request');

      // important: this is called implictly by .flush
      $rootScope.$digest();
      $httpBackend.flush(2, false);
    });

    it('should reject if retries also fail', function(done) {

      localStorage.removeItem('easybib-api-access-data');
      easybibApiClient.get('http://noopurl.notld/citations')
        .then(function() {
          // NOTE: in case that the underlying implementation
          // is changing something unwanted, so this
          // error makes it obvious whats goin wrong
          assert.ok(0, 'request was not rejected');
          done();
        }, function() {
          assert.ok(1, 'request should fail and get rejected');
          done();
        });

      $httpBackend.expectGET('http://noopurl.notld/access_token')
        .respond(200, fixtures.accessTokenResponse);

      $httpBackend.expectGET('http://noopurl.notld/citations',
        fixtures.requestHeaders).respond(400, 'Bad Request');

      // important: this is called implictly by .flush
      $rootScope.$digest();
      $httpBackend.flush(2, false);

      $httpBackend.expectGET('http://noopurl.notld/access_token')
        .respond(200, fixtures.accessTokenResponse);

      $httpBackend.expectGET('http://noopurl.notld/citations',
        fixtures.requestHeaders).respond(401, 'Bad Request');

      $timeout.flush();

      $httpBackend.flush(2, false);

    });
  });
});
