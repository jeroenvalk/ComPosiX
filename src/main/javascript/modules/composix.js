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

const _ = {};

(function () {
	context && context.setVariable("underscore", _);

	const slice = Array.prototype.slice;

	const extend = function cpx$extend(a) {
		var b = arguments.length;
		if (b < 2 || null === a) return a;
		for (var c = 1; c < b; c++) for (var d = arguments[c], e = d instanceof Object ? Object.keys(d) : [], f = e.length, g = 0; g < f; g++) {
			var h = e[g];
			a[h] = d[h];
		}
		return a;
	};

	const mixin = function cpx$mixin(a) {
		extend(_, a);
	};

	mixin({
		each: function cpx$each(array, iteratee) {
			if (array instanceof Array) {
				for (var i = 0; i < array.length; ++i) {
					iteratee(array[i], i);
				}
			} else {
				if (array instanceof Object) {
					for (var key in array) {
						if (array.hasOwnProperty(key)) {
							iteratee(array[key], key);
						}
					}
				}
			}
		},
		extend: extend,
		find: function cpx$find(array, predicate) {
			for (var i = 0; i < array.length; ++i) {
				if (predicate(array[i])) {
					return array[i];
				}
			}
		},
		flatten: function cpx$flatten(array) {
			var i, j, k = 0;
			for (i = 0; i < array.length; ++i) {
				if (array instanceof Array) {
					k += array[i].length
				} else {
					++k;
				}
			}
			const result = new Array(k); k = 0;
			for (i = 0; i < array.length; ++i) {
				if (array instanceof Array) {
					for (j = 0; j < array[i].length; ++j) {
						result[k++] = array[i][j];
					}
				} else {
					result[k++] = array[i];
				}
			}
			return result;
		},
		invert: function cpx$invert(entity) {
			const result = {};
			_.each(entity, function(value, key) {
				result[value + ''] = key;
			});
			return result;
		},
		isArray: function cpx$isArray(value) {
			return value instanceof Array;
		},
		isFunction: function cpx$isFunction(value) {
			return value instanceof Function;
		},
		isString: function cpx$isString(value) {
			return typeof value === "string";
		},
		keys: function cpx$keys(object) {
			return Object.keys(object);
		},
		map: function cpx$map(entity, iteratee) {
			const result = [];
			_.each(entity, function(value, key) {
				result.push(iteratee(value, key));
			});
			return result;
		},
		property: function cpx$property(key) {
			return function(object) {
				return object[key];
			}
		},
		propertyOf: function cpx$propertyOf(object) {
			return function(key) {
				return object[key];
			}
		},
		mixin: mixin,
		tail: function cpx$tail(array) {
			return slice.call(array, 1);
		},
		uniq: function cpx$uniq(entity) {
			return _.keys(_.invert(entity));
		},
		zipObject: function cpx$zipObject(keys, values) {
			const result = {};
			for (var i = 0; i < keys.length; ++i) {
				result[keys[i] + ''] = values[i];
			}
			return result;
		}
	});
})();
