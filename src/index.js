var angular = require('angular-bsfy');

require('angular-storage');

angular.module('easybib-api-client', ['angular-storage'])
  .factory(require('./easybib-api-client'));
