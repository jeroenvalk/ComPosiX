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

// extracted from remedial: https://www.npmjs.com/package/remedial

_.module('typeOf', function () {
	var classes = "Boolean Number String Function Array Date RegExp Object".split(" "), i, name, class2type = {};

	for (i in classes) {
		if (classes.hasOwnProperty(i)) {
			name = classes[i];
			class2type["[object " + name + "]"] = name.toLowerCase();
		}
	}

	return function typeOf(obj) {
		return (null === obj || undefined === obj) ? String(obj) : class2type[Object.prototype.toString.call(obj)] || "object";
	};
});
