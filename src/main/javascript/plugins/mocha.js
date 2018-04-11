/**
 * Copyright © 2017, 2018 dr. ir. Jeroen M. Valk
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

/* globals describe, xdescribe, it */

_.plugin("mocha", ["globals", "channel"], function (_, globals, channel) {
	_.extend(globals('mocha'), {
		_: _,
		node: {
			chai: require("chai")
		},
		expect: require("chai").expect
	});

	const push = Array.prototype.push;

	const nodejs = function(_) {
			return _.map(_.flatten(arguments).slice(1), function(name) {
				const part = _.toPath(name);
				return _.get(require(part[0]), part.slice(1));
			});
	};

	const composix = function(_, array) {
		for (var i = 0; i < array.length; ++i) {
			array[i] = _.require(array[i]);
		}
		return array;
	};

	const cbDescribe = function (_, use) {
		const argv = [];
		_.each(use, function(value, key) {
			switch(key.toLowerCase()) {
				case 'nodejs':
					push.apply(argv, nodejs(_, value));
					break;
				case 'cpx':
				case 'composix':
					push.apply(argv, composix(_, value));
					break;
			}
		});
		return argv;
	};


	const invokeAndDone = function(func, done) {
		try {
			const result = func.call(null);
			if (result instanceof Promise) {
				result.then(function() {
					done();
				}, done);
			}
		} catch(e) {
			done(e);
		}
	};

	const descr = function cpx$mocha$describe(object, _) {
		if (object.name) {
			describe(object.name, function () {
				var argv, use = object.use;
				if (!use) {
					use = {
						nodejs: ["chai.expect"],
						cpx: [object.name]
					};
				}
				before(function (done) {
					if (_.isFunction(object.before)) {
						invokeAndDone(object.before, done);
					} else {
						try {
							argv = cbDescribe(_, use);
							done();
						} catch(e) {
							done(e);
						}
					}
				});
				if (_.isObject(object.it)) {
					_(object.it).each(function (value, key) {
						it(key, function (done) {
							try {
								const rd = channel.create(true, value).apply(null, argv);
								channel.read(rd, Infinity, function (array) {
									if (array.length > 0) {
										const error = new Error();
										error.stack = array[0].stack;
										if (array[0].CAUSE) {
											error.stack += "\nCAUSED BY: \n" + array[0].CAUSE.stack;
										}
										done(error);
									} else {
										done();
									}
								});
							} catch (e) {
								done(e);
							}
						});
					});
				}
			});
		}
	};

	_.mixin({
		describe: function() {
			const underscore = _.runInContext();
			const config = _.require('config');
			delete config.plugins;
			config.initialize(underscore);

			const func = underscore.plugin.apply(underscore, arguments);
			func.nocache = true;
			if (func.argv[0]) {
				describe(func.argv[0], function () {
					func.call(null, underscore);
				});
			} else {
				const result = func.call(null, underscore);
				if (result instanceof Object) {
					descr(result, underscore);
				}
			}
		}
	});
});
