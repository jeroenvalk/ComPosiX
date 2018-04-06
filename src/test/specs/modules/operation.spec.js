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
				const empty = {}, array = [];
				expect(operation.readJSON()).to.equal(null);
				expect(operation.readJSON(empty)).to.equal(empty);
				expect(operation.readJSON(1, {"#": array})[1]).to.equal(array);
				return true;
			},
			request: function () {
				const self = this;
				expect(_.map([{
					protocol: "cpx:"
				}, {
					protocol: "file:", method: "POST"
				}, {
					protocol: "file:",
					method: "OPTIONS"
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

				operation.request({
					protocol: "file:",
					method: "GET",
					pathname: [__dirname, "operation.spec.js"].join("/")
				}).then(function() {
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
