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

	const indexOf = {s: 0, o: 1, f: 2};

	const groupArguments = function (argv) {
		const result = new Array(3);
		for (var i = 0; i < argv.length; ++i) {
			const index = indexOf[(typeof argv[i]).charAt(0)];
			if (!isNaN(index)) {
				result[index] = argv[i];
			}
		}
		return result;
	};

	var url;

	const resolveHome = function (suffix, base) {
		if (suffix.startsWith('~')) {
			const home = suffix.split('/', 1)[0].substr(1);
			return [home ? config.home[home].pathname : base, suffix.substr(home.length + 2)];
		}
	};

	const pathResource = function(func) {
		_.eachRight(config.search.resources, func);
	};

	const eachHome = function(func) {
		_.each(config.home, function(value, home) {
			func(home);
		});
	};

	const pathHome = function(home, func) {
		home = config.home[home];
		_.eachRight(home.search, function(suffix) {
			func(home.pathname, suffix);
		});
	};

	const config = {};

	const configure = function cpx$configure(conf) {
		return _.mergeWith(config, conf, customizer);
	};

	const bootstrap = function cpx$bootstrap() {
		const require = _.require;
		url = require('url');

		const search = _.reverse(_.map(config.search.sources, function (source) {
			if (source.startsWith('~')) {
				return url.resolve(config.pathname, resolveHome(source, "./").join(''));
			}
			return source;
		}));

		const resolve = function cpx$resolve(module) {
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

		_.ComPosiX.groupArguments = groupArguments;
		_.ComPosiX.resolve = resolve;
		_.ComPosiX.resolveHome = resolveHome;
		_.ComPosiX.eachHome = eachHome;
		_.ComPosiX.pathResource = pathResource;
		_.ComPosiX.pathHome = pathHome;
		_.ComPosiX.config = _.curry(getValue, 2)(config);

		const bootRequire = function(module) {
			global._ = this;
			const result = require(module);
			global._ = _;
			return result;
		};

		_.mixin({
			plugin: function cpx$plugin() {
				const argv = groupArguments(arguments);
				argv[2].apply(this, _.concat(_, _.map(argv[1], require)));
			},
			require: function (module) {
				const _ = this;
				const resolved = resolve.call(_, module);
				if (resolved) {
					bootRequire.call(_, resolved);
				} else {
					_.module(module, function () {
						return bootRequire.call(_, module);
					});
				}
			}
		});

		_.require('plugin');

		_.each(config.plugins, function (value, key) {
			if (value) {
				plugins[key] = _.require(key);
				if (!plugins[key]) {
					throw new Error();
				}
			}
		});
	};

	const plugins = {};
	var mixin;

	_.mixin({
		ComPosiX: function ComPosiX() {
			for (var i = 0; i < arguments.length; ++i) {
				if (!this.plugin) {
					this.mixin(mixin);
				}
				if (_.isString(arguments[i])) {
					if (!plugins[arguments[i]]) {
						if (config.plugins[arguments[i]]) {
							bootstrap.call(null, this);
						} else {
							throw new Error('not configured: ' + arguments[i]);
						}
					}
					plugins[arguments[i]].call(null, this);
				}
				if (!mixin) {
					if (_.isPlainObject(arguments[i])) {
						configure(arguments[i]);
					} else {
						mixin = {
							require: _.plugin.require,
							plugin: _.plugin
						};
					}
				}
			}
			return this;
		}
	});

});
