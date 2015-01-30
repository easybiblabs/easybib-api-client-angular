var angular = require('angular-bsfy');

module.exports = (function() {
  'use strict';
  var EasyBibApiClient = function(UserProfile, $q, $http, store, easyBibApiAccessUrl) {
    this.store = store;
    this.$q = $q;
    this.$http = $http;

    this.url = {};

    this.url = {
      access: function() {
        return easyBibApiAccessUrl();
      }
    };
  };

  EasyBibApiClient.prototype = {
    getAccessToken: function() {
      var deferred, accessData, self = this;

      deferred = self.$q.defer();
      accessData = self.store.get('easybib-api-access-data');

      if (accessData !== null) {
        deferred.resolve(accessData);
        return deferred.promise;
      }

      this.$http.get(this.url.access())
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
    get: function(url) {
      var self = this, deferred = self.$q.defer();
      self.getAccessToken()
        .then(function(accessData) {
          // jscs:disable
          var req = self.createRequest({url: url}, accessData.access_token);
          // jscs:enable
          self.request(req).then(function(response) {
            deferred.resolve(response);
          });
        });
      return deferred.promise;
    },
    post: function(url, data) {
      var self = this, deferred = self.$q.defer();
      self.getAccessToken()
        .then(function(accessData) {
          // jscs:disable
          var req = self.createRequest({
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
    },
    put: function(url, data) {
      var self = this, deferred = self.$q.defer();
      self.getAccessToken()
        .then(function(accessData) {
          // jscs:disable
          var req = self.createRequest({
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
    },
    // better remove here
    delete: function(url) {
      var self = this, deferred = self.$q.defer();
      self.getAccessToken()
        .then(function(accessData) {
          // jscs:disable
          var req = self.createRequest({
            method: 'DELETE',
            url: url
          }, accessData.access_token);
          // jscs:enable

          self.request(req).then(function(response) {
            deferred.resolve(response);
          });
        });
      return deferred.promise;
    },
    request: function(opts, retryCount) {
      var self = this, deferred = self.$q.defer();
      retryCount = (typeof retryCount === 'undefined') ? 1 : retryCount;

      self.$http(opts)
        .then(function(data) {
          deferred.resolve(data);
        })
        .catch(function(error) {
          if (error.status === 401 || error.status === 400) {
            return self.retry(opts, error, deferred, retryCount);
          }
          deferred.reject(error);
        });
      return deferred.promise;
    },
    retry: function(reqOpts, error, df, times, waitMs) {
      var self = this, cont;
      // remove saved accessToken to fetch a new one
      self.store.remove('easybib-api-access-data');

      times = (typeof times === 'undefined') ? 1 : times;
      waitMs = waitMs || 1000;

      cont = function() {
        self.getAccessToken()
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
        setTimeout(cont, waitMs);
        return;
      }
      df.reject(error);
    }
  };

  return EasyBibApiClient;
}());
