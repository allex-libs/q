(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
ALLEX.lib.qlib = require('./index')({lib:ALLEX.lib}, ALLEX.lib.q);

},{"./index":3}],2:[function(require,module,exports){
function create(execlib,q){
  /// todo: introduce policies .... reject if first rejected, reject if any rejected, but execute all, pass results to next and so on ...
  var lib = execlib.lib,
    runNext = lib.runNext;

  function Chainer(ftions) {
    this.d = q.defer();
    this.ftions = ftions;
    this.results = new Array(this.ftions.length);
    this.index = -1;
    runNext (this.next.bind(this), 1);
  }
  Chainer.prototype.destroy = function () {
    this.index = null;
    this.results = null;
    this.ftions = null;
    this.d = null;
  };

  Chainer.prototype.next = function (){
    if (this.index >= this.ftions.length-1) {
      this.d.resolve(this.results);
      return;
    }
    this.index++;
    try {
      var f = this.ftions[this.index];
      f().done (this._onDone.bind(this), this._onFailed.bind(this));
    }catch (e) {
      this._onFailed(e);
    }
  };


  Chainer.prototype._onDone = function (result) {
    this.results[this.index] = {'success': result};
    this.next();
  };
  Chainer.prototype._onFailed = function (error) {
    this.results[this.index] = {'error': error};
    this.next();
  };

  function dochain(arry_of_promise_returning_ftions) {
    var r = new Chainer(arry_of_promise_returning_ftions);
    var promise = r.d.promise;
    promise.done(r.destroy.bind(r));
    return promise;
  }

  return dochain;
}

module.exports = create;

},{}],3:[function(require,module,exports){
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

},{"./chainpromises":2,"./jobbasecreator":4,"./jobcollectioncreator":5,"./promisearrayfulfillerjob":6,"./promisechainerjobcreator":7,"./promiseexecutionmapreducercreator":8,"./promiseexecutorjobcreator":9,"./promisehistorychainerjobcreator":10,"./promisemapperjobcreator":11}],4:[function(require,module,exports){
function createJobBase(execlib, q) {
  'use strict';
  var lib = execlib.lib;

  function JobBase(defer) {
    this.defer = (defer && q.isPromise(defer.promise)) ? defer : q.defer();
    this.result = null;
    this.error = null;
  }
  JobBase.prototype.destroy = function () {
    if (this.defer) {
      if (this.error) {
        this.defer.reject(this.error);
      } else {
        this.defer.resolve(this.result);
      }
    }
    this.error = null;
    this.result = null;
    this.defer = null;
  };
  JobBase.prototype.resolve = function (result) {
    if (!this.defer) {
      return;
    }
    this.result = result;
    this.destroy();
  };
  JobBase.prototype.reject = function (error) {
    if (!this.defer) {
      return;
    }
    this.error = error;
    this.destroy();
  };
  JobBase.prototype.notify = function (progress) {
    if (this.defer) {
      this.defer.notify(progress);
    }
  };

  return JobBase;
}

module.exports = createJobBase;

},{}],5:[function(require,module,exports){
function createJobCollection(execlib, q) {
  'use strict';
  var lib = execlib.lib;

  function Lock() {
    this.defer = null;
    this.q = new lib.Fifo();
    this.nexter = this.next.bind(this);
  }
  Lock.prototype.destroy = function () {
    var j;
    this.nexter = null;
    while(this.q.length) {
      j = this.q.pop();
      j.reject(new lib.Error('JOB_COLLECTION_DESTROYING'));
    }
    this.q.destroy();
    this.defer = null;
  };
  Lock.prototype.add = function (job) {
    if (this.defer) {
      this.q.push(job);
    } else {
      this.activate(job);
    }
  };
  Lock.prototype.activate = function (job) {
    var p = job.defer.promise;
    p.then(
      this.next.bind(this),
      this.next.bind(this)
    );
    this.defer = p;
    job.go();
  };
  Lock.prototype.next = function () {
    this.defer = null;
    var job = this.q.pop();
    if (job) {
      this.activate(job);
    }
  };

  function JobCollection () {
    this.__locks = new lib.Map();
  }
  JobCollection.prototype.destroy = function () {
    lib.containerDestroyAll(this.__locks);
    this.__locks.destroy();
  };
  JobCollection.prototype.run = function (jobclassname, job) {
    var lock = this.__locks.get(jobclassname),
      p = job.defer.promise;
    if (!lock) {
      lock = new Lock();
      this.__locks.add(jobclassname, lock);
    }
    lock.add(job);
    return p;
  };
  
  return JobCollection;
}

module.exports = createJobCollection;

},{}],6:[function(require,module,exports){
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
    this.doPromise(0);
    return this.defer.promise;
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
      this.reject.bind(this)
    );
  };

  return PromiseArrayFulfillerJob;
}

module.exports = createPromiseArrayFulfillerJob;


},{}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
function createPromiseExecutionMapReducer (execlib, qlib, MapperJob, q) {
  var lib = execlib.lib;

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

},{}],9:[function(require,module,exports){
function createPromiseExecutorJob(execlib, PromiseArrayFulfillerJob, q) {
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

},{}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
function createPromiseMapper(execlib, JobBase, PromiseArrayFulfillerJob, q) {
  'use strict';
  var lib = execlib.lib;
  
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
    var chainer = new PromiseArrayFulfillerJob(this.promiseproviderarry.map(this.resultPutter.bind(this, result)));
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

  return PromiseMapperJob;
}

module.exports = createPromiseMapper;

},{}]},{},[1]);
