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

_.describe(function (inherit) {
	return {
		//name: "inherit",
		it: {
			inherit: function () {
				const x = {
					a: {
						c: 1,
						d: 2
					},
					b: {
						e: 3,
						f: 4
					}
				};
				const a = {a: 0}, b = {b: 0}, c = {a: {c: 0}}, d = {a: {d: 0}}, e = {b: {e: 0}}, f = {b: {f: 0}};
				expect(_.inherit(_.cloneDeep(x), a)).to.deep.equal(_.extend(_.cloneDeep(x), a));
				expect(_.inherit(_.cloneDeep(x), b)).to.deep.equal(_.extend(_.cloneDeep(x), b));
				expect(_.inherit(_.cloneDeep(x), c)).to.deep.equal(_.extend(_.cloneDeep(x), c));
				expect(_.inherit(_.cloneDeep(x), d)).to.deep.equal(_.extend(_.cloneDeep(x), d));
				expect(_.inherit(_.cloneDeep(x), e)).to.deep.equal(_.extend(_.cloneDeep(x), e));
				expect(_.inherit(_.cloneDeep(x), f)).to.deep.equal(_.extend(_.cloneDeep(x), f));

				expect(_.inherit({
					"a.c": 1,
					"a.d": 2,
					"b.e": 3,
					"b.f": 4
				})).to.deep.equal(x);

				expect(_.inherit(_.cloneDeep(x), {
					"a.c": 0
				})).to.deep.equal(_.merge(_.cloneDeep(x), c));
				expect(_.inherit(_.cloneDeep(x), {
					"a.d": 0
				})).to.deep.equal(_.merge(_.cloneDeep(x), d));
				expect(_.inherit(_.cloneDeep(x), {
					"a.e": 0
				})).to.deep.equal(_.merge(_.cloneDeep(x), e));
				expect(_.inherit(_.cloneDeep(x), {
					"a.f": 0
				})).to.deep.equal(_.merge(_.cloneDeep(x), f));

				expect(_.inherit(_.cloneDeep(x), {
					"a.": a
				})).to.deep.equal(_.merge(_.cloneDeep(x), {a: a}));
				expect(_.inherit(_.cloneDeep(x), {
					"a.": {c: 0}
				})).to.deep.equal(_.merge(_.cloneDeep(x), c));
				expect(_.inherit(_.cloneDeep(x), {
					"a.": 0
				})).to.deep.equal(_.merge(_.cloneDeep(x), {a: {"": 0}}));

				expect(_.inherit({
					a: {
						b: {
							c: 1,
							d: 2,
							z: {
								a: 0
							}
						},
						c: {
							e: 3,
							f: 4,
							z: {
								a: 0
							}
						}
					},
					"a.b": {
						e: 3,
						f: 4,
						"z.": {
							b: 0
						}
					},
					"a.c.": {
						c: 1,
						d: 2,
						"z.": {
							b: 0
						}
					}
				})).to.deep.equal({
					a: {
						b: {
							e: 3,
							f: 4,
							z: {
								b: 0
							}
						},
						c: {
							c: 1,
							d: 2,
							e: 3,
							f: 4,
							z: {
								a: 0,
								b: 0
							}
						}
					}
				});
			}
		}
	};
});
