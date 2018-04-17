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

_.module('searchPath', ['url', 'operation'], function (_, url, op) {
	const cache = {};

	const getCurrent = function searchPath$getCurrent(baseURL) {
		if (baseURL) {
			if (cache[baseURL]) {
				return cache[baseURL];
			}
			throw {
				type: "response",
				statusCode: 404
			};
		}
		return cache;
	};

	const postCurrent = function searchPath$postCurrent(baseURL, pathname, body) {
		var options = cache[baseURL];
		if (!options) {
			options = cache[baseURL] = [];
		}
		if (!body) {
			body = {method: "OPTIONS"};
		}
		body = _.pick(_.extend(body, pathname && url.parse(url.resolve(baseURL, pathname))), ['protocol', 'method', 'hostname', 'pathname']);
		options.push(body);
		return body;
	};

	const resolve = function searchPath$resolve(pathname, baseURL) {
		var options = baseURL && cache[baseURL];
		if (!options) {
			options = cache[_.keys(cache)[0]];
		}
		if (options) {
			const req = _.map(options, function (options) {
				options = _.clone(options);
				options.pathname = url.resolve(options.pathname, pathname);
				return options;
			});
			return Promise.all(_.map(req, function (options) {
				return op.request(options);
			})).then(function (res) {
				for (var i = 0; i < res.length; ++i) {
					if (res[i].statusCode === 200) {
						return _.extend(req[i], {method: "GET"});
					}
				}
			});
		}
		return Promise.reject({
			type: "response",
			statusCode: 400,
			body: {
				baseURL: baseURL || null
			}
		});
	};

	return _.extend(function(func) {
		return op('read', 'then', func);
	}, {
		getCurrent: getCurrent,
		postCurrent: postCurrent,
		resolve: resolve
	});
});
