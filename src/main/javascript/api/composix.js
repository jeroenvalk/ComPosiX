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

const _ = {};

(function () {
	context.setVariable("underscore", _);

	_.extend = function cpx$extend(a) {
		var b = arguments.length;
		if (b < 2 || null === a) return a;
		for (var c = 1; c < b; c++) for (var d = arguments[c], e = d instanceof Object ? Object.keys(d) : [], f = e.length, g = 0; g < f; g++) {
			var h = e[g];
			a[h] = d[h];
		}
		return a;
	};

	_.mixin = function cpx$mixin(a) {
		_.extend(_, a);
	};

	// module (basic version)
	_.mixin({
		module: function (func) {
			func();
		}
	});
})();
