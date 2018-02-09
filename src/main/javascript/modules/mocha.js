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

_.module("mocha", ["channel"], function (_, channel) {
	const x = {
		node: {
			chai: require("chai")
		}
	};

	const push = Array.prototype.push;

	const nodejs = function(_) {
			return _.map(_.flatten(arguments).slice(1), function(name) {
				const part = _.toPath(name);
				return _.get(require(part[0]), part.slice(1));
			});
	};

	const composix = function(_) {
		var array = _.flatten(arguments).slice(1);
		_.module(array, function() {
			array = _.flatten(arguments).slice(1);
		});
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
						channel.read(channel.create(true, object.before).call(x, x), Infinity, function (array) {
							use = array[0].use || use;
							try {
								argv = cbDescribe(_, use);
								done();
							} catch(e) {
								done(e);
							}
						});
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
							//console.log("ARGV", argv);
							try {
								const rd = channel.create(true, value).apply(_.clone(x), argv);
								channel.read(rd, Infinity, function (array) {
									if (array.length > 0) {
										const error = _.extend(new Error(), array[0]);
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

	return {
		describe: descr
	};
});
