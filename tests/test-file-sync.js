var assert = require('assert');
var findModule = require('../index');
var path = require('path');

var filename = findModule('./fixtures/file');

assert.equal(filename, path.join(__dirname, 'fixtures/file.js'));