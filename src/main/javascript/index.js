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

module.exports = function (_, config) {
	const path = require('path'), fs = require('fs'), url = require('url');

	const workspace = path.resolve(__dirname, "../../../../..");

	if (!config) {
		config = {};
	}

	_.defaults(config, {
		baseURL: "file://localhost" + workspace +'/',
		search: {
			sources: [],
			resources: []
		},
		home: _.fromPairs(_.compact(_.map(fs.readdirSync(workspace), function (file) {
			if (fs.statSync(path.resolve(workspace, file)).isDirectory()) {
				const home = _.map(file, function (c) {
					return c === c.toLowerCase() ? '' : c;
				}).join('');
				return home ? ['~' + home, {pathname: file, search: ['src/main/']}] : null;
			}
		})))
	});

	const sources = _.concat(config.search.sources, './plugins', './modules'),
		resources = _.concat(config.search.resources, 'ComPosiX/ComPosiX/src/main/');

	const initialize = function (_) {
		const iteratee = function (baseURL) {
			return function (pathname) {
				_.require('searchPath').postCurrent(baseURL, pathname);
			};
		};

		const config = this, plugins = {
			module: _.require('module')
		};
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

	config.initialize = initialize;

	const results = [];

	_.mixin({
		require: _.extend(function (module) {
			const underscore = global._;
			global._ = this;
			const result = require(module);
			if (underscore) {
				global._ = underscore;
			} else {
				delete global._;
			}
			return result;
		}, {
			resolve: require.resolve,
			search: _.reverse(sources)
		}),
		plugin: function (func) {
			results.push(func(this));
		}
	});

	const bootRequire = _.require;
	_.require(_.require.resolve('./plugins/require'));

	global._ = _;
	require('./plugins/plugin');
	delete global._;

	bootRequire.plugin = results[1];

	if (config.enforce) {
		config.initialize(_);
	}

	return _;
};
