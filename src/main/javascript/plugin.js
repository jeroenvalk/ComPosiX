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

(function() {
	'use strict';

	const indexOf = {s: 0, o: 1, f: 2};

	const groupArguments = function (argv) {
		const result = new Array(3);
		var i, index;
		for (i = 0; i < argv.length; ++i) {
			index = indexOf[(typeof argv[i]).charAt(0)];
			if (!isNaN(index)) {
				result[index] = argv[i];
			}
		}
		return result;
	};

	const bootPlugin = function cpx$plugin() {
		const argv = groupArguments(arguments);
		if (!argv[1] || argv[1] instanceof Array) {
			if (argv[0]) {
				bootPlugin.cache[argv[0]] = argv[2];
			} else {
				argv[2].apply(this, _.concat(_, _.map(argv[1], _.bind(this.require, this))));
			}
		} else {
			bootPlugin.cache[argv[0]] = argv[2] ? _.extend(argv[2], argv[1]) : argv[1];
		}
	};

	bootPlugin.cache = {};
	bootPlugin.groupArguments = groupArguments;

	_.mixin({
		plugin: bootPlugin
	});
})();
