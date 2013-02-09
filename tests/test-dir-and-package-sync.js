var assert = require('assert');
var findModule = require('../index');
var path = require('path');

var filename = findModule('./fixtures/dir_and_package');

assert.equal(filename, path.join(__dirname, 'fixtures/dir_and_package/hello.js'));