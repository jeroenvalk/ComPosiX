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

_.module('request', function () {
	const mimeType = {
		".txt": "text/plain",
		".json": "application/json",
		".yaml": "application/x-yaml",
		".yml": "application/x-yaml",
		".js": "application/javascript"
	};

	return function cpx$request(options) {
		return _.require('request' + (options.protocol || 'https:').slice(0, -1).toUpperCase())(options, mimeType[options.pathname.substr(options.pathname.lastIndexOf('.'))]);
	};
});
