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

_.plugin(function(_) {
	const require = _.require, search = ["./modules","./plugins"];

	const recurse = function plugin$recurse(pathnames) {
		const pathname = pathnames.pop();
		if (pathname) {
			try {
				require.resolve(pathname);
				return pathname;
			} catch(e) {
				return recurse(pathnames);
			}
		}
		return null;
	};

	const resolve = function plugin$resolve(module) {
		const pathname = recurse(_.map(search, function(dir) {
			return [dir, module].join("/");
		}));
		if (!pathname) {
			_.throw(3, {
				module: module,
				search: search
			});
		}
		return {
			pathname: pathname,
			name: module
		};
	};

	_.mixin({
		require: function cpx$require(module) {
			return function(_) {
				const x = resolve(module);
				const underscore = global._;
				global._ = _;
				x.pathname && require(x.pathname);
				if (underscore) {
					global._ = underscore;
				} else {
					delete global._;
				}
			}
		}
	});
});
