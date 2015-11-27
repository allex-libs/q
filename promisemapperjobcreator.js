function createPromiseMapper(execlib, JobBase, PromiseChainerJob) {
  'use strict';
  var lib = execlib.lib,
    q = require('q');
  
  function PromiseMapperJob(promiseproviderarry, paramarry) {
    JobBase.call(this);
    this.promiseproviderarry = promiseproviderarry;
    this.paramarry = paramarry || [];
  }
  lib.inherit(PromiseMapperJob, JobBase);
  PromiseMapperJob.prototype.destroy = function () {
    this.paramarry = null;
    this.promiseproviderarry = null;
    JobBase.prototype.destroy.call(this);
  };
  PromiseMapperJob.prototype.go = function () {
    var result = this.paramarry;
    var chainer = new PromiseChainerJob(this.promiseproviderarry.map(this.resultPutter.bind(this, result)));
    chainer.defer.promise.then(
      this.resolve.bind(this, result),
      this.reject.bind(this)
    );
    chainer.go();
    return this.defer.promise;
  };
  PromiseMapperJob.prototype.resultPutter = function (result, promiseprovider) {
    return function (input) {
      try {
      return promiseprovider(input)
        .then(function (resolved) {
          result.push(resolved);
          return q(resolved);
        });
      } catch(e) {
        console.error(e.stack);
        console.error(e);
      }
    }
  };

  return PromiseMapperJob
}

module.exports = createPromiseMapper;
