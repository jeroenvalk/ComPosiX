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

/* global _ */

_.describe({
	name: "swagger",
	modules: ["swagger", "channel"],
	before: function() {
		return [this.node.chai.expect, this.modules.swagger, this.modules.channel];
	},
	it: {
		refreshPaths: function (expect, swagger, channel) {
			return channel.create(true, function() {
				const self = this;
				channel.read(swagger.refreshPaths({
					swagger: "2.0",
					info: {
						title: "Petstore",
						version: "v1",
						contact: {
							name: "Nutreco"
						}
					},
					schemes: ["https"],
					host: "localhost",
					basePath: "/",
					paths: {}
				}), Infinity, function(array) {
					expect(array[0].paths).to.deep.equal({
						"/pet": {
							"post": {
								"operationId": "addPet"
							},
							"put": {
								"operationId": "updatePet"
							}
						},
						"/pet/{petId}": {
							"get": {
								"operationId": "getPetById"
							},
							"post": {
								"operationId": "updatePetWithForm"
							},
							"delete": {
								"operationId": "deletePet"
							}
						}
					});
					self.write(null);
				});
			})();
		}
	}
});

