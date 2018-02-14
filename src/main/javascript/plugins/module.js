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

	const module = function cpx$module() {
		var i, name = null, deps = [], func = null, res;

		const Constructor = function () {
			argv.push(this);
			res = func.apply(x, argv);
			argv.pop();
		};

			for (i = 0; i < arguments.length; ++i) {
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
		const argv = new Array(deps.length + 1);
		argv[0] = _;
		for (i = 1; i < argv.length; ++i) {
			argv[i] = _.require(deps[i - 1]);
		}
		const y = new Constructor();
		if (name) {
			lib[name] = res || y;
		}
	};

	const throwError = function module$throw(errno, param) {
		if (isFinite(errno) && errno > 0) {
			throw new Error(JSON.stringify(param) + " (errno=" + errno + ")");
		}
	};

	const pluginRequest = _.require;

	_.mixin({
		require: function(name) {
			if (lib[name]) {
				return lib[name];
			}
			const func = pluginRequest.call(this, name);
			if (!lib[name]) {
				func.call(null, this);
			}
			if (!lib[name]) {
				throw new Error();
			}
			return lib[name];
		},
		module: module,
		throw: throwError
	});
});
