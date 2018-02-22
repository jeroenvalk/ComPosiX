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
	};

	const module = function cpx$module() {
		const func = this.plugin.apply(this, arguments), name = func.argv[0];
		func.type = 1; // module
		if (name) {
			helper(name, func, this);
		} else {
			func.call(x, this);
		}
	};

	const throwError = function module$throw(errno, param) {
		if (isFinite(errno) && errno > 0) {
			throw new Error(JSON.stringify(param) + " (errno=" + errno + ")");
		}
	};

	const pluginRequire = _.require;

	_.mixin({
		require: function(name) {
			if (lib[name]) {
				return lib[name];
			}
			const func = pluginRequire.call(this, name);
			if (!lib[name]) {
				switch(func.type) {
					case 0:
						// func is supposed to invoke _.module
						func.call(null, this);
						break;
					case 1:
						// func is a module in the plugin cache
						// calling it creates a new instance
						if (name === func.argv[0]) {
							helper(name, func, this, {});
						}
						break;
				}
			}
			if (!lib[name]) {
				_.throw(3, name);
			}
			return lib[name];
		},
		module: module,
		throw: throwError
	});
});
