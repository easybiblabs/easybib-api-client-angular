var angular = require('angular-bsfy');

module.exports = function($q, $http, store, $timeout, easyBibApiAccessUrl) {
  'use strict';

  var self = this, utils;

  self.store = store;
  self.$q = $q;
  self.$http = $http;

  // private
  utils = {
    deleteAccessToken: function() {
      self.store.remove('easybib-api-access-data');
    },
    getAccessToken: function() {
      var deferred, accessData;

      deferred = $q.defer();
      accessData = store.get('easybib-api-access-data');

      if (accessData !== null) {
        deferred.resolve(accessData);
        return deferred.promise;
      }

      $http.get(easyBibApiAccessUrl())
        .then(function(response) {
          self.store.set('easybib-api-access-data', response.data);
          deferred.resolve(response.data);
        })
        .catch(function(error) {
          // accessToken couldn't be fetched
          // so need to add a generic error handler here
          deferred.reject(error);
        });

      return deferred.promise;
    },
    createRequest: function(initObj, token) {
      var requestObj;

      requestObj = {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.com.easybib.data+json',
          'Authorization': 'Bearer ' + token
        }
      };

      angular.extend(requestObj, initObj);
      return requestObj;
    },
    retry: function(reqOpts, error, df, times, waitMs) {
      var process;
      // remove saved accessToken to fetch a new one
      utils.deleteAccessToken();

      times = (typeof times === 'undefined') ? 1 : times;
      waitMs = waitMs || 1000;

      process = function() {
        utils.getAccessToken()
          .then(function(accessData) {
            // jscs:disable
            reqOpts.headers.Authorization =
              'Bearer ' + accessData.access_token;
            // jscs:enable

            self.request(reqOpts, times - 1)
              .then(function(data) {
                df.resolve(data);
              }, function(error) {
                df.reject(error);
              });
          });
      };

      if (times > 0) {
        $timeout(function() {
          process();
        }, waitMs);
        return;
      }
      df.reject(error);
    }
  };

  // public api
  self.retryCount = 1;
  self.get = function(url) {
    return utils.getAccessToken()
      .then(function(accessData) {
        // jscs:disable
        var req = utils.createRequest({url: url}, accessData.access_token);
        // jscs:enable
        return self.request(req);

      });
  };

  self.post = function(url, data) {
    return utils.getAccessToken()
      .then(function(accessData) {
        // jscs:disable
        var req = utils.createRequest({
          method: 'POST',
          data: {'data': data},
          url: url
        }, accessData.access_token);
        // jscs:enable

        return self.request(req);
      });
  };

  self.put = function(url, data) {
    return utils.getAccessToken()
      .then(function(accessData) {
        // jscs:disable
        var req = utils.createRequest({
          method: 'PUT',
          data: {'data': data},
          url: url
        }, accessData.access_token);
        // jscs:enable

        return self.request(req);
      });
  };

    // better remove here
  self.delete = function(url) {
    return utils.getAccessToken()
      .then(function(accessData) {
        // jscs:disable
        var req = utils.createRequest({
          method: 'DELETE',
          url: url
        }, accessData.access_token);
        // jscs:enable

        return self.request(req);
      });
  };

  self.request = function(opts, retryCount) {
    var deferred = self.$q.defer();
    retryCount = (typeof retryCount === 'undefined') ? self.retryCount : retryCount;

    self.$http(opts)
      .then(function(data) {
        deferred.resolve(data);
      })
      .catch(function(error) {
        if (error.status === 401 || error.status === 400) {
          return utils.retry(opts, error, deferred, retryCount);
        }
        deferred.reject(error);
      });
    return deferred.promise;
  };

};
