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

module.exports = function (_) {
	const url = require('url'), fs = require('fs');

	const workspace = url.resolve(require('os').homedir() + '/', "Desktop/ComPosiX/");
	const cpxdir = __dirname.startsWith(workspace) ? url.resolve(__dirname.substr(workspace.length), '../../') : url.resolve(__dirname, '../../');
	console.log("[INFO] workspace=" + workspace);
	console.log("[INFO] cpx=" + cpxdir);

	const getOrganizations = function(workspace) {
		return _.fromPairs(_.compact(_.map(fs.readdirSync(workspace), function (file) {
			if (fs.statSync(url.resolve(workspace, file)).isDirectory()) {
				const home = _.map(file, function (c) {
					return c === c.toLowerCase() ? '' : c;
				}).join('');
				return home ? [home, file] : null;
			}
		})));
	};

	const config = {
		authority: "file://localhost",
		pathname: workspace,
		search: {
			sources: ['~cpx/src/main/javascript/modules/', '~cpx/src/main/javascript/plugins/'],
			resources: ['~cpx/src/main/resources/']
		},
		home: _.extend({
			cpx: {
				pathname: cpxdir,
				search: ['~/']
			}
		}, _.mapValues(getOrganizations(workspace), function(file) {
			return {
				pathname: file + '/',
				search: ['~/']
			}
		})),
		plugins: {
			initialize: true,
			plugin: true,
			module: true,
		}
	};

	global._ = _;
	require('./plugin');
	require('./plugins/initialize');
	require('./plugins/plugin');
	require('./plugins/module');
	require('./plugins/ComPosiX');
	_.ComPosiX(config);
	return _;
};

if (typeof _ !== 'undefined') {
	module.exports(_);
}
