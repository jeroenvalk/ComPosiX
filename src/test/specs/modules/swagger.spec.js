/**
 * Copyright © 2017, 2018 dr. ir. Jeroen M. Valk
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

_.describe(function (_) {
	return {
		name: "swagger",
		use: {
			NodeJS: ['chai.expect'],
			ComPosiX: ['swagger', 'channel', 'request']
		},
		it: {
			refreshPaths: function (expect, swagger, channel) {
				return new Promise(function(resolve, reject) {
					channel.read(swagger.refreshPaths({
						swagger: "2.0",
						info: {
							title: "Identity",
							version: "v1",
							contact: {
								name: "ComPosiX"
							}
						},
						schemes: ["https"],
						host: "localhost",
						basePath: "/",
						paths: {}
					}), Infinity, function (array) {
						try {
							expect(array[0].paths).to.deep.equal({
								"/identity/{uid}/at/{entity}": {
									"get": {
										"operationId": "computeUUIDv5"
									}
								},
								"/identity/uuid/{uuid}": {
									"get": {
										"operationId": "getUUIDv5"
									},
									"put": {
										"operationId": "putUUIDv5"
									}
								}
							});
							resolve();
						} catch(e) {
							reject(e);
						}
					});

				});
			}
		}
	};
});
