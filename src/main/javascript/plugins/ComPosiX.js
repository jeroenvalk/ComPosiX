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

	const config = {}, plugins = {};

	const initialize = function (searchPath) {
		const authority = url.resolve(config.authority, config.pathname);
		_.eachRight(config.search.resources, function (suffix) {
			const part = resolveHome(suffix, "./");
			searchPath.postCurrent(authority, url.resolve(part[0], part[1]));
		});
		_.each(config.home, function (home) {
			_.eachRight(home.search, function (suffix) {
				const part = resolveHome(suffix, home.pathname);
				searchPath.postCurrent(url.resolve(authority, part[0]), part[1]);
			});
		});
	};

	const configure = function cpx$configure(conf) {
		return _.mergeWith(config, conf, customizer);
	};

	const bootstrap = function cpx$bootstrap(require) {
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
		_.ComPosiX.config = _.curry(getValue, 2)(config);

		_.mixin({
			plugin: function cpx$plugin() {
				const argv = groupArguments(arguments);
				argv[2].apply(this, _.concat(_, _.map(argv[1], require)));
			},
			require: function (module) {
				global._ = this;
				const result = require(module);
				global._ = _;
				return result;
			}
		});

		require(resolve('require'));
		require(resolve('plugin'));

		_.each(config.plugins, function (value, key) {
			if (value) {
				plugins[key] = _.require(key);
			}
		});
	};

	var mixin;

	_.mixin({
		ComPosiX: function ComPosiX() {
			for (var i = 0; i < arguments.length; ++i) {
				if (mixin) {
					if (!this.plugin) {
						this.mixin(mixin);
					}
					if (_.isString(arguments[i])) {
						plugins[arguments[i]].call(null, this);
					} else {
						if (arguments[i]) {
							initialize(this.require('searchPath'), arguments[i]);
						}
					}
				} else {
					if (_.isPlainObject(arguments[i])) {
						configure(arguments[i]);
					} else {
						bootstrap(arguments[i]);
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
