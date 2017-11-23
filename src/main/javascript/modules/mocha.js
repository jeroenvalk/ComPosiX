/**
 * Copyright © 2017 dr. ir. Jeroen M. Valk
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

_.module("mocha", ["channel"], function (channel) {
	const x = {
		node: {
			chai: require("chai")
		}
	};

	const isFunction = _.isFunction, isArray = _.isArray, isObject = _.isObject;

	const descr = function cpx$mocha$describe(object) {
		if (object.name) {
			describe(object.name, function() {
				var argv = [];
				const modules = object.modules || [object.name];
				before(function(done) {
					try {
						_(modules).each(function (module, index) {
							if (isArray(module)) {
								modules[index] = module[0];
								_.module.apply(_, module);
							} else {
								require("./" + module);
							}
						});
						_.module(modules, function () {
							x.modules = _.zipObject(modules, arguments);
						});
						if (isFunction(object.before)) {
							argv = object.before.apply(x, argv) || argv;
						} else {
							argv = [x.node.chai.expect, x.modules[object.name]];
						}
						done();
					} catch(e) {
						done(e);
					}
				});
				if (isObject(object.it)) {
					_(object.it).each(function (value, key) {
						it(key, function (done) {
							try {
								const rd = value.apply(_.clone(x), argv);
								if (isNaN(rd)) {
									done();
									return;
								}
								channel.read(rd, Infinity, function() {
									done();
								});
							} catch(e) {
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
