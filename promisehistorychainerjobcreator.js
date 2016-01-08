function createPromiseHistoryChainer(execlib, JobBase, PromiseChainerJob, q) {
  'use strict';
  var lib = execlib.lib;
  
  function PromiseHistoryChainerJob(promiseproviderarry) {
    JobBase.call(this);
    this.promiseproviderarry = promiseproviderarry;
  };
  lib.inherit(PromiseHistoryChainerJob, JobBase);
  PromiseHistoryChainerJob.prototype.destroy = function () {
    this.promiseproviderarry = null;
    JobBase.prototype.destroy.call(this);
  };
  PromiseHistoryChainerJob.prototype.go = function () {
    var result = [];
    console.log('creating chainer');
    var chainer = new PromiseChainerJob(this.promiseproviderarry.map(this.resultPutter.bind(this, result)));
    chainer.defer.promise.then(
      this.resolve.bind(this),
      this.reject.bind(this)
    );
    chainer.defer.promise.then(
      this.resolve.bind(this),
      this.reject.bind(this)
    );
    console.log('running chainer');
    chainer.go();
    return this.defer.promise;
  };
  PromiseHistoryChainerJob.prototype.resultPutter = function (result, promiseprovider) {
    return function (input) {
      console.log('giving input to promiseprovider', promiseprovider);
      try {
      return promiseprovider(input)
        .then(function (resolved) {
          console.log('and got resolve', resolved);
          result.push(resolved);
          return q(result);
        });
      } catch(e) {
        console.error(e.stack);
        console.error(e);
      }
    }
  };

  return PromiseHistoryChainerJob;
}

module.exports = createPromiseHistoryChainer;
