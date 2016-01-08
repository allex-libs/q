function createPromiseChainerJob(execlib, PromiseArrayFulfillerJob, q) {
  'use strict';
  var lib = execlib.lib;

  function PromiseChainerJob(promiseproviderarry) {
    PromiseArrayFulfillerJob.call(this, promiseproviderarry);
  }
  lib.inherit(PromiseChainerJob, PromiseArrayFulfillerJob);

  PromiseChainerJob.prototype.activatePromiseProvider = function (promiseprovider, previousresult){
    return promiseprovider(previousresult);
  };

  return PromiseChainerJob;
}

module.exports = createPromiseChainerJob;
