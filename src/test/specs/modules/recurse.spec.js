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
	setVariable: function(key, value) {
		underscore = value;
	}
}
global.context = context;
require("../../../main/javascript/modules/composix.js");

_.describe({
	name: "recurse",
	it: {
		cloneDeep: function(expect, recurse) {
			const __ = _.pick(_, _.keys(underscore));
			__._ = _.clone(__);
			const result = [];
			const a = recurse.cloneDeep(__, result), b = a._;
			delete a._;
			expect(a).to.deep.equal(b);
			expect(a).to.deep.equal(_.mapValues(_.invert(_.keys(underscore)), parseInt));
			delete __._;
			expect(result).to.deep.equal(_.values(__));
			return true;
		}
	}
});