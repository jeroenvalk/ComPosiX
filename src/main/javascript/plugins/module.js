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

_.plugin("module", function (_) {
	const isInteger = Number.isInteger;

	const x = {}, lib = {
		context: {
			proxyRequest: {},
			getVariable: function() {
				return null;
			}
		}
	};

	const helper = function(name, func, _) {
		const y = {}, res = func.call(x, _, y);
		lib[name] = res || y;
		if (lib[name] instanceof Promise) {
			const cause = new Error();
			lib[name].catch(function(e) {
				console.error(e);
				console.error('CAUSED BY: ' + name);
				console.error(cause);
			})
		}
	};

	const module = function cpx$module() {
		const func = _.plugin.apply(null, arguments);
		switch(func.type) {
			case "plugin":
				func.type = "module";
				if (func.id) {
					helper(func.id, func, _);
				} else {
					func.call(x, _);
				}
				break;
			default:
				throw new Error();
		}
	};

	const error = function module$error(errno, param) {
		if (isInteger(errno) && errno > 0) {
			return new Error(JSON.stringify(param) + " (errno=" + errno + ")");
		}
		return null;
	};

	const throwError = function module$throw(errno, param) {
		const e = _.error(errno, param);
		if (e) {
			throw e;
		}
	};

	const cause = function module$cause(errno, param) {
		const cause = _.error(errno, param);
		return function(e) {
			if (cause) {
				e.CAUSE = cause;
			}
			throw e;
		}
	};

	const pluginRequire = _.require;

	_.mixin({
		require: function(name, plugin) {
			if (plugin) {
				return pluginRequire.call(this, name);
			}
			if (lib[name]) {
				return lib[name];
			}
			const func = pluginRequire.call(this, name);
			if (!lib[name]) {
				switch(func.type) {
					case "plugin":
						// func is supposed to invoke _.module
						func.call(null, this);
						break;
					case "module":
						// func is a module in the plugin cache
						// calling it creates a new instance
						if (name === func.id) {
							helper(name, func, this, {});
						}
						break;
					default:
						throw new Error();
				}
			}
			if (!lib[name]) {
				_.throw(3, name);
			}
			return lib[name];
		},
		module: module,
		error: error,
		throw: throwError,
		cause: cause
	});
});
