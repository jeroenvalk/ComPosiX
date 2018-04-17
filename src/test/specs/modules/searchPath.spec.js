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

_.describe(['chai', 'searchPath'], function(_, chai, searchPath) {
	const expect = chai.expect;
	return {
		name: 'searchPath',
		it: {
			getCurrent: function() {
				expect(searchPath.getCurrent()).to.deep.equal({});
				try {
					expect(searchPath.getCurrent("file://localhost"));
					throw new Error();
				} catch(e) {
					expect(e).to.deep.equal({
						type: "response",
						statusCode: 404
					});
				}
			},
			postCurrent: function() {
				const options = {
					protocol: "file:",
					method: "OPTIONS",
					hostname: "localhost",
					pathname: __dirname + "/"
				};
				expect(searchPath.postCurrent("file://localhost", __dirname + "/")).to.deep.equal(options);
				expect(searchPath.getCurrent()).to.deep.equal({"file://localhost": [options]});
				expect(searchPath.getCurrent("file://localhost")).to.deep.equal([options]);
			},
			resolve: function() {
				const options = {
					protocol: "file:",
					method: "GET",
					hostname: "localhost",
					pathname: __dirname + "/searchPath.spec.js"
				};
				return searchPath.resolve("searchPath.spec.js").then(function(result) {
					expect(result).to.deep.equal(options);
				});
			}
		}
	}
});
