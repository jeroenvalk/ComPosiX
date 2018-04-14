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

_.plugin(function (boot) {
	const bootRequire = boot.require, search = bootRequire.search;

	const recurse = function plugin$recurse(pathnames) {
		const pathname = pathnames.pop();
		if (pathname) {
			try {
				bootRequire.resolve(pathname);
				return pathname;
			} catch (e) {
				return recurse(pathnames);
			}
		}
		return null;
	};

	const resolve = function plugin$resolve(module) {
		const pathname = recurse(this.map(search, function (dir) {
			return [dir, module].join("/");
		}));
		if (!pathname) {
			try {
				bootRequire.resolve(module);
			} catch(e) {
				this.throw(3, {
					module: module,
					search: search
				});
			}
		}
		return pathname;
	};

	const require = function (module) {
		return function (_) {
			const resolved = resolve.call(_, module);
			if (resolved) {
				bootRequire.call(_, resolved);
			} else {
				_.module(module, function() {
					return bootRequire.call(_, module);
				});
			}
		};
	};

	const runInContext = function cpx$runInContext() {
		const _ = boot.runInContext();

		_.mixin({
			require: _.extend(function cpx$require(module) {
				return require(module);
			}, {
				search: search
			}),
			runInContext: runInContext
		});

		_.mixin(bootRequire.plugin);

		return _;
	};

	boot.extend(boot, {
		require: require
	});

	return runInContext();
});
