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
	it: {
		create: function (expect, recurse) {
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
		cloneDeepOnLodash: function (expect, recurse) {
			delete underscore.mixin;
			const __ = _.pick(_, _.keys(underscore));
			__._ = _.clone(__);
			recurse.reset();
			const a = recurse.create(__), b = a._;
			delete a._;
			expect(_.keys(a)).to.deep.equal(_.keys(underscore));
			expect(_.keys(b)).to.deep.equal(_.keys(underscore));

			const unsafe = ["each", "find"];
			_.each(_.keys(underscore), function (key) {
				if (isNaN(a[key]["#"])) {
					expect(a[key]).to.deep.equal(b[key]);
				} else {
					unsafe.push(key);
					expect(a[key]).to.deep.equal({"#": a[key]["#"]});
					expect(b[key]).to.deep.equal({"#": a[key]["#"] + 18});
				}
			});
			expect(_.omit(a, unsafe)).to.deep.equal(_.mapValues(_.omit(__._, unsafe), function (value) {
				return value.apply({}, []);
			}));
			expect(_.map(recurse.reset(), _.property("value"))).to.deep.equal(_.flatten([_.values(__._), _.values(__._)]));
			return true;
		}
	}
});