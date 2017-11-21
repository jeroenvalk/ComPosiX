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
	name: "channel",
	it: {
		simple: function(expect, channel) {
			const ch = channel.create(true), rd = ch.rd, wr = ch.wr;
			channel.write(wr, {a: 1});
			channel.write(wr, [{b: 2}, {c: 3}]);
			channel.write(wr, null);
			expect(channel.read(rd, Infinity)).to.deep.equal([{a: 1}, {b: 2}, {c: 3}]);
		}
	}
});
