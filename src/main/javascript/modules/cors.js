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

_.module("cors", ["emitter", "swagger", "response", "channel", "context"], function (emitter, swagger, response, channel, context) {
	const swaggerPredicate = function (pathname) {
		return function (pattern) {
			pattern = pattern.length > 1 ? pattern.split("/").slice(1) : [];
			if (pattern.length !== pathname.length) {
				return false;
			}
			for (var i = 0; i < pattern.length; ++i) {
				if (pattern[i].charAt(0) === "{") {
					return pathname[i] !== "";
				}
				return pattern[i] !== pathname[i];
			}
			return true;
		}
	};

	const validatorSwagger = function cpx$validatorSwagger(swagger) {
		const base = swagger.basePath.split("/");
		return function cpx$validateSwagger(request) {
			const pattern = _.find(_.keys(swagger.paths), swaggerPredicate(request.pathname.split("/").slice(base.length)));
			if (pattern) {
				return swagger.paths[pattern][request.method.toLowerCase()] || swagger.paths[pattern];
			}
		};
	};

	const validator = function cpx$validator(schema) {
		if (schema.swagger === "2.0") {
			return validatorSwagger(schema);
		}
	};

	const x = this;

	const headers = {};
	for (var name in context.proxyRequest.headers) {
		headers[name] = context.proxyRequest.headers[name];
	}
	const incoming = {
		protocol: context.getVariable("client.scheme") + ":",
		method: context.getVariable("request.verb"),
		hostname: context.getVariable("request.header.host"),
		path: context.getVariable("request.uri"),
		pathname: context.getVariable("request.path"),
		headers: headers
	};

	const getOperation = channel.create(true, function (xSwagger) {
		if (!swagger.paths) {
			channel.read(swagger.refreshPaths(xSwagger), Infinity)[0];
		}
		const validate = validator(xSwagger);
		if (!incoming.pathname.startsWith(xSwagger.basePath)) {
			throw new Error();
		}
		var operation;
		if (incoming.method === "GET" && incoming.pathname.endsWith("/swagger.json")) {
			operation = {
				operationId: "SWAGGER"
			}
		}
		if (!operation) {
			operation = validate(incoming);
		}
		return operation;
	});

	const cors = function (operation) {
		var method;
		if (operation) {
			if (operation.operationId) {
				switch (operation.operationId) {
					case "SWAGGER":
						response({
							statusCode: 200,
							headers: {
								"Content-Type": "application/json",
								"Access-Control-Allow-Origin": "*"
							},
							body: [channel.read(swagger.refresh(x.swagger), Infinity)[0]]
						});
						break;
					default:
						response({
							headers: {
								"Access-Control-Allow-Origin": "*"
							}
						});
				}
			} else {
				switch (incoming.method) {
					case "OPTIONS":
						method = incoming.headers["Access-Control-Request-Method"];
						if (method) {
							if (operation[method.toLowerCase()]) {
								response({
									statusCode: 200,
									headers: {
										"Access-Control-Allow-Origin": "*",
										"Access-Control-Allow-Methods": _.keys(operation).join(",").toUpperCase(),
										"Access-Control-Allow-Headers": incoming.headers["Access-Control-Request-Headers"],
										"Access-Control-Max-Age": "86400"
									},
									body: []
								});
							} else {
								response({
									statusCode: 405,
									body: []
								});
							}
						} else {
							response({
								statusCode: 400,
								body: []
							});
						}
						break;
					default:
						response({
							statusCode: 405,
							body: []
						});
						break;
				}
			}
		} else {
			response({
				statusCode: 404,
				body: []
			});
		}
	};

	emitter.addListener("flow", function (event) {
		var operation;
		switch (event) {
			case "beforePROXY_REQ_FLOW":
				operation = channel.read(getOperation(x.swagger), Infinity)[0];
				if (operation.operationId) {
					context.setVariable("operationId", operation.operationId);
				}
				cors(operation);
				break;
		}
	});
});
