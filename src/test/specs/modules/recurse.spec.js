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

/* global _ */

var underscore;

const context = {
	setVariable: function (key, value) {
		underscore = value;
	}
}
global.context = context;
require("../../../main/javascript/modules/composix.js");

_.describe({
	name: "recurse",
	use: {
		NodeJS: ['chai.expect'],
		ComPosiX: ['channel', 'recurse']
	},
	it: {
		simple: function (expect, channel, recurse) {
			expect(recurse.create({
				a: 1,
				b: _.identity
			}, 2)).to.deep.equal({a: 1, b: 2});

			expect(recurse.create({
				a: 1,
				x: function (b) {
					this.argv = [4];
					return {
						c: 3,
						d: _.identity
					};
				},
				b: _.identity
			}, 2)).to.deep.equal({
				a: 1,
				b: 2,
				x: {
					c: 3,
					d: 4
				}
			});

			return true;
		},
		streams: function (expect, channel, recurse) {
			const result = [];

			const fd = channel.create().wr;

			const stream = recurse.create({
				a: _.constant(function (value) {
					expect(this.key).to.equal("a");
					expect(this.argv).to.deep.equal([1]);
					result.push(value);
				})
			}, 1);

			expect(stream).to.deep.equal({
				a: {"#": fd + 1}
			});

			channel.write(stream.a["#"], {Hello: "World"});
			channel.write(stream.a["#"], {Bye: "World"});

			expect(result).to.deep.equal([{Hello: "World"}, {Bye: "World"}]);

			return true;
		},
		cloneDeepOnLodash: function (expect, channel, recurse) {
			delete underscore.mixin;
			const __ = _.pick(_, _.keys(underscore));
			__._ = _.clone(__);
			const rd = recurse.wiring(-1);
			const a = recurse.create(__), b = a._;
			recurse.wiring(0);
			delete a._;
			expect(_.keys(a)).to.deep.equal(_.keys(underscore));
			expect(_.keys(b)).to.deep.equal(_.keys(underscore));

			const unsafe = ["each", "find", "constant"];
			_.each(_.keys(underscore), function (key) {
				if (isNaN(a[key]["#"])) {
					expect(a[key]).to.deep.equal(b[key]);
				} else {
					unsafe.push(key);
					expect(a[key]).to.deep.equal({"#": a[key]["#"]});
					expect(b[key]).to.deep.equal({"#": b[key]["#"]});
				}
			});
			expect(_.omit(a, unsafe)).to.deep.equal(_.mapValues(_.omit(__._, unsafe), function (value) {
				return value.apply({}, []);
			}));
			expect(_.map(channel.read(rd, Infinity), _.property("value"))).to.deep.equal(_.flatten([_.values(__._), _.values(__._)]));
			return true;
		}
	}
});