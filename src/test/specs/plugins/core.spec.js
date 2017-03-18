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

describe('core', _.globals(function ($) {
    'use strict';

    var base, _ = $._.runInContext(), cpx = new $.ComPosiX(), expect = $.expect;

    before(function () {
        require("../../../main/javascript/plugins/core")(_);
        base = {
            '@': {
                cpx: {
                    use: {
                        _: _.constant(_)
                    }
                }
            }
        };
    });

    it("flattenDeep", function (done) {
        var x = cpx.execute(cpx.execute(_.merge(base, {
            '@': {
                sync: [
                    [1, [2, [3, [4]], 5]],
                    {a: 1, b: 2},
                    {a: [1], b: [2]},
                    {
                        a: {a: [1], b: [2, 3]},
                        b: 4,
                        c: {a: [5, 6], b: [7]}
                    }
                ],
                async: ["$flatten", [["$map", "@sync", _.constant(function (value) {
                    return _.constant(Promise.resolve(value));
                })], [
                    // _.constant({
                    //     a: {a: Promise.resolve([1]), b: [2, 3]},
                    //     b: Promise.resolve(4),
                    //     c: Promise.resolve({a: [5, 6], b: [7]})
                    // })
                ]]]
            },
            result: {
                "$_:extend": [{
                    "$_:extend": [{
                        sync: ["$map", "@sync", _.constant(function (value) {
                            return ["$flattenDeep", value];
                        })],
                        async: ["$map", "@async", _.constant(function (value) {
                            return ["$then", ["$flattenDeep", value]];
                        })]
                    }]
                }]
            }
        })));
        var expected = {
            sync: [
                [1, 2, 3, 4, 5],
                [],
                [1, 2],
                [1, 2, 3, 5, 6, 7]
            ]
        }
        expect(x.result.sync).to.deep.equal(expected.sync);
        _.then(x.result).then(function (result) {
            expect(result).to.deep.equal({
                sync: expected.sync,
                async: expected.sync
            });
            var y = _.flattenDeep({
                a: {a: Promise.resolve([1]), b: [2, 3]},
                b: Promise.resolve(4),
                c: Promise.resolve({a: [5, 6], b: [7]})
            });
            return _.then(y).then(function(value) {
                expect(value).to.deep.equal([1, 2, 3, 5, 6, 7]);
                done();
            })
        }).catch(done);
    });

    it("keysDeep", function () {
        var rng = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

        // normal _.keys iterates over strings which would lead no infinite recursion for _.keysDeep
        expect(_.keys("HelloWorld")).to.deep.equal(rng);
        expect(_.keysDeep("HelloWorld")).to.deep.equal([]); // use new String('HelloWorld') instead

        // normal _.keys also counts non-enumerable own properties
        var helloWorld = new String("HelloWorld");
        helloWorld.test = 42;
        expect(_.keys(helloWorld)[10]).to.equal('test');

        var array = [1, 2, 3];
        array.test = 42;
        expect(_.keys(array)[3]).to.equal('test');

        // _.keysDeep respects enumerability and iteration
        expect(_.keysDeep(helloWorld)).to.deep.equal(rng);
        expect(_.keysDeep(array)).to.deep.equal(["0", "1", "2"]);

        (function () {
            expect(_.keysDeep(arguments)).to.deep.equal(['0.a', '1.b']);
        })({a: "a"}, {b: "b"});

        _([
            new String("HelloWorld"),
            1,
            {a: 1},
            [1, 2, 3]
        ]).each(function (obj) {
            expect(_.keysDeep(obj)).to.deep.equal(_.keys(obj));
        });

        _([
            {'a': [{'b': {'c': 3}}, 4]},
            {'a': [{'b': {'c': new Promise(_.wrap())}}, Promise.resolve(4)]}
        ]).each(function (obj) {
            var paths = _.keysDeep(obj);
            var result = _.zipObjectDeep(paths, _.at(obj, paths));
            //console.log(JSON.stringify(result));
            expect(result).to.deep.equal(obj);
        });
    });

    it('all', function (done) {
        _([
            [{
                a: 1
            }],
            1,
            {a: 1},
            [1, 2],
            new String("a"),
            "a"
        ]).each(function (value) {
            expect(_.all(value)).to.equal(value);
        });

        _(Promise.resolve(1)).all().then(function(result) {
            expect(result).to.equal(1);
        }).then(function() {
            return _([Promise.resolve(1), Promise.resolve(2)]).all().then(function (result) {
                expect(result).to.deep.equal([1, 2]);
                return _({
                    a: {
                        b: [Promise.resolve(1), Promise.resolve(2)],
                        c: Promise.resolve(3)
                    },
                    d: Promise.resolve(4)
                }).all().then(function (result) {
                    expect(result).to.deep.equal({a: {b: [1, 2], c: 3}, d: 4});
                    done();
                });
            });
        }).catch(done);
    });

    it('then', function () {
        _([
            1,
            {a: 1},
            [1, 2],
            new String("a"),
            "a"
        ]).each(function (value) {
            expect(_(value).then(function (val) {
                expect(val).to.equal(value);
                return val;
            })).to.equal(value);
        })

        var result = _({
            a: Promise.resolve(1)
        }).then(function (result) {
            expect(result).to.deep.equal({
                a: 1
            });
        });
    });

}));
