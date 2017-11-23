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

_.module("swagger", ["channel", "request"], function (channel, request) {
	const x = this, rd = request.rd, wr = request.wr;

	const auth = "https://raw.githubusercontent.com/jeroenvalk/swagger/master/src";
	const bodyOf = _.property("body.0");
	var org;

	const resolve = function (promise) {
		var result;
		promise.then(function (res) {
			result = res.body;
		});
		return result;
	};

	const getSwagger = function (swagger) {
		const self = this;
		const todo = {
			operations: {
				source: [],
				target: []
			},
			params: {},
			definitions: {}
		};

		const resolveDefinition = function (key) {
			return function (object) {
				const type = object[key];
				if (type) {
					if (_.isString(type)) {
						if (!todo.definitions.hasOwnProperty(type)) {
							todo.definitions[type] = {
								method: "GET",
								url: [auth, "definitions", org, type + ".json"].join("/"),
								headers: {
									accept: "application/json"
								}
							};
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

		// resolve operations
		_.each(swagger.paths, function (operations) {
			_.each(operations, function (operation) {
				todo.operations.source.push(operation);
				channel.write(wr, {
					method: "GET",
					url: [auth, "operations", org, operation.operationId + ".json"].join("/"),
					headers: {
						accept: "application/json"
					}
				});
			});
		});
		channel.write(wr, null);
		// TODO: make first resolve async
		todo.operations.target = _.map(channel.read(rd, Infinity), bodyOf);
		if (todo.operations.source.length !== todo.operations.target.length) {
			throw new Error("source target " + todo.operation.source.length + " " + todo.operation.target.length);
		}
		_.each(todo.operations.source, function (operation, index) {
			_.extend(operation, todo.operations.target[index]);
		});
		// resolve params
		_.each(swagger.paths, function (operations) {
			_.each(operations, function (operation) {
				const params = operation.parameters;
				for (var i = 0; i < params.length; ++i) {
					if (_.isString(params[i])) {
						if (!todo.params[params[i]]) {
							todo.params[params[i]] = {
								method: "GET",
								url: [auth, "parameters", org, params[i] + ".json"].join("/"),
								headers: {
									accept: "application/json"
								}
							};
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
		// TODO: make second resolve async
		_.each(todo.params, function (value, key) {
			swagger.parameters[key] = resolve(request(value));
		});

		// resolve definitions
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
					// TODO: make third resolve async
					const def = resolve(request(definition));
					swagger.definitions[type] = def;
					todo.definitions[type] = null;
					recurse(def);
					done = false;
				}
			});
		}
		return swagger;
	};

	const loadSwagger = channel.create(true, function(swagger) {
		org = swagger.info.contact.name;
		channel.write(wr, {
			method: "GET",
			url: [auth, "swagger", org, swagger.info.title + ".json"].join("/"),
			headers: {
				accept: "application/json"
			}
		});
		channel.write(wr, null);
		return bodyOf(channel.read(rd, Infinity)[0]);
	});

	return {
		refreshPaths: function(swagger) {
			return _.extend(swagger, channel.read(loadSwagger(swagger), Infinity)[0]);
		},
		refresh: function (swagger) {
			return _.extend(swagger, getSwagger(channel.read(loadSwagger(swagger), Infinity)[0]));
		}
	};
});
