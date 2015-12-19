function createlib (execlib) {
  'use strict';
  var lib = execlib.lib,
    q = require('q');

  var JobBase = require('./jobbasecreator')(execlib),
    PromiseArrayFulfillerJob = require('./promisearrayfulfillerjob')(execlib, JobBase),
    PromiseChainerJob= require('./promisechainerjobcreator')(execlib, PromiseArrayFulfillerJob),
    PromiseExecutorJob= require('./promiseexecutorjobcreator')(execlib, PromiseArrayFulfillerJob),
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
  function standardErrReporter(reason) {
    console.error(reason);
  }
  function promise2execution(promise, cb, errcb, notifycb) {
    return promise.then(
      function(){
        try{
          return cb();
        } catch(e) {
          console.error(e.stack);
          console.error(e);
          return q.reject(e);
        }
      },
      errcb || standardErrReporter,
      notifycb || lib.dummyFunc
    );
  }
  function promise2console(promise, caption) {
    if (caption) {
      caption += ' ';
    } else {
      caption = '';
    }
    promise.then(
      console.log.bind(console, caption+'ok'),
      console.error.bind(console, caption+'nok'),
      console.log.bind(console, caption+'progress')
    );
    return promise;
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
    promise2defer: promise2defer,
    promise2execution: promise2execution,
    promise2console: promise2console
  };
}

module.exports = createlib;
