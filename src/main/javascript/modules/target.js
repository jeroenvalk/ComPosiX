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

_.module('target', ['globals', 'channel'], function (_, globals, channel) {
	const objectTarget = _.extend(globals('target.object'), {
		undefined: function (obj) {
			return {
				amount: 1, // TODO: better set to NaN
				write: _.unary(obj.write),
				end: function () {
					if (obj.end) {
						obj.end();
					} else {
						obj.write(null);
					}
				}
			}
		}
	});

	const targetObject = function target$object(obj) {
		return objectTarget[obj.type](obj);
	};

	const targetFunction = function target$function(func) {
		var wr, callback, argv;

		const createChannel = function (objectMode) {
			const result = channel.create(objectMode);
			callback(result.rd);
			return result.wr;
		};

		return {
			result: new Promise(function (resolve) {
				callback = resolve;
			}),
			amount: Infinity,
			write: function (array) {
				argv = array;
			},
			end: function () {
				var result = func.call(func, argv);
				if (result instanceof Array) {
					if (!(result[0] instanceof Array)) {
						result = [result];
					}
				} else {
					result = [[result]];
				}
				if (!wr) {
					switch (typeof result[0][0]) {
						case 'string':
							wr = createChannel(false);
							break;
						case 'object':
							wr = createChannel(true);
							break;
					}
				}
				for (i = 0; i < result.length; ++i) {
					channel.write(ch.wr, result[i]);
					channel.write(ch.wr, null);
				}
			}
		}
	};

	_.extend(globals('pipe.target'), {
		object: targetObject,
		function: targetFunction
	});
});
