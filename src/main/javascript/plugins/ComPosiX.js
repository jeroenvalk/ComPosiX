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

	var url, module;

	const initialize = function (_) {
		const iteratee = function (baseURL) {
			return function (pathname) {
				_.require('searchPath').postCurrent(baseURL, pathname);
			};
		};

		const config = this, plugins = {
			module: module
		};

		const resources = _.concat(config.search.resources, 'ComPosiX/ComPosiX/src/main/');

		_.each(config.plugins, function (plugin) {
			plugins[plugin] = _.require(plugin);
		});
		_.each(plugins, function (func) {
			func(_);
		});

		_.each(resources, iteratee(config.baseURL));

		_.each(config.home, function(home) {
			_.each(home.search, iteratee(url.resolve(config.baseURL, home.pathname)));
		});

		_.module('config', _.constant(config));
	};

	const config = {initialize: initialize};

	const configure = function cpx$configure(conf) {
		return _.mergeWith(config, conf, customizer);
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

	const bootstrap = function cpx$bootstrap(require) {
		url = require('url');

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
			}, {
				resolve: require.resolve,
				search: config.search.sources
			})
		});

		require('./plugins/require');
		require('./plugins/plugin');

		module = _.require('module');

		if (config.enforce) {
			config.initialize(_);
		}
	};

	_.mixin({
		ComPosiX: _.extend(function ComPosiX(entity) {
			const _ = this;

			if (entity) {
				if (_.isPlainObject(entity)) {
					return configure(entity);
				} else {
					bootstrap(entity)
				}
			}
		}, {
			groupArguments: groupArguments
		})
	});
});
