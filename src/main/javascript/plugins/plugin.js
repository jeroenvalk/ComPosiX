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

	_.mixin({
		require: function (name) {
			if (cache[name]) {
				return cache[name];
			}
			const _ = global._;
			global._ = this;
			var pathname = "./" + name;
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
			return cache[name];
		},
		plugin: function cpx$plugin() {
			const argv = groupArguments(arguments);

			if (!argv[1]) argv[1] = [];

			const result = function cpx$plugin(_) {
				const array = new Array(argv[1].length + 1);
				for (var i = 1; i < array.length; ++i) {
					array[i] = _.require(argv[1][i - 1]);
				}
				array[0] = _;
				_.extend(this, {
					result: argv[2].apply(null, array)
				});
				return _;
			};
			if (arguments[0] && argv[0]) {
				cache[argv[0]] = result;
			}
			return _.extend(result, {argv: argv});
		}
	});

	return _;
};
