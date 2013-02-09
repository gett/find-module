var assert = require('assert');
var findModule = require('../index');
var path = require('path');

var filename = findModule('./fixtures/dir');

assert.equal(filename, path.join(__dirname, 'fixtures/dir/index.js'));
