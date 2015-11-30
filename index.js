function createlib (execlib) {
  'use strict';

  var JobBase = require('./jobbasecreator')(execlib),
    PromiseChainerJob= require('./promisechainerjobcreator')(execlib, JobBase),
    PromiseExecutorJob= require('./promiseexecutorjobcreator')(execlib, JobBase),
    PromiseHistoryChainerJob = require('./promisehistorychainerjobcreator')(execlib, JobBase, PromiseChainerJob),
    PromiseMapperJob = require('./promisemapperjobcreator')(execlib, JobBase, PromiseChainerJob);

  function returner(val) {
    return function() {
      return val;
    }
  };
  function applier(fn, ctx) {
    return function (arry) {
      return fn.apply(ctx, arry);
    };
  }
  function promise2defer(promise, defer) {
    promise.then(
      defer.resolve.bind(defer),
      defer.reject.bind(defer),
      defer.notify.bind(defer)
    );
    return defer.promise;
  }
  return {
    chainPromises : require('./chainpromises')(execlib),
    JobBase: JobBase,
    PromiseChainerJob: PromiseChainerJob,
    PromiseExecutorJob: PromiseExecutorJob,
    PromiseHistoryChainerJob: PromiseHistoryChainerJob,
    PromiseMapperJob: PromiseMapperJob,
    JobCollection: require('./jobcollectioncreator')(execlib),
    returner: returner,
    applier: applier,
    promise2defer: promise2defer
  };
}

module.exports = createlib;
