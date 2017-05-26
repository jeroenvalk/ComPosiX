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

describe('integration', _.globals(function ($) {
    'use strict';

    var _ = $._.runInContext(), cpx = new $.ComPosiX(), expect = $.expect;

    it("cpx.use", function () {
        var x = cpx.execute({
            "@cpx.use._": ["lodash"],
            "@": {
                "cpx": {
                    "use": {
                        "hello": _.constant({
                            world: function () {
                                return "HelloWorld!";
                            }
                        })
                    }
                }
            },
            "$_:set": [["$hello:world"], 0],
            "nested": {
                "$_:set": [["$hello:world"], 1]
            }
        })
        //console.log(JSON.stringify(x));
        expect(_.omit(x, ["@"])).to.deep.equal({
            nested: {"HelloWorld!": 1},
            "HelloWorld!": 0
        })

        var y = cpx.execute({
            "@cpx.use._": ["lodash", function () {
                return function (_) {
                    _.mixin({
                        world: function () {
                            return "HelloWorld!";
                        }
                    })
                }
            }],
            "$_:set": [["$_:world"], 0],
            "nested": {
                "$_:set": [["$_:world"], 1]
            }
        })
        //console.log(JSON.stringify(y));
        expect(_.omit(y, ["@"])).to.deep.equal({
            nested: {"HelloWorld!": 1},
            "HelloWorld!": 0
        })
    });

    it('set', function () {
        var attr = {
            cpx: {
                use: {
                    _: _.constant(_)
                }
            },
            "@": {
                deps: {
                    _: _
                }
            }
        };

        var x = cpx.execute({
            "@": attr,
            "simple": {
                "$_:set": ["a[0].b.c", 4],
                "a": [{"b": {"c": 3}}]
            },
            "multi": {
                "$_:set": {
                    "one": ["a[0].b.c", 5],
                    "two": [['x', '1', 'y', 'z'], 6]
                },
                "two": {
                    "x": [2]
                }
            }
        });

        expect(x['@']).to.equal(attr);
        expect(x['@']).to.deep.equal(attr);
        expect(_.omit(x, '@')).to.deep.equal({
            "simple": {"a": [{"b": {"c": 4}}]},
            "multi": {
                "one": {"a": [{"b": {"c": 5}}]},
                "two": {"x": [2, {"y": {"z": 6}}]}
            }
        });
    })

    cpx.execute({
        '@': {
            cpx: {
                use: {
                    _: [_.constant(_), "core", "testing"]
                }
            }
        },
        a: {
            describe_MAIN: {
                a: {
                    describe_A: {
                        tryout: {
                            it_A: {
                                actual: 'a',
                                expected: 'a'
                            }
                        }
                    }
                },
                b: {
                    describe_B: {
                        it_B: {
                            actual: 'b',
                            expected: 'b'
                        }
                    }
                }
            }
        },
        it_core: {
            '@': {
                attr: function () {
                    return "HelloWorld";
                }
            },
            expected: 'HelloWorld',
            '$_:set': ["actual", "@attr"]
        },
        testsuite: {
            describe_ComPosiX: {
                "it_cpx:use": {
                    '@': {
                        cpx: {
                            use: {
                                _: ["lodash"]
                            }
                        }
                    },
                    actual: {
                        '@': {
                            cpx: {
                                use: {
                                    _: _.constant(require("lodash"))
                                }
                            }
                        },
                        "$_:extend": [{
                            "result": ["$flatten", [[[1], [2]], [[3], [4]]], true]
                        }]
                    },
                    expected: {
                        "$_:extend": [{
                            "result": ["$flatten", [[[1], [2]], [[3], [4]]]]
                        }]
                    }
                }
            }
        },
        "$_:test": []
    });

}));
