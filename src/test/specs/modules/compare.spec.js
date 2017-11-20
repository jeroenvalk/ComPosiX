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

_.describe({
	name: "compare",
	before: function() {
		return [this.node.chai.expect];
	},
	it: {
		simple: function(expect) {
			expect(_.compare({
				x: 1,
				y: {
					e: 1
				}
			}, {
				x: {},
				y: {
					f: 1
				},
				z: 1
			})).to.deep.equal({
				number: {
					x: 1,
					z: 2
				},
				object: {
					y: 3,
					x: 2,
					"x.": {}
				}
			});
		}
	}
});
