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
			expect(recurse.create(_.constant(undefined))).to.equal(null);
			expect(recurse.create(_.constant(null))).to.equal(null);
			expect(recurse.create(_.constant(true))).to.equal(true);

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
		decoration: function (expect, channel, recurse) {
			var y, x = {
				a: {
					x: 1,
					$one: function () {
						expect(this.value).to.equal(x.a.$one);
						expect(this.key).to.equal("$one");
						expect(this.parent).to.equal(x.a);

						expect(this.parent['^'].value).to.deep.equal({x: 1});
						expect(this.parent['^'].key).to.equal("a");
						expect(this.parent['^'].parent).to.equal(x);

						expect(x['^']).to.deep.equal({value: {}});

						return 1;
					}
				}, b: {
					y: 2,
					$two: function () {
						expect(this.value).to.equal(x.b.$two);
						expect(this.key).to.equal("$two");
						expect(this.parent).to.equal(x.b);

						expect(this.parent['^'].value).to.deep.equal({y: 2});
						expect(this.parent['^'].key).to.equal("b");
						expect(this.parent['^'].parent).to.equal(x);

						expect(x['^']).to.deep.equal({
							value: {
								a: {
									$one: 1,
									x: 1
								}
							}
						});

						return 2;
					}
				}
			};

			y = recurse.create(x);

			expect(y).to.deep.equal({
				a: {
					x: 1,
					$one: 1
				},
				b: {
					y: 2,
					$two: 2
				}
			});

			expect(x['^']).to.deep.equal({
				value: y
			});
			expect(x.a['^']).to.deep.equal({
				value: y.a,
				key: 'a',
				parent: x
			});
			expect(x.b['^']).to.deep.equal({
				value: y.b,
				key: 'b',
				parent: x
			});

			return true;
		},
		introspection: function (expect, channel, recurse) {
			const forward = function (closure) {
				return function (stream) {
					return function (stream) {
						var result = closure.apply(stream.self, stream.argv);
						if (result === undefined) {
							result = null;
						}
						if (_.isFunction(result)) {
							channel.write(stream['#wr'], {});
							const recurse = function () {
								channel.read(stream['#rd'], 1, function (array) {
									if (array.length < 1) {
										channel.write(stream['#wr'], null);
									} else {
										result.apply(null, array);
										recurse();
									}
								});
							};
							recurse();
						} else {
							channel.write(stream['#wr'], {result: result});
							channel.write(stream['#wr'], null);
						}
					};
				};
			};

			const x = {
				a: 1,
				$: "one"
			};

			const y = recurse.wiring(recurse.create({
				one: forward(function () {
					expect(this.value).to.equal("one");
					expect(this.key).to.equal("$");
					expect(this.parent).to.equal(x);

					return true;
				})
			}));

			const ch = channel.create(true);
			channel.write(y.one['#'], {self: {value: x.$, key: "$", parent: x}, argv: [], "#wr": ch.wr});
			expect(channel.read(ch.rd, Infinity)).to.deep.equal([{result: true}]);

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
			const ch = channel.create(true);
			recurse.wiring({'#': ch.wr});
			const a = recurse.create(__), b = a._;
			recurse.wiring({'#': 0});
			delete a._;
			expect(_.keys(a)).to.deep.equal(_.keys(underscore));
			expect(_.keys(b)).to.deep.equal(_.keys(underscore));

			const unsafe = ["each", "find", "constant"];
			_.each(_.keys(underscore), function (key) {
				if (!a[key] || isNaN(a[key]["#"])) {
					expect(a[key]).to.deep.equal(b[key]);
				} else {
					unsafe.push(key);
					expect(a[key]).to.deep.equal({"#": a[key]["#"]});
					expect(b[key]).to.deep.equal({"#": b[key]["#"]});
				}
			});
			expect(_.omit(a, unsafe)).to.deep.equal(_.mapValues(_.omit(__._, unsafe, '^'), function (value) {
				return value.apply({}, []);
			}));
			expect(_.map(channel.read(ch.rd, Infinity), _.property("value"))).to.deep.equal(_.flatten([_.values(_.omit(__._, '^')), _.values(_.omit(__._, '^'))]));
			return true;
		}
	}
})
;