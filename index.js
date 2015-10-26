function createlib (execlib) {
  'use strict';

  return {
    chainPromises : require('./chainpromises')(execlib)
  };
}

module.exports = createlib;
