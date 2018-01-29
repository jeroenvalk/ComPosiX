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
	const slice = Array.prototype.slice, MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;

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

	const constant = function cpx$constant() {
			return function() {
				return value;
			};
		},
		isArray = function cpx$isArray(value) {
			return value instanceof Array;
		},
		isArrayLikeObject = function cpx$isArrayLikeObject(value) {
			if (value instanceof Object) {
				const size = value.length;
				return 0 <= size && size <= MAX_SAFE_INTEGER;
			}
			return false;
		},
		isFunction = function cpx$isFunction(value) {
			return value instanceof Function;
		},
		isPlainObject = function cpx$isPlainObject(value) {
			return value.constructor === Object;
		},
		isString = function cpx$isString(value) {
			return typeof value === "string";
		},
		toPath = function cpx$toPath(value) {
			if (isString(value)) {
				return value.split(".");
			}
			if (isArrayLikeObject(value)) {
				return value;
			}
			return [];
		};

	const keys = function cpx$keys(object) {
		return Object.keys(object);
	};

	const eachKey = function cpx$eachKey(collection, iteratee) {
		var key;
		if (isArray(collection)) {
			for (key = 0; key < collection.length; ++key) {
				iteratee(key);
			}
		} else {
			for (key in collection) {
				if (collection.hasOwnProperty(key)) {
					iteratee(key);
				}
			}
		}
	};

	const findKey = function cpx$findKey(collection, predicate) {
		var key;
		if (isArray(collection)) {
			for (key = 0; key < collection.length; ++key) {
				if (predicate(key)) return key;
			}
		} else {
			for (key in collection) {
				if (collection.hasOwnProperty(key)) {
					if (predicate(key)) return key;
				}
			}
		}
	};

	const reduceKey = function globals$reduceKey(collection, iteratee, accumulator) {
		eachKey(collection, function(key) {
			accumulator = iteratee(accumulator, key);
		});
		return accumulator;
	};

	const createIteratee = function cpx$createIteratee(collection, iteratee) {
		return function(key) {
			return iteratee(collection[key], key, collection);
		};
	};

	const reduceIteratee = function cpx$reduceIteratee(collection, iteratee) {
		return function(accumulator, key) {
			return iteratee(accumulator, collection[key], key, collection);
		};
	};

	mixin({
		each: function cpx$each(collection, iteratee) {
			eachKey(collection, createIteratee(collection, iteratee));
		},
		constant: constant,
		extend: extend,
		find: function cpx$find(array, predicate) {
			return findKey(collection, createIteratee(collection, predicate));
		},
		flatten: function cpx$flatten(array) {
			var i, j, k = 0;
			if (isArrayLikeObject(array)) {
				for (i = 0; i < array.length; ++i) {
					if (isArray(array[i])) {
						k += array[i].length
					} else {
						++k;
					}
				}
				const result = new Array(k);
				k = 0;
				for (i = 0; i < array.length; ++i) {
					if (isArray(array[i])) {
						for (j = 0; j < array[i].length; ++j) {
							result[k++] = array[i][j];
						}
					} else {
						result[k++] = array[i];
					}
				}
				return result;
			}
			return [];
		},
		invert: function cpx$invert(entity) {
			const result = {};
			eachKey(entity, function(key) {
				result[entity[key] + ''] = key;
			});
			return result;
		},
		isArray: isArray,
		isArrayLikeObject: isArrayLikeObject,
		isFunction: isFunction,
		isPlainObject: isPlainObject,
		isString: isString,
		keys: keys,
		map: function cpx$map(entity, iteratee) {
			const result = [];
			iteratee = createIteratee(entity, iteratee);
			eachKey(entity, function (key) {
				result.push(iteratee(key));
			});
			return result;
		},
		reduce: function cpx$reduce(collection, iteratee, accumulator) {
			return reduceKey(collection, reduceIteratee(collection, iteratee), accumulator);
		},
		property: function cpx$property(path) {
			path = toPath(path);
			const n = path.length;
			return n > 0 ? function (object) {
				for (var i = 0; i < n; ++i) {
					if (object) {
						object = object[path[i]];
					}
				}
				return object;
			} : constant();
		},
		propertyOf: function cpx$propertyOf(object) {
			return function (key) {
				return object[key];
			}
		},
		mixin: mixin,
		tail: function cpx$tail(array) {
			return slice.call(array, 1);
		},
		toPath: toPath,
		uniq: function cpx$uniq(entity) {
			return keys(_.invert(entity));
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
