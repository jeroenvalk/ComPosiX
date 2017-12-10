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

_.module("recurse", ["channel"], function (channel) {
	var wr = 0;

	const wiring = function recurse$wiring(fd) {
		channel.write(wr, null);
		if (isFinite(fd)) {
			if (!fd) {
				return wr = 0;
			}
			if (fd < 0) {
				const ch = channel.create(true);
				wr = ch.wr;
				return ch.rd;
			}
			throw new Error("invalid wiring");
		}
		throw new Error("invalid channel endpoint");
	};

	const Value = function Value(args, value, key, parent, stack) {
		const argv = this.argv = _.slice(args, 1);
		this.value = value;
		this.key = key;
		this.parent = parent;
		this.stack = stack;
	};

	Value.prototype.wiring = function Value$wiring() {
		const self = this, current = this.result, size = current.length;
		const ch = channel.create(true);

		if (!size) {
			return new Error("node without arguments");
		}

		const recurse = function() {
			channel.read(ch.rd, size, function(argv) {
				if (argv.length > 0) {
					current.apply(self, argv);
				}
				if (argv.length < size) {
					throw new Error("not implemented");
				}
				recurse();
			});
			// TODO: implement catching up after closing stream
		};

		recurse();

		return {"#": ch.wr};
	};

	Value.prototype.compute = function Value$compute() {
		channel.write(wr, {value: this.value});
		this.result = this.value.apply(this, this.argv);
		if (_.isFunction(this.result)) {
			this.result = this.wiring();
		}
		return this;
	};

	Value.prototype.recurse = function Value$recurse() {
		this.result = cloneDeep.apply(null, _.flatten([[this.result], this.argv]));
		return this;
	};

	const cloneDeep = function recurse$cloneDeep(root) {
		const args = arguments;

		const customizer = function recurse$cloneDeep$customizer(value, key, parent, stack) {
			if (_.isFunction(value)) {
				value = new Value(args, value, key, parent, stack);
				return value.compute().recurse().result;
			}
		};

		return _.cloneDeepWith(root, customizer);
	};

	return {
		wiring: wiring,
		create: cloneDeep
	};
});
