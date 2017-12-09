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

_.module("recurse", function() {
	const cloneDeep = function recurse$cloneDeep(value, result) {
		const customizer = function recurse$cloneDeep$customizer(value) {
			var i;
			if (_.isFunction(value)) {
				i = _.findIndex(result, function(func) {
					return func === value;
				});
				if (i < 0) {
					i = result.length;
					result.push(value);
				}
				return i;
			}
		};

		if (!_.isArray(result)) {
			result = [];
		}

		return _.cloneDeepWith(value, customizer);
	};

	return {
		cloneDeep: cloneDeep
	}
});
