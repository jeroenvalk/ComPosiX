/**
 * Copyright © 2017, 2018 dr. ir. Jeroen M. Valk
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

_.module(function(_) {
	const split = function split(obj, chain) {
		var key, name, index;
		for (name in obj) {
			if (obj.hasOwnProperty(name)) {
				index = name.indexOf(".");
				if (index < 0) {
					key = name + ".";
					if (obj.hasOwnProperty(key)) {
						if (!(obj[key] instanceof Object)) {
							throw new Error(chain + key + ": object expected");
						}
					} else {
						obj[key] = {};
					}
				} else {
					key = name.substr(0, ++index);
					if (obj.hasOwnProperty(key)) {
						if (!(obj[key] instanceof Object)) {
							throw new Error(chain + key + ": object expected");
						}
					} else {
						obj[key] = {};
					}
					obj[key][name.substr(index)] = obj[name];
					delete obj[name];
				}
			}
		}
		for (key in obj) {
			if (obj.hasOwnProperty(key)) {
				split(obj[key], chain);
			}
		}
	};

	const normalize = function(object) {
		var key, name, obj;
		for (name in object) {
			if (object.hasOwnProperty(name)) {
				if (name.endsWith(".")) {
					obj = result[name];
					delete result[name];
					key = name.substr(0, name.length - 1);
					for (name in obj) {
						if (obj.hasOwnProperty(name)) {
							object[key][name] = obj[name];
						}
					}
				}
			}
		}
	};

	_.mixin({
		normalize: function () {
			const result = arguments[0];
			var key, name, obj;
			for (i = 0; i < arguments.length; ++i) {

			}
		}
	});
});
