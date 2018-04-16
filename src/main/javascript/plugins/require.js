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
	const bootRequire = _.require, bootRunInContext = _.runInContext, cpx = _.ComPosiX;

	const resolve = _.ComPosiX.resolve;

	const require = function (module) {
		return function (_) {
			const resolved = resolve.call(_, module);
			if (resolved) {
				bootRequire.call(_, resolved);
			} else {
				_.module(module, function () {
					return bootRequire.call(_, module);
				});
			}
		};
	};

	const runInContext = function cpx$runInContext() {
		const result = bootRunInContext.call(_);
		result.mixin({
			ComPosiX: cpx,
			runInContext: runInContext,
			require: _.plugin.require,
			plugin: _.plugin
		});
		return result;
	};

	_.mixin({
		require: require,
		runInContext: runInContext
	});
});
