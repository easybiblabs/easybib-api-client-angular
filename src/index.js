var angular = require('angular-bsfy');

require('angular-storage');

angular.module('easybib-api-client', ['angular-storage'])
  .service('EasyBibApiClient', require('./easybib-api-client'));
