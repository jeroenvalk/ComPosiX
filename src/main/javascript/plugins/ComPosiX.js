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
	const customizer = function(objValue, srcValue) {
		if (_.isArray(objValue)) {
			return objValue.concat(srcValue);
		}
	};

	const getValue = function(object, path, defaultValue) {
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

	const resolveHome = function(suffix, base) {
		if (suffix.startsWith('~')) {
			const home = suffix.split('/', 1)[0].substr(1);
			return [url.resolve(config.pathname, home ? config.home[home].pathname : base), suffix.substr(home.length + 2)];
		}
	};

	const config = {}, plugins = {};

	const initialize = function (searchPath) {
		//_.eachRight(config.search.resources, function(suffix) {
		//	const part = resolveHome(suffix, "./");
		//	console.log(part[0]);
		//	searchPath.postCurrent(url.resolve(config.authority, part[0]), part[1]);
		//});
		_.each(config.home, function(home) {
			_.eachRight(home.search, function(suffix) {
				const part = resolveHome(suffix, home.pathname);
				console.log(home, suffix, part);
				try {
					searchPath.postCurrent(url.resolve(config.authority, part[0]), part[1]);
				} catch(e) {
					throw new Error(JSON.stringify(e));
				}
			});
		});
	};

	const configure = function cpx$configure(conf) {
		return _.mergeWith(config, conf, customizer);
	};

	const bootstrap = function cpx$bootstrap(require) {
		url = require('url');

		const search = _.reverse(_.map(config.search.sources, function(source) {
			if (source.startsWith('~')) {
				return resolveHome(source, "./").join('');
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
			require: _.extend(function (module) {
				global._ = this;
				const result = require(module);
				global._ = _;
				return result;
			})
		});

		require(resolve('require'));
		require(resolve('plugin'));

		_.each(config.plugins, function(name) {
			plugins[name] = _.require(name);
		});
	};

	var state = 0, mixin, current = _;

	_.mixin({
		ComPosiX: function ComPosiX() {
			if (this === _ && state === 2 && arguments[0] === true) {
				current = this;
			}
			if (current === this) {
				for (var i = 0; i < arguments.length; ++i) {
					switch (state) {
						case 0:
							if (current.isPlainObject(arguments[i])) {
								configure(arguments[i]);
							} else {
								bootstrap(arguments[i]);
								mixin = {
									ComPosiX: current.ComPosiX,
									require: current.plugin.require,
									plugin: current.plugin
								};
								++state;
							}
							break;
						case 1:
							if (_.isString(arguments[i])) {
								plugins[arguments[i]].call(null, current);
							} else {
								if (arguments[i]) {
									initialize(current.require('searchPath'), arguments[i]);
								}
								++state;
							}
							break;
						case 2:
							if (arguments[i] === true) {
								current = current.runInContext();
								current.mixin(mixin);
								--state;
							}
							break;
					}
				}
			} else {
				throw new Error();
			}
			return current;
		}
	});

});
