var assert = require('assert');
var findModule = require('../index');
var path = require('path');

try {
	findModule('./fixtures/file2')
} catch (err) {
	return assert.ok(err);
}

assert.ok(false);