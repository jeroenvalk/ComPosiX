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

_.module("path", function () {
	const isAbsolute = function path$isAbsolute(pathname) {
		return pathname.charAt(0) === '/';
	};

	const join = function path$join() {
		return Array.prototype.join.call(arguments, "/").replace(/\/\//g, "/");
	};

	const normalize = function path$normalize(pathname, asArray) {
		if (pathname instanceof Array) {
			const result = [], isAbsolute = (pathname[0] === "");
			for (var i = 0; i < pathname.length; ++i) {
				switch (pathname[i]) {
					case "":
					case ".":
						break;
					case "..":
						result.pop();
						break;
					default:
						result.push(pathname[i]);
						break;
				}
			}
			return asArray ? result : (isAbsolute && !result.unshift("")) || result.join("/");
		}
		return normalize(pathname.split("/"), asArray);
	};

	const resolve = function path$resolve(pathname, asArray) {
		return normalize(pathname, asArray);
	};

	const toPath = function path$toPath(value) {
		var pathname = ".";
		if (value instanceof $) {
			value = value.closest("*[data-cpx");
			while (value.length) {
				pathname = join(value.attr("data-cpx"), pathname);
				if (isAbsolute(pathname)) {
					return toPath(pathname);
				}
				value = value.parent().closest("*[data-cpx]");
			}
			return;
		} else if (_.isString(value)) {
			if (value.charAt(0) === '/') {
				return resolve(value, true);
			}
		} else {
			return _.toPath(value);
		}
	};

	return {
		isAbsolute: isAbsolute,
		join: join,
		normalize: normalize,
		resolve: resolve,
		toPath: toPath
	};
});
