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

_.module(["emitter", "validator", "request", "response"], function (emitter, validator, request, response) {
	const x = this;

	const auth = "https://raw.githubusercontent.com/jeroenvalk/swagger/master/src";
	const org = x.swagger.info.contact.name;
	const reqSwagger = {
		method: "GET",
		url: [auth, "swagger", org, x.swagger.info.title + ".json"].join("/"),
		headers: {
			accept: "application/json"
		}
	};

	const incoming = {
		protocol: context.getVariable("client.scheme") + ":",
		method: context.getVariable("request.verb"),
		hostname: context.getVariable("request.header.host"),
		path: context.getVariable("request.uri"),
		pathname: context.getVariable("request.path")
	};

	const resolve = function (promise) {
		var result;
		promise.then(function (res) {
			result = res.body;
		});
		return result;
	};

	const getSwagger = function (swagger) {
		const todo = {
			operations: {},
			params: {},
			definitions: {}
		};
		// resolve operations
		_.each(swagger.paths, function(operations) {
			_.each(operations, function(operation) {
				todo.operations[operation.operationId] = [operation, request({
					method: "GET",
					url: [auth, "operations", org, operation.operationId + ".json"].join("/"),
					headers: {
						accept: "application/json"
					}
				})];
			});
		});
		_.each(todo.operations, function(operation) {
			_.extend(operation[0], resolve(operation[1]));
		});
		// resolve params
		_.each(swagger.paths, function(operations) {
			_.each(operations, function(operation) {
				const params = operation.parameters;
				for (var i = 0; i < params.length; ++i) {
					if (_.isString(params[i])) {
						if (!todo.params[params[i]]) {
							todo.params[params[i]] = request({
								method: "GET",
								url: [auth, "parameters", org, param[i] + ".json"].join("/"),
								headers: {
									accept: "application/json"
								}
							});
						}
						params[i] = {
							"$ref": "#/parameters/" + params[i]
						};
					}
				}
			});
		});
		if (!swagger.parameters) {
			swagger.parameters = {};
		}
		_.each(todo.params, function(param, name) {
			swagger.parameters[name] = resolve(param);
		});
		// resolve definitions
		_.each(swagger.paths, function(operations) {
			_.each(operations, function(operation) {
				const resolveDefinition = function(object) {
					const type = object.schema;
					if (_.isString(type)) {
						if (!todo.definitions[type]) {
							todo.definitions[type] = request({
								method: "GET",
								url: [auth, "definitions", org, type + ".json"].join("/"),
								headers: {
									accept: "application/json"
								}
							});
						}
						object.schema = {
							"$ref": "#/definitions/" + type
						};
					}
				};
				_.each(operation.params, resolveDefinition);
				_.each(operation.responses, resolveDefinition);
			});
		});
		if (!swagger.definitions) {
			swagger.definitions = {};
		}
		_.each(todo.definitions, function(definition, type) {
			swagger.definitions[type] = resolve(definition);
		});
		return swagger;
	};

	const getOperation = function (swagger) {
		const validate = validator(swagger);
		if (!incoming.pathname.startsWith(x.swagger.basePath)) {
			throw new Error();
		}
		var operation = validate(incoming);
		if (!operation) {
			if (incoming.method === "GET" && incoming.pathname.endsWith("/swagger.json")) {
				operation = {
					operationId: "SWAGGER"
				};
			}
		}
		return operation;
	};

	const cors = function (operation) {
		if (operation) {
			if (operation.operationId) {
				switch (operation.operationId) {
					case "SWAGGER":
						response({
							statusCode: 200,
							headers: {
								"Access-Control-Allow-Origin": "*",
								"Access-Control-Allow-Methods": "GET",
								"Access-Control-Max-Age": "3628800"
							},
							body: _.extend(x.swagger, getSwagger(resolve(request(reqSwagger))))
						});
						break;
				}
			} else {
				switch (request.method) {
					case "OPTIONS":
						response({
							statusCode: 200,
							headers: {
								"Access-Control-Allow-Origin": "*",
								"Access-Control-Allow-Methods": _.keys(operation).join(",").toUpperCase(),
								"Access-Control-Allow-Headers": "Content-Type,Authorization",
								"Access-Control-Max-Age": "3628800"
							}
						});
						break;
					default:
						response({
							statusCode: 405,
							headers: {
								"Access-Control-Allow-Origin": "*",
								"Access-Control-Allow-Methods": _.keys(operation).join(",").toUpperCase(),
								"Access-Control-Max-Age": "3628800"
							}
						});
						break;
				}
			}
		} else {
			response({
				statusCode: 400,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Max-Age": "3628800"
				}
			});
		}
	};

	emitter.addListener("flow", function (event) {
		var operation;
		switch (event) {
			case "beforePROXY_REQ_FLOW":
				if (!x.swagger.paths) {
					_.extend(x.swagger, resolve(request(reqSwagger)));
				}
				operation = getOperation(x.swagger);
				context.setVariable("operation", JSON.stringify(operation));
				cors(operation);
				if (operation.operationId) {
					context.setVariable("operationId", operation.operationId);
				}
				break;
		}
	});
});
