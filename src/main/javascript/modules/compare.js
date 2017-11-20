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

_.module("compare", function() {
	const bitCount = function(n) {
		n = n - ((n >> 1) & 0x55555555)
		n = (n & 0x33333333) + ((n >> 2) & 0x33333333)
		return ((n + (n >> 4) & 0xF0F0F0F) * 0x1010101) >> 24
	}

	const typeOf = function compare$typeOf(value) {
		const result = typeof value;
		switch(result) {
			case "object":
				if (_.isArray(value)) {
					return "array";
				}
				if (_.isPlainObject(value)) {
					return "object";
				}
				/* falls through */
			case "function":
				throw new Error("not serializable");
			default:
				return result;
		}
	};

	const compareObjects = function() {
		const result = {}, argv = _.flatten(arguments);
		_(argv).each(function(value, i) {
			_(value).each(function(value, key) {
				const type = typeOf(value);
				_.update(result, [type, key], function(value) {
					return value | 1 << i;
				});
			});
		});
		_(result.object).each(function(value, key, object) {
			if (!(--value & ++value)) {
				const array = new Array(bitCount(value));
				var i, j = 0;
				_(argv).each(function(value) {
					if (value & 1) {
						array[i++] = value[key];
					}
				});
				object[key + "."] = compareObjects(array);
			}
		});
		return result;
	};

	_.mixin({
		compare: compareObjects
	});
});
