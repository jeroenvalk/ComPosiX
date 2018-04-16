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

const path = require('path'), fs = require('fs');
const workspace = path.resolve(__dirname, "../../../../..");

module.exports = function (_) {
	global._ = _;

	const config = {
		baseURL: "file://localhost" + workspace +'/',
		search: {
			sources: ['./plugins', './modules'],
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
	};

	_.mixin({
		plugin: function cpx$plugin(func) {
			func(_);
		}
	});

	require('./plugins/ComPosiX');

	_.ComPosiX(config);

	return _;
};

if (typeof _ !== 'undefined') {
	module.exports(_);
}
