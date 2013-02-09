var assert = require('assert');
var findModule = require('../index');
var path = require('path');

var filename = findModule('dir_and_package', {dirname:'fixtures'});

assert.equal(filename, path.join(__dirname, 'fixtures/node_modules/dir_and_package/hello.js'));