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
		simple: function (expect, channel) {
			const ch = channel.create(true), rd = ch.rd, wr = ch.wr;
			expect(channel.read(rd, 0)).to.deep.equal([]);

			channel.write(wr, [{a: 1}, {b: 2}]);
			channel.write(wr, null);
			channel.write(wr, [{c: 3}, {d: 4}]);
			channel.write(wr, [{e: 5}]);
			channel.write(wr, null);
			//channel.write(wr, null);

			expect(channel.read(rd, 1)).to.deep.equal([{a: 1}]);

			expect(channel.read(rd, 1, function (array) {
				expect(array).to.deep.equal([{c: 3}]);
				expect(channel.read(rd, Infinity)).to.deep.equal([{d: 4}, {e: 5}]);
			})).to.deep.equal([{c: 3}]);

			var flag = false;
			expect(channel.read(rd, Infinity, function (array) {
				flag = true;
				expect(array).to.deep.equal([{a: 1}]);
			})).to.equal(undefined);
			expect(flag).to.equal(false);
			channel.write(wr, {a: 1});
			expect(flag).to.equal(false);
			channel.write(wr, null);
			expect(flag).to.equal(true);
			return true;
		},
		reverse: function (expect, channel) {
			const ch = channel.create(true), rd = ch.rd, wr = ch.wr;
			expect(channel.read(rd, 0)).to.deep.equal([]);

			var flag = false;
			const callback = function (array) {
				flag = true;
				expect(array).to.deep.equal([{a: 1}]);
			}
			channel.read(rd, 1, callback);
			expect(flag).to.equal(false);
			channel.write(wr, {a: 1});
			expect(flag).to.equal(true);
			flag = false;
			channel.write(wr, {b: 2});
			expect(flag).to.equal(false);
			channel.read(rd, 1, callback);
			expect(flag).to.equal(false);
			channel.write(wr, {a: 1});
			expect(flag).to.equal(true);
			flag = false;
			channel.write(wr, {b: 2});
			channel.write(wr, null);
			expect(flag).to.equal(false);

			channel.write(wr, [{c: 3}, {d: 4}]);
			var flagB = false;
			expect(channel.read(rd, 1, function (array) {
				expect(array).to.deep.equal([{c: 3}]);
				expect(channel.read(rd, 2, function (array) {
					flagB = true;
				})).to.equal(undefined);
			}));
			expect(flagB).to.equal(false);
			channel.write(wr, [{e: 5}]);
			expect(flagB).to.equal(true);
			flagB = false;

			var flagC = false;
			channel.read(rd, Infinity, function (array) {
				flagC = true;
			});
			expect(flagC).to.equal(false);
			channel.write(wr, null);
			expect(flagC).to.equal(true);

			expect(flag).to.equal(false);
			expect(flagB).to.equal(false);
			return true;
		},
		forward: function (expect, channel) {
			const i = channel.create(true), o = channel.create(true);

			var depth = 0;
			const recurse = function () {
				++depth;
				channel.read(i.rd, Infinity, function (array) {
					expect(array[0].a).to.equal(depth);
					channel.write(o.wr, array);
					channel.write(o.wr, null);
					recurse();
				});
			};
			recurse();

			channel.write(i.wr, {a: 1});
			expect(depth).to.equal(1);
			channel.write(i.wr, null);
			expect(depth).to.equal(2);

			channel.write(i.wr, {a: 2});
			expect(depth).to.equal(2);
			channel.write(i.wr, null);
			expect(depth).to.equal(3);

			channel.write(i.wr, {a: 3});
			expect(depth).to.equal(3);
			channel.write(i.wr, null);
			expect(depth).to.equal(4);

			expect(channel.read(o.rd, 1, function (array) {
				expect(array).to.deep.equal([{a: 1}]);
				expect(channel.read(o.rd, 1)).to.deep.equal([]);

				expect(channel.read(o.rd, Infinity, function (array) {
					expect(array).to.deep.equal([{a: 2}]);
					expect(channel.read(o.rd, 1)).to.deep.equal([{a: 3}]);
					// note that returning closes the channel after {a: 3}
					// this clears the last EOF from the buffer
				})).to.deep.equal([{a: 2}]);
			})).to.deep.equal([{a: 1}]);

			expect(channel.read(o.rd, Infinity, function (array) {
				expect(array).to.deep.equal([]);
				channel.write(i.wr, {a: 4});
				expect(depth).to.equal(4);
				channel.write(i.wr, null);
				expect(depth).to.equal(5);

				expect(channel.read(o.rd, Infinity)).to.deep.equal([{a: 4}]);
			})).to.deep.equal(undefined);
			return true;
		}
	}
});
