var path = require('path');
var fs = require('fs');

var root = path.resolve('/');
var join = path.join;

var enoent = function(path) {
	var err = new Error('could not find '+path);
	err.code = 'ENOENT';
	return err;
};

var overload = function(path, options, callback) {
	if (path && typeof path === 'object') return overload(path.path, path, options);
	if (typeof options === 'function')    return overload(path, {}, options);

	options = options || {};
	options.callback = options.callback || callback;
	options.path = path;

	return options;
};

var mapOne = function(arr, fn, callback) {
	var i = 0;

	var loop = function(err, value) {
		if (err) return callback(err);
		if (value) return callback(null, value);
		if (i >= arr.length) return callback();

		fn(arr[i++], loop);
	};

	loop();
};

var buildFindModule = function(fs) {
	return function() {
		var options = overload.apply(null, arguments);

		options.modules = [].concat(options.modules || 'node_modules');
		options.extensions = [].concat(options.extensions || ['js', 'json']);

		if (!options.path) throw new Error('path is required');
		if (options.filename && !options.dirname) options.dirname = path.dirname(options.filename);

		var path = options.path;

		var callback = function(err, filename) {
			if (err) return options.callback(err);
			if (!filename) return options.callback(enoent(path));
			return options.callback(null, filename);
		};

		// checks whether a filename is valid
		var onfilename = function(filename, callback) {
			fs.stat(filename, function(err, found) {
				callback(null, found && filename);
			});
		};

		// checks whether there the file exists or there is one with a valid extension
		var onextension = function(filename, callback) {
			var filenames = [filename].concat(options.extensions.map(function(extension) {
				return filename+'.'+extension;
			}));

			mapOne(filenames, onfilename, callback);
		};

		// resolves a common.js path to a filename (possibly missing an extension)
		var onpath = function(path, callback) {
			fs.stat(path, function(err, stat) {
				if (err && err.code !== 'ENOENT') return callback(err);
				if (err) return onextension(path, callback);

				if (!stat.isDirectory()) return onextension(path, callback);

				// it is a dir - see if there is a package.json file
				fs.readFile(join(path, 'package.json'), 'utf-8', function(err, data) {
					if (err) return onextension(join(path, 'index'), callback); // no package - lookup index

					try {
						data = JSON.parse(data);
					} catch (err) {
						return callback(err); // bad package file
					}

					onextension(join(path, data.main || 'index'), callback); // lookup package.main or index
				});
			});
		};

		// resolves a common.js module to a path
		var onmodule = function(name, dirname, callback) {
			var paths = options.modules.map(function(modules) {
				return join(dirname, modules, name);
			});

			mapOne(paths, onpath, function(err, filename) {
				if (filename) return callback(null, filename);
				if (dirname === root) return callback();

				onmodule(name, join(dirname, '..'), callback);
			});
		};

		fs.realpath(options.dirname || '.', function(err, dirname) {
			if (err) return callback(err);

			if (path[0] === '.') return onpath(join(dirname, path), callback);
			if (path[0] === '/') return onpath(path, callback);

			onmodule(path, dirname, callback);
		});
	};
};

var synchronize = function(fn) {
	return function() {
		var result;
		var args = Array.prototype.slice.call(arguments).concat(function(err, val) {
			if (err) throw err;
			result = val;
		});

		fn.apply(null, args);

		return result;
	};
};

var asynchronize = function(fn) {
	return function() {
		var args = Array.prototype.slice.call(arguments);
		var callback = args.pop();
		var result;

		try {
			result = fn.apply(null, args);
		} catch (err) {
			return callback(err);
		}

		callback(null, result);
	};
};

var syncFs = {
	readFile: asynchronize(fs.readFileSync),
	realpath: asynchronize(fs.realpathSync),
	stat: asynchronize(fs.statSync)
};

var findModule = buildFindModule(fs);
var findModuleSync = synchronize(buildFindModule(syncFs));

module.exports = function() {
	var sync = typeof arguments[arguments.length-1] !== 'function';

	if (sync) return findModuleSync.apply(null, arguments);
	findModule.apply(null, arguments);
};
