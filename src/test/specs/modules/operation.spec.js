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

_.describe(['chai', 'operation'], function (_, chai, operation) {
	const expect = chai.expect;
	return {
		name: 'operation',
		it: {
			readArrayJSON: function () {
				const empty = [], array = [{}, {"#": empty}];
				expect(operation.readArrayJSON(empty)).to.equal(empty);
				expect(empty).to.deep.equal([]);
				expect(operation.readArrayJSON(array)).to.equal(array);
				expect(array).to.deep.equal([{}, []]);
				return true;
			},
			readJSON: function () {
				const self = this, empty = {}, array = [];
				expect(operation.readJSON()).to.equal(null);
				expect(operation.readJSON(empty)).to.equal(empty);
				expect(operation.readJSON(1, {"#": array})[1]).to.equal(array);

				operation.request({
					method: "GET",
					protocol: "file:",
					hostname: "localhost",
					pathname: [__dirname, "../../../main/swagger/definitions/IterationContext.yml"].join("/")
				}).then(function(result) {
					expect(operation.readJSON(result)).to.deep.equal({
						type: "object",
						properties: {
							type: {
								type: "string",
								default: "iterationContext",
								enum: ["iterationContext", "iC"]
							},
							value: {},
							key: {
								type: "string"
							},
							object: {
								anyOf: [{
									type: "object"
								}, {
									type: "array"
								}]
							}
						}
					});
					self.write(null);
				}).catch(function(e) {
					self.write(e);
					self.write(null);
				});
			},
			request: function () {
				const self = this;
				expect(_.map([{
					protocol: "cpx:",
					hostname: "localhost"
				}, {
					method: "POST",
					protocol: "file:",
					hostname: "localhost"
				}, {
					method: "OPTIONS",
					protocol: "file:",
					hostname: "localhost"
				}], function(options) {
					return operation.request(options);
				})).to.deep.equal([{
					type: "response",
					statusCode: 500
				}, {
					type: "response",
					statusCode: 405
				}, {
					type: "response",
					statusCode: 200
				}]);

				operation.request([{
					method: "GET",
					protocol: "file:",
					hostname: "localhost",
					pathname: [__dirname, "operation.spec.js"].join("/")
				}, {
					method: "GET",
					protocol: "file:",
					hostname: "localhost",
					pathname: [__dirname, "../../../main/swagger/Operation.yml"].join("/")
				}]).then(function(result) {
					expect(result.constructor).to.equal(Array);
					expect(result.length).to.equal(2);

					expect(result[0].contentType).to.equal("application/javascript");
					expect(result[0]['#'].constructor).to.equal(Array);
					_.each(result[0]['#'], function(buffer) {
						expect(buffer).to.be.an.instanceof(Buffer);
					});

					expect(result[1].contentType).to.equal("application/x-yaml");
					expect(result[0]['#'].constructor).to.equal(Array);
					_.each(result[0]['#'], function(buffer) {
						expect(buffer).to.be.an.instanceof(Buffer);
					});

					self.write(null);
				});
			},
			execute: function() {
				const array = [];
				expect(operation.execute({
					type: "request",
					operationId: "operation$readArrayJSON",
					param: {
						body: array
					}
				})).to.equal(array);
				expect(array).to.deep.equal([]);
				return true;
			}
		}
	}
});
