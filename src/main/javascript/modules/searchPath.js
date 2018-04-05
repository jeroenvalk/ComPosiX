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

_.module('searchPath', ['operation'], function (_, op) {
	const url = require('url');
	const cache = {};

	const getCurrent = function searchPath$getCurrent(baseURL) {
		return cache[baseURL] || {
			type: "response",
			statusCode: 404
		};
	};

	const postCurrent = function searchPath$postCurrent(baseURL, pathname, body) {
		var options = cache[baseURL];
		if (!options) {
			options = cache[baseURL] = [];
		}
		const closure = function(body) {
			if (options) {
				body = _.pick(_.extend(body, pathname && url.parse(url.resolve(baseURL, pathname))), ['protocol', 'method', 'hostname', 'pathname']);
				options.push(body);
				return body;
			}
			return {
				type: "response",
				statusCode: 404
			};
		};
		if (body['#']) {
			return op.readJSON(body).then(closure);
		}
		return closure(body);
	};

	const resolve = function searchPath$resolve(baseURL, pathname) {
		const options = cache[baseURL];
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
		return {
			type: "response",
			statusCode: 404
		};
	};

	return {
		getCurrent: getCurrent,
		postCurrent: postCurrent,
		resolve: resolve
	};
});