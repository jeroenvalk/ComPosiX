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

module.exports = function (_) {
	const indexOf = {s: 0, o: 1, f: 2};

	const groupArguments = function (argv) {
		const result = new Array(3);
		for (var i = 0; i < argv.length; ++i) {
			const index = indexOf[(typeof argv[i]).charAt(0)];
			if (!isNaN(index)) {
				result[index] = argv[i];
			}
		}
		return result;
	};

	const cache = {};
	var result = null;

	const pluginRequire = function plugin$require(name) {
		if (cache[name]) {
			return cache[name];
		}
		const _ = global._;
		global._ = this;
		var pathname = "../plugins/" + name;
		try {
			require.resolve(pathname);
		} catch (e) {
			pathname = "../modules/" + name;
			try {
				require.resolve(pathname)
			} catch (e) {
				pathname = null;
			}
		}
		pathname && require(pathname);
		if (_) {
			global._ = _;
		} else {
			delete global._;
		}
		return result;
	};

	const plugin = function plugin$plugin() {
		const argv = groupArguments(arguments);
		if (!argv[1]) argv[1] = [];
		const func = function cpx$plugin(_) {
			if (argv[0] && !func.nocache) {
				cache[argv[0]] = func;
			}
			var i = argv[1].length, j = arguments.length, k = i + j;
			const array = new Array(k);
			array[0] = _;
			while (i > 0) {
				array[i] = _.require(argv[1][--i]);
			}
			while (j > 1) {
				array[--k] = arguments[--j];
			}
			return argv[2].apply(this, array);
		};
		func.type = 0; // plugin
		func.argv = argv;
		return result = func;
	};

	const _runInContext = _.runInContext;

	const runInContext = function plugin$runInContext() {
		const _ = _runInContext.apply(this, arguments);
		_.mixin(mixin);
		return _;
	};

	const mixin = {
		require: pluginRequire,
		plugin: plugin,
		runInContext: runInContext
	};

	_.mixin(mixin);
};
