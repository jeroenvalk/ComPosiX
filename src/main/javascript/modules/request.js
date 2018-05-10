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

_.module('request', function (_) {
	const mimeType = {
		".txt": "text/plain",
		".json": "application/json",
		".yaml": "application/x-yaml",
		".yml": "application/x-yaml",
		".js": "application/javascript"
	};

	const normalize = function cpx$request$normalize(response) {
		if (response instanceof Object) {
			if (response.type !== "response") {
				response = {
					statusCode: 200,
					body: response['#'] ? response : {
						contentType: "application/json",
						"#": [Buffer.from(JSON.stringify(response))]
					}
				};
			}
		} else {
			response = {
				statusCode: 204
			};
		}
		return response;
	};

	const getBody = function cpx$request$getBody(response) {
		if (response instanceof Object) {
			if (response.type === "response") {
				return response.body;
			}
			return response;
		}
		return null;
	};

	const bodyToObject = function cpx$request$bodyToObject(body) {
		if (body && body['#']) {
			switch (body.contentType) {
				case "application/json":
					return _.require("jsonToObject")(body['#']);
				case "application-x-yaml":
					return _.require("yamlToObject")(body['#']);
				default:
					return _.require("anyToObject")(body['#']);
			}
		}
		return body;
	};

	return _.extend(function cpx$request(options) {
		try {
			const plugin = _.require('request' + (options.protocol || 'https:').slice(0, -1).toUpperCase());
			return plugin(options, mimeType[options.pathname.substr(options.pathname.lastIndexOf('.'))]);
		} catch (e) {
			console.log(e);
			return {
				type: "response",
				statusCode: 500
			};
		}
	}, {
		normalize: normalize,
		getBody: getBody,
		bodyToObject: bodyToObject
	});
});
