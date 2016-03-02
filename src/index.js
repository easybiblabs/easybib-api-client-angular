require('angular-local-storage');

module.exports = (function() {
  'use strict';

  angular.module('easybib-api-client', ['LocalStorageModule'])
    .service('EasyBibApiClient', require('./easybib-api-client'));
})();
