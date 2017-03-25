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

/* global describe, it */

describe("cpx-iterations", _.globals(function($) {
    'use strict';

    /**
     * @param $.chai.expect.to.deep
     */
    const expect = $.chai.expect;
    const _ = $._;
    
    it("preorder", function() {
        const obj = {x: {x: "a", y: "b"}, y: {x: "c", y: "d"}};
        const iterable = {};

        const array = [...$.preorder(obj, iterable)];

        expect(array[0]).to.equal(obj);
        expect(array[1]).to.equal(obj.x);
        expect(array[2]).to.equal(obj.x.x);
        expect(array[3]).to.equal(obj.x.y);
        expect(array[4]).to.equal(obj.y);
        expect(array[5]).to.equal(obj.y.x);
        expect(array[6]).to.equal(obj.y.y);

        let expected = [];
        for (const entry of iterable) {
            const stack = iterable.iterator.stack;
            switch(iterable.iterator.count) {
                case 0:
                    expected.push(obj);
                    expected.push(["y", "x"]);
                    break;
                case 1:
                    _.last(expected).pop();
                    expected.push(entry);
                    expected.push(["y", "x"]);
                    break;
                case 2:
                    _.last(expected).pop();
                    expected.push(entry);
                    expected.push(null);
                    break;
                case 3:
                    _.nth(expected, -3).pop();
                    expected[expected.length - 2] = entry;
                    break;
                case 4:
                    expected = [obj, [], entry, ["y", "x"]];
                    break;
                case 5:
                    _.last(expected).pop();
                    expected.push(entry);
                    expected.push(null);
                    break;
                case 6:
                    _.nth(expected, -3).pop();
                    expected[expected.length - 2] = entry;
                    break;
                default:
                    expect(iterable.iterator.count).to.equal(Infinity);
                    continue;
            }
            expect(stack).to.deep.equal(expected);
        }
    });

}));
