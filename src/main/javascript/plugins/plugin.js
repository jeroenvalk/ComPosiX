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
	const plugin = function(argv) {

		const defaultConfig = {
			named: true
		};
		const pluginModule = function(_, cfg) {
			cfg = cfg ? Object.setPrototypeOf(cfg, defaultConfig) : Object.create(defaultConfig);
			_.extend(this, {
				result: _.module.call(_, cfg.named && argv[0], argv[1], argv[2])
			});
			return _;
		};

		const pluginFunction = function(_) {
			_.extend(this, {
				result: argv[2].call(null, _)
			});
			return _;
		};

		return _.extend(argv[0] || argv[1] ? pluginModule : pluginFunction, {argv: argv});
	};

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

	var current;

	_.mixin({
		plugin: function cpx$plugin() {
			const argv = groupArguments(arguments);
			if (argv[2]) {
				current = plugin(argv);
			} else {
				global._ = _;
				require("./" + argv[0]);
				delete global._;
			}
			return current;
		}
	});

	return _;
};
