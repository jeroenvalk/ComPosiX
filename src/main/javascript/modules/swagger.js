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
	const x = _.ComPosiX();

	if (!x.swaggerURL) {
		x.swaggerURL = "https://raw.githubusercontent.com/jeroenvalk/ComPosiX/master/src/main/swagger/petstore.json";
	}

	if (!x.swagger) {
		_.request({
			method: "GET",
			url: x.swaggerURL,
			headers: {
				accept: "application/json"
			}
		}).then(function (response) {
			x.swagger = response.body;
		});
	}
});

_.module(function () {
	const emitter = _.emitter();
	const x = _.ComPosiX();

	const validate = _.validator(x.swagger);

	emitter.addListener("request", function (request) {
		var operation = validate(request);
		if (!operation) {
			if (request.method === "GET" && request.pathname.endsWith("/swagger.json")) {
				operation = {
					operationId: "SWAGGER"
				};
			}
		}
		if (operation) {
			switch(operation.operationId) {
				case "SWAGGER":
					_.response({
						statusCode: 200,
						headers: {
							"Access-Control-Allow-Origin": "*",
							"Access-Control-Allow-Methods": "GET",
							"Access-Control-Max-Age": "3628800"
						},
						body: x.swagger
					});
					break;
				default:
					switch(request.method) {
						case "OPTIONS":
							_.response({
								statusCode: 200,
								headers: {
									"Access-Control-Allow-Origin": "*",
									"Access-Control-Allow-Methods": "GET,POST",
									"Access-Control-Allow-Headers": "Authorization",
									"Access-Control-Max-Age": "3628800"
								}
							});
							break;
					}
			}
		}
	});

	if (x.swagger) {
		emitter.emit("request", {
			protocol: context.getVariable("client.scheme") + ":",
			method: context.getVariable("request.verb"),
			hostname: context.getVariable("request.header.host"),
			path: context.getVariable("request.uri"),
			pathname: context.getVariable("request.path")
		});
	}
});