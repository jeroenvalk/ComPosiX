/**
 * Copyright © 2017, 2018 dr. ir. Jeroen M. Valk
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

_.module("recurse", ["channel"], function (_, channel) {
	var stream = {
		'#': 0
	};

	const Value = function Value(args, value, key, parent) {
		const argv = this.argv = _.slice(args, 1);
		this.value = value;
		this.key = key;
		this.parent = parent;
	};

	Value.prototype.wiring = function Value$wiring() {
		const self = this, current = this.result, size = current.length || 1;
		const ch = channel.create(true);

		const read = function (argv) {
			if (argv.length > 0) {
				current.apply(self, argv);
			}
			if (argv.length < size) {
				throw new Error("not implemented");
			}
			recurse();
		};

		const recurse = function () {
			channel.read(ch.rd, size, read);
			// TODO: implement catching up after closing stream
		};

		recurse();

		return {"#": ch.wr};
	};

	Value.prototype.compute = function Value$compute() {
		channel.write(stream['#'], {value: this.value});
		this.result = this.value.apply(this, this.argv);
		if (_.isFunction(this.result)) {
			this.result = this.wiring();
		}
		if (this.result === undefined) {
			this.result = null;
		}
		return this;
	};

	Value.prototype.recurse = function Value$recurse() {
		this.result = cloneDeep.apply(null, _.flatten([[this.result], this.argv]));
		return this;
	};

	Value.prototype.valuesAt = function (paths) {
		const context = this.parent['^'];
		if (!paths) {
			const value = context.value;
			paths = value.path ? _.extend({"": value.path}, value.paths) : value.paths;
		}
		return _.map(paths, function (path) {
			var i, n = path[0], ctx = context, cpx;
			if (isNaN(n)) {
				n = 0;
			} else {
				path = path.slice(1);
			}
			if (n < 0) {
				while (ctx.key) {
					ctx = ctx.parent['^'];
				}
				cpx = ctx.object['^'];
				for (i = 0; i < -n && cpx.key; ++i) {
					cpx = cpx.object['^'];
				}
				ctx = cpx.value['^'];
			} else {
				for (i = 0; i < n && ctx.key; ++i) {
					ctx = ctx.parent['^'];
				}
			}
			return path.length > 0 ? _.get(ctx.value, path) : ctx.value;
		});
	};

	const cloneDeep = function recurse$cloneDeep(root, cpx) {
		const args = arguments;
		var todo = null;

		const customizer = function recurse$cloneDeep$customizer(value, key, parent, stack) {
			if (todo) {
				const array = stack.__data__.__data__;
				const index = _.findLastIndex(_.map(array, _.property(0)), _.curry(_.isEqual)(todo[0]));
				if (index >= 0) {
					todo[1].value = array[index][1];
				}
				todo[0]['^'] = todo[1];
				todo = null;
			}
			if (_.isFunction(value)) {
				value = new Value(args, value, key, parent);
				return value.compute().recurse().result;
			} else if (_.isObject(value)) {
				todo = [value, key ? {
					key: key,
					parent: parent
				} : {
					object: cpx
				}];
			}
		};

		const result = _.cloneDeepWith(root, customizer);
		if (todo) {
			todo[0]['^'] = todo[1];
		}
		return result;
	};

	return {
		wiring: _.curry(_.rearg(_.mergeWith, [0, 2, 1]), 3)(stream, function (objValue, srcValue, key) {
			switch (key) {
				case '#':
					if (objValue && srcValue !== objValue) {
						channel.write(objValue, null);
					}
					break;
			}
		}),
		create: cloneDeep
	};
});
