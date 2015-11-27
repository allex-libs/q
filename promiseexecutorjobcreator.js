function createPromiseExecutorJob(execlib, JobBase) {
  'use strict';
  var lib = execlib.lib,
    q = require('q');

  function PromiseExecutorJob(promiseproviderarry) {
    JobBase.call(this);
    this.promiseproviderarry = promiseproviderarry;
  }
  lib.inherit(PromiseExecutorJob, JobBase);
  PromiseExecutorJob.prototype.destroy = function () {
    this.promiseproviderarry = null;
    JobBase.prototype.destroy.call(this);
  };
  PromiseExecutorJob.prototype.go = function () {
    this.doPromise(0);
  };
  PromiseExecutorJob.prototype.doPromise = function (index, result) {
    if (index >= this.promiseproviderarry.length) {
      this.resolve(result);
      return;
    }
    var promiseprovider = this.promiseproviderarry[index],
      next = this.doPromise.bind(this, index+1);
    promiseprovider(result).then(
      next,
      next
    );
  };

  return PromiseExecutorJob;
}

module.exports = createPromiseExecutorJob;
