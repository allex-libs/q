function createPromiseArrayFulfillerJob(execlib, JobBase, q) {
  'use strict';
  var lib = execlib.lib;

  function PromiseArrayFulfillerJob(promiseproviderarry) {
    JobBase.call(this);
    this.promiseproviderarry = promiseproviderarry;
  }
  lib.inherit(PromiseArrayFulfillerJob, JobBase);
  PromiseArrayFulfillerJob.prototype.destroy = function () {
    this.promiseproviderarry = null;
    JobBase.prototype.destroy.call(this);
  };
  PromiseArrayFulfillerJob.prototype.go = function () {
    var p = this.defer.promise;
    this.doPromise(0);
    return p;
  };
  PromiseArrayFulfillerJob.prototype.doPromise = function (index, result) {
    //console.log('doing promise at', index, 'out of', this.promiseproviderarry.length);
    if (index >= this.promiseproviderarry.length) {
      this.resolve(result);
      return;
    }
    var promiseprovider = this.promiseproviderarry[index],
      promise = this.activatePromiseProvider(promiseprovider, result);
    promise.then(
      this.doPromise.bind(this, index+1),
      this.reject.bind(this),
      this.notify.bind(this)
    );
  };

  return PromiseArrayFulfillerJob;
}

module.exports = createPromiseArrayFulfillerJob;

