module.exports = (function() {
  'use strict';

  angular.module('easybib-api-client', ['angular-storage'])
    .service('EasyBibApiClient', require('./easybib-api-client'));
})();
