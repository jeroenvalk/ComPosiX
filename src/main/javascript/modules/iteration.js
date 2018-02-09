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

_.module("iterate", function(_) {
	const mapObject = function(object, iteratee, clone, deep, map) {
		const path = [];

		const recurse = function(current) {
			const result = clone ? {} : current;
			for (var key in current) {
				if (current.hasOwnProperty(key)) {
					path.push(key);
					const value = current[key];
					if (deep && _.isPlainObject(value)) {
						if (clone) {
							result[key] = recurse(value);
						} else {
							recurse(value);
						}
					} else {
						if (map) {
							result[key] = iteratee(value, key, current, path, object);
						} else {
							iteratee(value, key, current, path, object);
						}
					}
					path.pop();
				}
			}
			return result;
		};

		return recurse(object);
	};

	const mapArray = function(result, array, iteratee) {
		for (var i = 0; i < array.length; ++i) {
			result[i] = iteratee(array[i], i);
		}
	};

	return function(collection, types) {
		if (collection instanceof Array) {
			return {
				type: -1,
				replace: function(iteratee) {
					mapArray(collection, collection, iteratee);
					return collection;
				},
				map: function(iteratee) {
					const result = new Array(collection.length);
					mapArray(result, collection, iteratee);
					return result;
				}
			};
		}
		if (_.isPlainObject(collection)) {
			return {
				type: -2,
				replace: function(iteratee) {
					return mapObject(collection, iteratee, false, false);
				},
				map: function(iteratee) {
					return mapObject(collection, iteratee, true, false, true);
				},
				eachValuesDeep: function(iteratee) {
					return mapObject(collection, iteratee, false, true, false);
				}
			}
		}
		for (var i = 1; i < arguments.length; ++i) {
			if (types[i](collection)) {
				return {
					type: i
				};
			}
		}
		return {
			type: 0
		};
	}
});
