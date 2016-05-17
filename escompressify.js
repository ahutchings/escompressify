const through = require('through');
const path = require('path');
const {transform} = require('escompress');

module.exports = function escompressify(file, opts) {

  let buffer = '';
  const exts = []
    .concat(opts.ext || [])
    .concat(opts.x || []);

  if (
    /\.json$/.test(file) ||
    exts.length &&
    exts.indexOf(path.extname(file)) === -1
  ) {
    return through();
  }

  return through(function write(chunk) {
    buffer += chunk;
  }, capture(function ready() {

    opts = Object.assign({}, opts);

    var min = transform(buffer, opts);
    this.queue(min.code);
    this.queue(null);
  }));

  function capture(fn) {
    return function() {
      try {
        fn.apply(this, arguments);
      } catch(err) {
        return this.emit('error', err);
      }
    };
  }
};
