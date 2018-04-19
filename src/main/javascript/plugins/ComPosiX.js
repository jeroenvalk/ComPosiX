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

_.plugin(function (_) {
	const customizer = function (objValue, srcValue) {
		if (_.isArray(objValue)) {
			return objValue.concat(srcValue);
		}
	};

	const getValue = function (object, path, defaultValue) {
		if (path) {
			const result = _.get(object, path, defaultValue);
			if (result instanceof Object) {
				return;
			}
			return result;
		}
		return _.cloneDeep(object);
	};

	const resolveHome = function (suffix, base) {
		if (suffix.startsWith('~')) {
			const home = suffix.split('/', 1)[0].substr(1);
			return [home ? config.home[home].pathname : base, suffix.substr(home.length + 2)];
		}
	};

	const pathResource = function (func) {
		_.eachRight(config.search.resources, func);
	};

	const eachHome = function (func) {
		_.each(config.home, function (value, home) {
			func(home);
		});
	};

	const pathHome = function (home, func) {
		home = config.home[home];
		_.eachRight(home.search, function (suffix) {
			func(home.pathname, suffix);
		});
	};

	const config = {};

	const configure = function cpx$configure(conf) {
		return _.mergeWith(config, conf, customizer);
	};

	const require = _.require;

	const resolve = function cpx$resolve(module) {
		const search = ComPosiX.search;
		for (var i = 0; i < search.length; ++i) {
			const pathname = [search[i], module].join("/");
			try {
				require.resolve(pathname);
				return pathname;
			} catch (e) {
				continue;
			}
		}
		try {
			require.resolve(module);
		} catch (e) {
			_.throw(3, {
				module: module,
				search: search
			});
		}
	};

	const cpxRequire = function cpx$require(module) {
		const _ = this;
		const resolved = resolve(module);
		if (resolved) {
			return require(resolved);
		} else {
			_.module(module, function () {
				return require(module);
			});
		}
	};

	var plugins, mixin;

	const ComPosiX = function ComPosiX() {
		for (var i = 0; i < arguments.length; ++i) {
			if (!plugins) {
				if (_.isPlainObject(arguments[i])) {
					configure(arguments[i]);
					continue;
				} else {
					ComPosiX.search = _.reverse(_.map(config.search.sources, function (source) {
						if (source.startsWith('~')) {
							return config.pathname + resolveHome(source, "./").join('');
						}
						return source;
					}));
					plugins = _.mapValues(config.plugins, function (value, key) {
						if (value) {
							const result = _.require(key);
							if (!result) {
								throw new Error();
							}
							return result
						}
					});
					mixin = {
						require: _.plugin.require,
						plugin: _.plugin
					};
				}
			}
			if (!this.plugin) {
				this.mixin(mixin);
			}
			if (_.isString(arguments[i])) {
				plugins[arguments[i]].call(null, this);
			}
		}
		return this;
	};

	ComPosiX.require = cpxRequire;
	ComPosiX.resolveHome = resolveHome;
	ComPosiX.eachHome = eachHome;
	ComPosiX.pathResource = pathResource;
	ComPosiX.pathHome = pathHome;
	ComPosiX.config = _.curry(getValue, 2)(config);

	_.mixin({
		ComPosiX: ComPosiX
	});
});
