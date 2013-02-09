var assert = require('assert');
var findModule = require('../index');
var path = require('path');

try {
	findModule('something');
} catch (err) {
	return assert.ok(err);
}

assert.ok(false);
