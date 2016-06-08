const through = require('through');
const {transform} = require('escompress');

module.exports = function escompressify(file, opts={}) {

  let buffer = '';
  const exts = [].concat(opts.exts || []);

  /*
   * If opt.exts has been set, ignore all files other than those
   */
  if (
    /\.json$/.test(file) ||
    exts.length &&
    exts.every((ext) => !file.endsWith(ext))
  ) {
    return through();
  }

  return through(function write(chunk) {
    buffer += chunk;
  }, capture(function ready() {

    opts = Object.assign({}, opts);

    delete opts.exts;
    delete opts._flags;
    delete opts.global;

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
