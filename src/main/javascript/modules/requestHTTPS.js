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

_.module('requestHTTPS', ['https'], function(_, https) {
	return function(options, contentType) {
		return new Promise(function(resolve) {
			https.request(options, function (res) {
				const result = [];
				res.on("data", function (chunk) {
					result.push(chunk);
				});
				res.on("end", function () {
					resolve({
						statusCode: res.statusCode,
						headers: res.headers,
						body: {
							"contentType": contentType || res.headers['content-type'],
							"#": result
						}
					});
				});
			}).end(options.body ? options.body['#'] : undefined);
		});
	};
});
