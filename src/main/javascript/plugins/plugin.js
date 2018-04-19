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

_.plugin(function (_) {
	const cpx = _.ComPosiX, cpxRequire = cpx.require, groupArguments = _.plugin.groupArguments;

	const cache = {};
	var result = null;

	const require = function plugin$require(module) {
		const _ = this;
		if (cache[module]) {
			return cache[module];
		}
		cpxRequire.call(_, module);
		if (cache[module]) {
			return cache[module];
		}
		if (result.id === module) {
			return result;
		}
		throw new Error();
	};

	const plugin = function plugin$plugin() {
		const argv = groupArguments(arguments);
		if (!argv[1]) argv[1] = [];
		if (argv[1] instanceof Array) {
			const func = function cpx$plugin(_) {
				if (argv[0]) {
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
			func.type = "plugin";
			func.id = argv[0];
			return result = func;
		}
		if (argv[2]) {
			result = _.extend(argv[2], argv[1]);
		} else {
			result = argv[1];
		}
		if (argv[0]) {
			return cache[argv[0]] = result;
		}
		return result;
	};

	plugin.require = require;
	plugin.groupArguments = groupArguments;

	_.mixin({
		require: require,
		plugin: plugin
	});

	return true;
});
