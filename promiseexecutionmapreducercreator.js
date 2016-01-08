function createPromiseExecutionMapReducer (execlib, qlib, MapperJob) {
  var lib = execlib.lib,
    q = lib.q;

  function PromiseExecutionMapReducer(promiseproviderarry, paramarry, fn, ctx) {
    qlib.JobBase.call(this);
    this.mapper = new MapperJob(promiseproviderarry, paramarry);
    this.applier = qlib.applier(fn, ctx);
  }
  lib.inherit(PromiseExecutionMapReducer, qlib.JobBase);

  PromiseExecutionMapReducer.prototype.destroy = function () {
    this.applier = null;
    this.mapper = null;
    qlib.JobBase.prototype.destroy.call(this);
  };

  PromiseExecutionMapReducer.prototype.go = function () {
    this.mapper.go().then(
      this.applier
    ).then(
      this.resolve.bind(this),
      this.reject.bind(this)
    );
    return this.defer.promise;
  };

  return PromiseExecutionMapReducer;
};

module.exports = createPromiseExecutionMapReducer;
