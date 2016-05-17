const test = require('tape');
const escompressify = require('../escompressify.js');
const fs = require('fs');
const path = require('path');
const bl = require('bl');

test('escompressify: sanity check', function(t) {
  var src  = path.join(__dirname, 'fixture.js')
  var orig = fs.readFileSync(src, 'utf8')

  fs.createReadStream(src)
    .pipe(escompressify(src))
    .pipe(bl(function(err, data) {
      if (err) return t.ifError(err)
      data = String(data)
      t.notEqual(data.indexOf('var hello'), -1, 'var hello')
      t.notEqual(data.indexOf('world'), -1, 'world')
      t.notEqual(data, orig, 'should be minified')
      t.end()
    }))
})

test('escompressify: ignores json', function(t) {
  var src  = path.join(__dirname, 'fixture.js');
  var json = path.join(__dirname, 'fixture.json');
  var orig = fs.readFileSync(src, 'utf8');

  fs.createReadStream(src)
    .pipe(escompressify(json))
    .pipe(bl(buffered));

  function buffered(err, data) {
    if (err) return t.ifError(err);
    data = String(data);
    t.equal(data, orig, 'should not be minified');
    t.end();
  }
});

test('escompressify: -t [ escompressify --exts ]', function(t) {
  var src  = path.join(__dirname, 'fixture.js');
  var orig = fs.readFileSync(src, 'utf8');

  t.plan(5);

  check(path.join(__dirname, 'fixture.json'), true);
  check(path.join(__dirname, 'fixture.obj2'), false);
  check(path.join(__dirname, 'fixture.md'), false);
  check(path.join(__dirname, 'fixture.fbla'), true);
  check(src, true);

  function check(name, ignored) {
    fs.createReadStream(src)
      .pipe(escompressify(name, {exts: ['md', 'obj2'],  mangle: true}))
      .pipe(bl(buffered));

    function buffered(err, data) {
      if (err) return t.ifError(err);
      data = String(data);
      console.log("data", data);
      console.log("orig", orig);
      t.ok(ignored
        ? data === orig
        : data !== orig
      , path.extname(name) + ' handled as expected')
    }
  }
});

test('escompressify: passes options to escompress', function(t) {
  var src  = path.join(__dirname, 'fixture.js');
  var orig = fs.readFileSync(src, 'utf8');
  var buf1 = null;

  fs.createReadStream(src)
    .pipe(escompressify(src, { compress: false, mangle: false }))
    .pipe(bl(buffered1));

  function buffered1(err, _buf1) {
    if (err) return t.ifError(err)
    buf1 = String(_buf1);
    t.notEqual(buf1, orig, 'should be minified');

    fs.createReadStream(src)
      .pipe(escompressify(src, { compress: true, mangle: true }))
      .pipe(bl(buffered2));
  }

  function buffered2(err, buf2) {
    if (err) return;
    buf2 = String(buf2);
    t.notEqual(buf2, orig, 'should be minified');
    t.notEqual(buf1, buf2, 'options altered output');
    t.end();
  }
})
