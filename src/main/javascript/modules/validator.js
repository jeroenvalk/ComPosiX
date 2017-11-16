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

_.module("validator", function () {
	const swaggerPredicate = function (pathname) {
		return function (pattern) {
			pattern = pattern.length > 1 ? pattern.split("/").slice(1) : [];
			if (pattern.length !== pathname.length) {
				return false;
			}
			for (var i = 0; i < pattern.length; ++i) {
				if (pattern[i].charAt(0) === "{") {
					return pathname[i] !== "";
				}
				return pattern[i] !== pathname[i];
			}
			return true;
		}
	};

	const validatorSwagger = function cpx$validatorSwagger(swagger) {
		const base = swagger.basePath.split("/");
		return function cpx$validateSwagger(request) {
			const pattern = _.find(_.keys(swagger.paths), swaggerPredicate(request.pathname.split("/").slice(base.length)));
			if (pattern) {
				return swagger.paths[pattern][request.method.toLowerCase()] || swagger.paths[pattern];
			}
		};
	};

	return function cpx$validator(schema) {
		if (schema.swagger === "2.0") {
			return validatorSwagger(schema);
		}
	};
});
