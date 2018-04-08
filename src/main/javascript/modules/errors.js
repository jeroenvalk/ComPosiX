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

_.module('errors', ['logging', 'searchPath', 'operation', 'swagger'], function (_, logging, searchPath, operation, swagger) {
	const logger = logging.getLogger(this), isInteger = Number.isInteger;

	if (_.isEmpty(searchPath.getCurrent())) {
		throw new Error();
	}

	const msg = {
		1: _.constant("not implemented"),
		2: _.constant("internal error"),
		3: function (param) {
			return "module not found: " + param.module + ": PATH=" + param.search.join(';');
		},
		10: function (param) {
			return "expected object but got: " + JSON.stringify(param);
		},
		11: function (param) {
			return "expected buffer but got: " + JSON.stringify(param);
		},
		12: _.constant("channel descriptor must be a number"),
		13: _.constant("writing to readable endpoint"),
		14: _.constant("reading from writable endpoint"),
		20: _.constant("pipe error"),
		21: function (param) {
			return "pipe.source: no plugin for type: " + param.type;
		},
		22: function (param) {
			return 'pipe.target: no plugin for type: ' + param.type;
		},
		23: function (param) {
			return 'pipe.source: invalid plugin for type: ' + param.type;
		},
		$ref: "resources/errors.yml"
	};

	const error = function error$error(errno, param) {
		var errors;
		if (isInteger(errno) && errno > 0) {
			switch (typeof msg[errno]) {
				case 'function':
					return new Error(msg[errno](param));
				case 'object':
					errors = swagger.typeCheck(param, msg[errno].scheme);
					if (errors.length > 0) {
						return new Error();
					}
					return new Error(_.template(msg[errno].template)(param));
				default:
					return new Error('ERRNO=' + errno + ": no error definition");
			}
		}
		return null;
	};

	const throwError = function error$throw(errno, param) {
		const e = error(errno, param);
		if (e) {
			throw e;
		}
	};

	_.mixin({
		error: error,
		throw: throwError
	});

	const request = function(options) {
		return operation.readJSON(operation.request(options));
	};

	const target = [], cache = {};

	const references = function(entity) {
		if (entity instanceof Object) {
			const ref = entity.$ref;
			if (ref && !(cache[ref] instanceof Error)) {
				target.push(entity);
			}
			_.each(entity, references);
		}
	};

	const recurse = function(entity) {
		target.length = 0;
		references(entity);
		if (target.length > 0) {
			const refs = _.map(target, function(value) {
				const ref = value.$ref;
				delete value.$ref;
				return ref;
			});
			return Promise.all(_.map(refs, function(ref) {
				if (cache[ref]) {
					return cache[ref];
				}
				return searchPath.resolve(ref).then(request).catch(function(e) {
					cache[ref] = e instanceof Error ? e : new Error();
					return {$ref: ref};
				});
			})).then(function(source) {
				return recurse(_.map(source, function(value, key) {
					return _.extend(target[key], value);
				}));
			});
		}
	};

	return recurse(msg).then(_.constant(msg));
});
