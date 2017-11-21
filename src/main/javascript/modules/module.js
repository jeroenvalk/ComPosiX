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

(function () {
	const x = {}, lib = {}, constr = {};
	var emitter;

	const emitModules = function cpx$emitModules() {
		emitter.emit("modules", _.keys(lib));
	};

	const module = function cpx$module() {
		var name = null, deps = [], func = null, res, nameA, nameB;

		const Constructor = function() {
			argv.push(this);
			res = func.apply(x, argv);
			argv.pop();
		};

		for (var i = 0; i < arguments.length; ++i) {
			if (_.isString(arguments[i])) {
				name = arguments[i];
			}
			if (_.isArray(arguments[i])) {
				deps = arguments[i];
			}
			if (_.isFunction(arguments[i])) {
				func = arguments[i];
			}
		}
		const argv = _.map(deps, _.propertyOf(lib)), y = new Constructor();
		if (name) {
			nameA = name.charAt(0); nameB = nameA.toUpperCase();
			if (nameA === nameB) {
				throw new Error("module names must start lowercase");
			}
			if (!res) {
				lib[nameB + name.substr(1)] = Constructor;
				res = y;
			}
			if (emitter) {
				lib[name] = res;
			} else {
				if (name !== "emitter") {
					throw new Error("event emitter must be loaded first");
				}
				emitter = lib.emitter = res;
				emitter.addListener("ready", emitModules);
			}
			emitter.emit("load", name);
		}
	};

	_.mixin({
		module: module
	});
})();
