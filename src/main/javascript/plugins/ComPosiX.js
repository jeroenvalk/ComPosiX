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

_.plugin(['url'], function(_, url) {
	const customizer = function(objValue, srcValue) {
		if (_.isArray(objValue)) {
			return objValue.concat(srcValue);
		}
	};

	const initialize = function (_) {
		const iteratee = function (baseURL) {
			return function (pathname) {
				_.require('searchPath').postCurrent(baseURL, pathname);
			};
		};

		const config = this, plugins = {
			module: _.require('module')
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

	const bootstrap = function cpx$bootstrap(require) {
		_.mixin({
			require: _.extend(function (module) {
				global._ = this;
				const result = require(module);
				global._ = _;
				return result;
			}, {
				resolve: require.resolve,
				search: _.reverse(config.search.sources)
			})
		});

		require('./plugins/require');
		require('./plugins/plugin');

		if (config.enforce) {
			config.initialize(_);
		}
	};

	_.mixin({
		ComPosiX: function ComPosiX(entity) {
			const _ = this;

			if (entity) {
				if (_.isPlainObject(entity)) {
					return configure(entity);
				} else {
					bootstrap(entity)
				}
			}
		}
	});
});
