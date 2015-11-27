function createlib (execlib) {
  'use strict';

  var JobBase = require('./jobbasecreator')(execlib),
    PromiseChainerJob= require('./promisechainerjobcreator')(execlib, JobBase),
    PromiseExecutorJob= require('./promiseexecutorjobcreator')(execlib, JobBase),
    PromiseHistoryChainerJob = require('./promisehistorychainerjobcreator')(execlib, JobBase, PromiseChainerJob),
    PromiseMapperJob = require('./promisemapperjobcreator')(execlib, JobBase, PromiseChainerJob);

  function applier(fn, ctx) {
    return function (arry) {
      return fn.apply(ctx, arry);
    };
  }
  return {
    chainPromises : require('./chainpromises')(execlib),
    JobBase: JobBase,
    PromiseChainerJob: PromiseChainerJob,
    PromiseExecutorJob: PromiseExecutorJob,
    PromiseHistoryChainerJob: PromiseHistoryChainerJob,
    PromiseMapperJob: PromiseMapperJob,
    JobCollection: require('./jobcollectioncreator')(execlib),
    applier: applier
  };
}

module.exports = createlib;
