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
	const promify = function(result) {
		var success = true;
		while (success && result instanceof Function) {
			try {
				result = result();
			} catch(e) {
				success = false;
				result = e;
			}
		}
		return {
			then: function(resolve, reject) {
				if (!success) {
					if (reject) {
						return reject(result);
					}
					throw result;
				}
				if (result instanceof Promise) {
					return result.then(resolve, reject);
				}
				return resolve ? resolve(result) : result;
			}
		};
	};

	_.extend(globals('mocha'), {
		_: _,
		node: {
			chai: require("chai")
		},
		expect: require("chai").expect
	});

	const push = Array.prototype.push;

	const nodejs = function (_) {
		return _.map(_.flatten(arguments).slice(1), function (name) {
			const part = _.toPath(name);
			return _.get(require(part[0]), part.slice(1));
		});
	};

	const composix = function (_, array) {
		array = _.compact(array);
		for (var i = 0; i < array.length; ++i) {
			array[i] = _.require(array[i]);
		}
		return array;
	};

	const cbDescribe = function (_, use) {
		const argv = [];
		_.each(use, function (value, key) {
			switch (key.toLowerCase()) {
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

	const descr = function cpx$mocha$describe(object, _, name) {
		describe(object.name || name, function () {
			var argv, use = object.use;
			if (!use) {
				use = {
					nodejs: ["chai.expect"],
					cpx: [object.name]
				};
			}
			before(function (done) {
				promify(function() {
					if (_.isFunction(object.before)) {
						return object.before.call(null);
					}
					argv = cbDescribe(_, use);
				}).then(_.ary(done, 0), done);
			});
			if (_.isObject(object.it)) {
				_(object.it).each(function (value, key) {
					it(key, function (done) {
						promify(function() {
							return value.apply(null, argv);
						}).then(_.ary(done, 0), done);
					});
				});
			}
			if (_.isObject(object.xit)) {
				_(object.xit).each(function (value, key) {
					xit(key);
				});
			}
		});
	};

	_.mixin({
		describe: function () {
			const argv = _.ComPosiX.groupArguments(arguments);
			const underscore = _.ComPosiX(true);
			underscore.ComPosiX('module');
			const func = underscore.plugin.call(underscore, argv[1], argv[2]);
			const result = func.call(null, underscore);
			if (result instanceof Object) {
				descr(result, underscore, argv[0]);
			}
			underscore.ComPosiX(false);
		}
	});
});
