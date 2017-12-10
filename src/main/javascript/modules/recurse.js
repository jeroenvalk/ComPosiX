/**
 * Copyright © 2017 dr. ir. Jeroen M. Valk
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

_.module("recurse", function() {
	const Value = function Value(args, value, key, parent, stack) {
		const argv = this.argv = _.slice(args, 2);
		this.value = value;
		this.key = key;
		this.parent = parent;
		this.stack = stack;
		this.result = value.apply(this, argv);
	};
	const cloneDeep = function recurse$cloneDeep(root, result) {
		const args = arguments;
		const customizer = function recurse$cloneDeep$customizer(value, key, parent, stack) {
			if (_.isFunction(value)) {
				const i = result.length;
				value = new Value(args, value, key, parent, stack);
				result.push(value);
				if (_.isFunction(value.result)) {
					return {"#": i};
				}
				return cloneDeep.apply(null, _.flatten([[value.result, result], value.argv]));
			}
		};

		if (!_.isArray(result)) {
			result = [];
		}

		return _.cloneDeepWith(root, customizer);
	};

	return {
		cloneDeep: cloneDeep
	};
});
