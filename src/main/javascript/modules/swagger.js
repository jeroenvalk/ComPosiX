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
	const org = x.swagger.info.contact.name;
	const reqSwagger = {
		method: "GET",
		url: [auth, "swagger", org, x.swagger.info.title + ".json"].join("/"),
		headers: {
			accept: "application/json"
		}
	};

	const bodyOf = _.property("body.0");

	const resolve = function (promise) {
		var result;
		promise.then(function (res) {
			result = res.body;
		});
		return result;
	};

	const getSwagger = function (swagger) {
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

	const rch = channel.create(true);

	const result = function (node) {
		return function () {
			node.apply(result, arguments);
			channel.write(rch.wr, null);
			return rch.rd;
		}
	};
	result.write = function () {
		channel.write(rch.wr, _.flatten(arguments));
	};

	const refreshPaths = result(function () {
		const self = this;
		channel.write(wr, reqSwagger);
		channel.write(wr, null);
		channel.read(rd, Infinity, function(array) {
			self.write(_.extend(x.swagger, bodyOf(array[0])));
			self.write(null);
		});
	});

	const refresh = result(function() {
		const self = this;
		channel.write(wr, reqSwagger);
		channel.write(wr, null);
		channel.read(rd, Infinity, function(array) {
			self.write(_.extend(x.swagger, getSwagger(bodyOf(array[0]))));
			self.write(null);
		});
	});

	return {
		refreshPaths: function() {
			channel.write(wr, reqSwagger);
			channel.write(wr, null);
			_.extend(x.swagger, bodyOf(channel.read(rd, Infinity)[0]));
		},
		refresh: function () {
			return _.extend(x.swagger, getSwagger(resolve(request(reqSwagger))));
		}
	};
});
