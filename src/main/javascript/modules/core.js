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

_.module(function() {
	const slice = Array.prototype.slice;
	const each = Array.prototype.forEach;

	_.mixin({
		concat: function cpx$concat() {
			var i, j, result = [];
			for (i = 0; i < arguments.length; ++i) {
				if (arguments[i] instanceof Array) {
					for (j = 0; j < arguments[i].length; ++j) {
						result.push(arguments[i][j]);
					}
				} else {
					result.push(arguments[i]);
				}
			}
			return result;
		},
		each: function cpx$each(array, iteratee) {
			if (array) {
				for (var i = 0; i < array.length; ++i) {
					iteratee(array[i]);
				}
			}
		},
		find: function cpx$find(array, predicate) {
			for (var i = 0; i < array.length; ++i) {
				if (predicate(array[i])) {
					return array[i];
				}
			}
		},
		keys: function cpx$keys(object) {
			return Object.keys(object);
		},
		tail: function cpx$tail(array) {
			return slice.call(array, 1);
		}
	});
});
