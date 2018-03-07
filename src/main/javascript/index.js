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
	const boot = {
		extend: _.extend,
		results: [],
		require: _.extend(function (module) {
			const underscore = global._;
			global._ = this;
			require(module);
			if (underscore) {
				global._ = underscore;
			} else {
				delete global._;
			}
		}, {
			resolve: require.resolve
		}),
		plugin: function (func) {
			this.results.push(func(this));
		},
		runInContext: function() {
			return _.runInContext();
		}
	};

	boot.require(boot.require.resolve('./plugins/require'));
	return boot.results[0];
};
