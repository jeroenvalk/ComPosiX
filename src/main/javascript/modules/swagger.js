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

_.module("swagger", ["request"], function (request) {
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
		_.each(swagger.paths, function (operations) {
			_.each(operations, function (operation) {
				todo.operations[operation.operationId] = [operation, request({
					method: "GET",
					url: [auth, "operations", org, operation.operationId + ".json"].join("/"),
					headers: {
						accept: "application/json"
					}
				})];
			});
		});
		_.each(todo.operations, function (operation) {
			_.extend(operation[0], resolve(operation[1]));
		});
		// resolve params
		_.each(swagger.paths, function (operations) {
			_.each(operations, function (operation) {
				const params = operation.parameters;
				for (var i = 0; i < params.length; ++i) {
					if (_.isString(params[i])) {
						if (!todo.params[params[i]]) {
							todo.params[params[i]] = request({
								method: "GET",
								url: [auth, "parameters", org, params[i] + ".json"].join("/"),
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
		_.each(todo.params, function (param, name) {
			swagger.parameters[name] = resolve(param);
		});
		// resolve definitions
		const resolveDefinition = function (key) {
			return function (object) {
				const type = object[key];
				if (type) {
					if (_.isString(type)) {
						if (!todo.definitions.hasOwnProperty(type)) {
							todo.definitions[type] = request({
								method: "GET",
								url: [auth, "definitions", org, type + ".json"].join("/"),
								headers: {
									accept: "application/json"
								}
							});
						}
						object[key] = {
							"$ref": "#/definitions/" + type
						};
					} else {
						recurse(type);
					}
				}
			};
		};

		const recurse = function (def) {
			switch (def.type) {
				case "object":
					_.each(_.keys(def.properties), function (key) {
						resolveDefinition(key)(def.properties);
					});
					break;
				case "array":
					resolveDefinition("items")(def);
					break;
			}
		};

		_.each(swagger.paths, function (operations) {
			_.each(operations, function (operation) {
				_.each(operation.params, resolveDefinition("schema"));
				_.each(operation.responses, resolveDefinition("schema"));
			});
		});
		if (!swagger.definitions) {
			swagger.definitions = {};
		}
		var done = false;
		while (!done) {
			done = true;
			_.each(todo.definitions, function (definition, type) {
				if (definition) {
					const def = resolve(definition);
					swagger.definitions[type] = def;
					todo.definitions[type] = null;
					recurse(def);
					done = false;
				}
			});
		}
		return swagger;
	};

	return {
		refreshPaths: function() {
			return _.extend(x.swagger, resolve(request(reqSwagger)));
		},
		refresh: function() {
			return _.extend(x.swagger, getSwagger(resolve(request(reqSwagger))));
		}
	};
});
