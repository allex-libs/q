function createPromiseExecutorJob(execlib, PromiseArrayFulfillerJob) {
  'use strict';
  var lib = execlib.lib;

  function PromiseExecutorJob(promiseproviderarry) {
    PromiseArrayFulfillerJob.call(this, promiseproviderarry);
  }
  lib.inherit(PromiseExecutorJob, PromiseArrayFulfillerJob);

  PromiseExecutorJob.prototype.activatePromiseProvider = function (promiseprovider, previousresult) {
    return promiseprovider();
  };

  return PromiseExecutorJob;
}

module.exports = createPromiseExecutorJob;
