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

_.describe('ComPosiX', ['os', 'url', 'chai', 'searchPath'], function (_, os, url, chai, searchPath) {
	const workspace = url.resolve(_.ComPosiX.config('authority'), _.ComPosiX.config('pathname'));
	const expect = chai.expect;

	const then = function (value) {
		if (value instanceof Promise) {
			return value.then(function (value) {
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
			config: function () {
				expect(searchPath.getCurrent(workspace)).to.deep.equal([{
					protocol: "file:",
					hostname: "localhost",
					method: "OPTIONS",
					pathname: [
						_.ComPosiX.config('pathname'),
						_.ComPosiX.config('home.cpx.pathname'),
						'src/main/resources/'
					].join('')
				}]);

				const cpx = url.resolve(workspace, _.ComPosiX.config("home.cpx.pathname"));
				expect(searchPath.getCurrent(cpx)).to.deep.equal([{
					protocol: "file:",
					hostname: "localhost",
					method: "OPTIONS",
					pathname: [
						_.ComPosiX.config('pathname'),
						_.ComPosiX.config('home.cpx.pathname')
					].join('')
				}]);
			}
		}
	}
});
