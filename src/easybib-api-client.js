var angular = require('angular-bsfy');

module.exports = function($q, $http, store, easyBibApiAccessUrl) {
  'use strict';

  var self = this, utils;

  self.store = store;
  self.$q = $q;
  self.$http = $http;

  // private
  utils = {
    url: {
      access: function() {
        return easyBibApiAccessUrl();
      }
    },
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

      $http.get(utils.url.access())
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
      var cont;
      // remove saved accessToken to fetch a new one
      utils.deleteAccessToken();

      times = (typeof times === 'undefined') ? 1 : times;
      waitMs = waitMs || 1000;

      cont = function() {
        utils.getAccessToken()
          .then(function(accessData) {
            // jscs:disable
            reqOpts.headers.Authorization =
              'Bearer ' + accessData.access_token;
            // jscs:enable

            self.request(reqOpts, times - 1)
              .then(function(data) {
                df.resolve(data);
              });
          });
      };

      if (times > 0) {
        cont();
        setTimeout(cont, waitMs);
        return;
      }
      df.reject(error);
    }
  };

  // public api
  self.get = function(url) {
    var deferred = self.$q.defer();
    utils.getAccessToken()
      .then(function(accessData) {
        // jscs:disable
        var req = utils.createRequest({url: url}, accessData.access_token);
        // jscs:enable
        self.request(req).then(function(response) {
          deferred.resolve(response);
        });
      });
    return deferred.promise;
  };

  self.post = function(url, data) {
    var deferred = self.$q.defer();
    utils.getAccessToken()
      .then(function(accessData) {
        // jscs:disable
        var req = utils.createRequest({
          method: 'POST',
          data: {'data': data},
          url: url
        }, accessData.access_token);
        // jscs:enable

        self.request(req).then(function(response) {
          deferred.resolve(response);
        });
      });
    return deferred.promise;
  };

  self.put = function(url, data) {
    var deferred = self.$q.defer();
    utils.getAccessToken()
      .then(function(accessData) {
        // jscs:disable
        var req = utils.createRequest({
          method: 'PUT',
          data: {'data': data},
          url: url
        }, accessData.access_token);
        // jscs:enable

        self.request(req).then(function(response) {
          deferred.resolve(response);
        });
      });
    return deferred.promise;
  };

    // better remove here
  self.delete = function(url) {
    var deferred = self.$q.defer();
    utils.getAccessToken()
      .then(function(accessData) {
        // jscs:disable
        var req = utils.createRequest({
          method: 'DELETE',
          url: url
        }, accessData.access_token);
        // jscs:enable

        self.request(req).then(function(response) {
          deferred.resolve(response);
        });
      });
    return deferred.promise;
  };

  self.request = function(opts, retryCount) {
    var deferred = self.$q.defer();
    retryCount = (typeof retryCount === 'undefined') ? 1 : retryCount;

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
