function createlib (execlib, q) {
  'use strict';
  var lib = execlib.lib;

  var JobBase = require('./jobbasecreator')(execlib, q),
    PromiseArrayFulfillerJob = require('./promisearrayfulfillerjob')(execlib, JobBase, q),
    PromiseChainerJob= require('./promisechainerjobcreator')(execlib, PromiseArrayFulfillerJob, q),
    PromiseExecutorJob= require('./promiseexecutorjobcreator')(execlib, PromiseArrayFulfillerJob, q),
    PromiseHistoryChainerJob = require('./promisehistorychainerjobcreator')(execlib, JobBase, PromiseChainerJob, q),
    PromiseMapperJob = require('./promisemapperjobcreator')(execlib, JobBase, PromiseChainerJob, q),
    PromiseExecutionMapperJob = require('./promisemapperjobcreator')(execlib, JobBase, PromiseExecutorJob, q);

  function returner(val) {
    return function() {
      return val;
    }
  };
  function executor(fn, ctx) {
    return function () {
      return fn.call(ctx);
    }
  }
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
  var ret = {
    chainPromises : require('./chainpromises')(execlib, q),
    JobBase: JobBase,
    PromiseChainerJob: PromiseChainerJob,
    PromiseExecutorJob: PromiseExecutorJob,
    PromiseHistoryChainerJob: PromiseHistoryChainerJob,
    PromiseMapperJob: PromiseMapperJob,
    JobCollection: require('./jobcollectioncreator')(execlib),
    returner: returner,
    executor: executor,
    applier: applier,
    promise2defer: promise2defer,
    promise2execution: promise2execution,
    promise2console: promise2console
  };

  ret.PromiseChainMapReducerJob = require('./promiseexecutionmapreducercreator')(execlib, ret, PromiseMapperJob, q);
  ret.PromiseExecutionMapReducerJob = require('./promiseexecutionmapreducercreator')(execlib, ret, PromiseExecutionMapperJob, q);
  
  return ret;
}

module.exports = createlib;
