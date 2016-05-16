import through from 'through';
import path from 'path';
import {transform} from 'escompress';

module.exports = function escompressify(file, opts={}) {

  let debug = '_flags' in opts
    ? opts._flags.debug
    : true;

  delete opts._flags;

  let buffer = '';
  const exts = []
    .concat(opts.ext || [])
    .concat(opts.x || [])
    .map(function(d) {
      if (d.charAt(0) === '.') return d;
      return '.' + d;
    });

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
    var matched = buffer.match(
      /\/\/[#@] ?sourceMappingURL=data:application\/json;base64,([a-zA-Z0-9+\/]+)={0,2}\n?$/
    );

    debug = opts.sourcemap !== false && (debug || matched);
    opts  = Object.assign({}, {
      beautify: true,
      compress: true,
      convertUndefinedVoid: true,
      minifyBooleans: true,
      mangle: true,
      mergeVariables: true,
      removeConsole: true,
      removeComments: true,
      removeDeadCode: true,
      removeDebugger: true
    }, opts);

    if (typeof opts.compress === 'object') {
      delete opts.compress._;
    }

    if (debug) opts.outSourceMap = 'out.js.map';

    var min = transform(buffer, opts);

    // Uglify leaves a source map comment pointing back to "out.js.map",
    // which we want to get rid of because it confuses browserify.
    min.code = min.code.replace(/\/\/[#@] ?sourceMappingURL=out.js.map$/, '');
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
}
