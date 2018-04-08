/**
 * Copyright © 2018 dr. ir. Jeroen M. Valk
 *
 * This file is part of ComPosiX. ComPosiX is free software: you can
 * redistribute it and/or modify it under the terms of the GNU Lesser General
 * Public License as published by the Free Software Foundation, either version 3
 * of the License, or (at your option) any later version.
 *
 * ComPosiX is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with ComPosiX. If not, see <http://www.gnu.org/licenses/>.
 */

_.module('operation', ['fs'], function (_, fs) {
	const path = require('path'), yaml = require('js-yaml');

	const mimeType = {
		".json": "application/json",
		".yaml": "application/x-yaml",
		".yml": "application/x-yaml",
		".js": "application/javascript"
	};

	const convert = {
		"application/json": function(array) {
			return JSON.parse(Buffer.concat(array).toString());
		},
		"application/x-yaml": function(array) {
			return yaml.safeLoad(Buffer.concat(array));
		},
		"application/javascript": _.identity
	};

	const then = function (func) {
		return function (argv) {
			for (var i = 0; i < argv.length; ++i) {
				if (argv[i] instanceof Promise) {
					break;
				}
			}
			if (i < argv.length) {
				return Promise.all(argv).then(func);
			}
			return func(argv);
		}
	};

	const readArray = function (rd, func) {
		return then(_.spread(function(rd, func) {
			if (!func) {
				_.throw(30, _.pick(array[i], ['contentType']));
			}
			if (rd instanceof Array) {
				return func(rd);
			}
			var callback;
			const result = channel.read(rd, Infinity, function (array) {
				callback(func(array));
			});
			if (result) {
				return func(result);
			}
			return new Promise(function (resolve) {
				callback = resolve;
			});
		}))(arguments);
	};

	const read = function (func) {
		return function (argv) {
			return func(readArrayJSON(argv));
		};
	};

	const readArrayJSON = function () {
		return then(_.spread(function (array) {
			for (var i = 0; i < array.length; ++i) {
				if (array[i]['#']) {
					if (array[i].contentType) {
						array[i] = readArray(array[i]['#'], convert[array[i].contentType]);
					} else {
						array[i] = readArray(array[i]['#'], _.identity);
					}
				}
			}
			return array;
		}))(arguments);
	};

	const readJSON = function () {
		const result = readArrayJSON(arguments);
		switch (result.length) {
			case 0:
				return null;
			case 1:
				return result[0];
			default:
				return result;
		}
	};

	const requestSingle = function(options) {
		switch (options.protocol) {
			case 'file:':
				switch(options.hostname) {
					case 'localhost':
						switch (options.method) {
							case "GET":
								return new Promise(function (resolve, reject) {
									fs.readFile(options.pathname, function (err, buffer) {
										if (err) {
											reject(err);
										} else {
											resolve({
												contentType: mimeType[path.extname(options.pathname)],
												"#": [buffer]
											});
										}
									});
								});
							case "OPTIONS":
								return {
									type: "response",
									statusCode: 200
								};
							default:
								return {
									type: "response",
									statusCode: 405
								};
						}
					default:

				}
			default:
				return {
					type: "response",
					statusCode: 500
				};
		}
	};
	const request = function operation$request() {
		return read(then(_.spread(function(options) {
			if (options instanceof Array) {
				return Promise.all(_.map(options, requestSingle));
			}
			return requestSingle(options);
		})))(arguments);
	};

	const execute = function (operation) {
		const part = operation.operationId.split("$"), module = _.require(part[0]),
			func = part[1] ? module[part[1]] : module;
		return func.apply(module, _.values(operation.param));
	};

	const flow = {
		then: then,
		read: read
	};

	return _.extend(function cpx$operation() {
		var i = arguments.length, aux = _.spread(arguments[--i]);
		for (--i; i > 1; --i) {
			aux = flow[arguments[i]](aux);
		}
		return arguments[1](aux)(arguments[0]);
	}, {
		readArrayJSON: readArrayJSON,
		readJSON: readJSON,
		request: request,
		execute: execute
	});
});
