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

(function () {
	const x = {}, lib = {};

	const module = function cpx$module() {
		var name = null, deps = [], func = null;
		for (var i = 0; i < arguments.length; ++i) {
			if (_.isString(arguments[i])) {
				name = arguments[i];
			}
			if (_.isArray(arguments[i])) {
				deps = arguments[i];
			}
			if (_.isFunction(arguments[i])) {
				func = arguments[i];
			}
		}
		const res = func.apply(x, _.map(deps, _.propertyOf(lib)));
		if (name) {
			lib[name] = res;
		}
	};

	_.mixin({
		module: module
	});
})();
