!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.easybibApiClient=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){


require('angular-storage');

angular.module('easybib-api-client', ['angular-storage'])
  .factory(require('./easybib-api-client'));

},{"./easybib-api-client":4,"angular":3,"angular-storage":2}],2:[function(require,module,exports){
(function() {


// Create all modules and define dependencies to make sure they exist
// and are loaded in the correct order to satisfy dependency injection
// before all nested files are concatenated by Grunt

angular.module('angular-storage',
    [
      'angular-storage.store'
    ]);

angular.module('angular-storage.internalStore', ['angular-storage.storage'])
  .factory('InternalStore', ["storage", "$log", function(storage, $log) {

    function InternalStore(namespace, delimiter) {
      this.namespace = namespace || null;
      this.delimiter = delimiter || '.';
      this.inMemoryCache = {};
    }

    InternalStore.prototype.getNamespacedKey = function(key) {
      if (!this.namespace) {
        return key;
      } else {
        return [this.namespace, key].join(this.delimiter);
      }
    };



    InternalStore.prototype.set = function(name, elem) {
      this.inMemoryCache[name] = elem;
      storage.set(this.getNamespacedKey(name), JSON.stringify(elem));
    };

    InternalStore.prototype.get = function(name) {
      var obj = null;
      if (name in this.inMemoryCache) {
        return this.inMemoryCache[name];
      }
      var saved = storage.get(this.getNamespacedKey(name));
      try {

        if (typeof saved ==="undefined" || saved === "undefined") {
          obj = undefined;
        } else {
          obj = JSON.parse(saved);
        }

        this.inMemoryCache[name] = obj;
      } catch(e) {
        $log.error("Error parsing saved value", e);
        this.remove(name);
      }
      return obj;
    };

    InternalStore.prototype.remove = function(name) {
      this.inMemoryCache[name] = null;
      storage.remove(this.getNamespacedKey(name));
    };

    return InternalStore;


  }]);


angular.module('angular-storage.storage', [])
  .service('storage', ["$window", "$injector", function($window, $injector) {
    if ($window.localStorage) {
      this.set = function(what, value) {
        return $window.localStorage.setItem(what, value);
      };
      this.get = function(what) {
        return $window.localStorage.getItem(what);
      };
      this.remove = function(what) {
        return $window.localStorage.removeItem(what);
      };
    } else {
      var $cookieStore = $injector.get('$cookieStore');
      this.set = function(what, value) {
        return $cookieStore.put(what, value);
      };
      this.get = function(what) {
        return $cookieStore.get(what);
      };
      this.remove = function(what) {
        return $cookieStore.remove(what);
      };
    }
  }]);


angular.module('angular-storage.store', ['angular-storage.internalStore'])
  .factory('store', ["InternalStore", function(InternalStore) {

    var store = new InternalStore();
    store.getNamespacedStore = function(namespace, key) {
      return new InternalStore(namespace, key);
    }

    return store;


  }]);


}());
},{}],3:[function(require,module,exports){

},{}],4:[function(require,module,exports){


var EasyBibApiClient = function(UserProfile, $q, $http, store, EasyBibApiAccessUrl) {
  this.store = store;
  this.$q = $q;
  this.$http = $http;

  this.url = {};

  this.url = {
    access: function() {
      return EasyBibApiAccessUrl();
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

module.exports = EasyBibApiClient;

},{"angular":3}]},{},[1])(1)
});