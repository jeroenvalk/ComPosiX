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

_.describe('ComPosiX', ['os', 'url', 'chai', 'searchPath'], function(_, os, url, chai, searchPath) {
	const workspace = url.resolve("file://localhost", url.resolve(os.homedir() + "/", "Desktop/ComPosiX/"));
	const expect = chai.expect;

	const then = function(value) {
		if (value instanceof Promise) {
			return value.then(function(value) {
				return then(value);
			});
		}
		if (value instanceof Object) {
			if (value instanceof Error || value.type === 'response') {
				throw value;
			}
		}
		return value;
	};

	_.ComPosiX(true);

	return {
		it: {
			config: function() {
				console.log(searchPath.getCurrent());
				try {
					// by default no search paths are set in the workspace so we cannot search there
					searchPath.getCurrent(workspace);
				} catch(e) {
					expect(e).to.deep.equal({
						type: "response",
						statusCode: 404
					})
				}

				const cpx = url.resolve(workspace, _.ComPosiX.config("home.cpx.pathname"));
				expect(searchPath.getCurrent(cpx)).to.deep.equal([_.extend(_.pick(url.parse(cpx), "protocol", "hostname", "pathname"), {method: "OPTIONS"})]);
			}
		}
	}
});
