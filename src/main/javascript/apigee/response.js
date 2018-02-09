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

_.module("response", ["emitter"], function (_, emitter) {
	const x = this;

	emitter.addListener("flow", function (event) {
		if (x.response) {
			switch (event) {
				case "afterERROR":
					if (x.response.statusCode) {
						context.setVariable("error.status.code", x.response.statusCode);
					}
					if (x.response.headers) {
						_.each(x.response.headers, function (value, key) {
							context.setVariable("error.header." + key, value);
						});
					}
					if (_.isArray(x.response.body)) {
						context.setVariable("error.content", x.response.body[0] ? JSON.stringify(x.response.body[0]) : "");
					}
					break;
			}
		}
	});

	return function cpx$response(response) {
		x.response = response;
		if (response.statusCode) {
			throw new Error();
		}
	};
});
