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

_.module('requestFILE', ['fs'], function (_, fs) {
	return function (options, contentType) {
		switch (options.hostname) {
			case 'localhost':
				switch (options.method) {
					case "GET":
						return new Promise(function (resolve, reject) {
							fs.readFile(options.pathname, function (err, buffer) {
								if (err) {
									reject(err);
								} else {
									resolve({
										contentType: contentType,
										"#": [buffer]
									});
								}
							});
						});
					case "OPTIONS":
						return {
							type: "response",
							statusCode: 200
						};
					default:
						return {
							type: "response",
							statusCode: 405
						};
				}
		}
	};
});
