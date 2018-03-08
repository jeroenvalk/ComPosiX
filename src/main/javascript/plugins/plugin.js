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
	const indexOf = {s: 0, o: 1, f: 2};

	const cpxRequire = _.require;

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

	_.mixin({
		require: _.extend(function plugin$require(module) {
			const _ = this;
			if (cache[module]) {
				return cache[module];
			}
			cpxRequire(module)(_);
			//console.log('RESULT', result);
			return result;
		}, {
			search: _.require.search
		}),
		plugin: function plugin$plugin() {
			const _ = this, argv = groupArguments(arguments);
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
		}
	});
});
