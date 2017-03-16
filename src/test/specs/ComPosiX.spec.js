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

describe('ComPosiX', _.globals(function ($) {
    'use strict';

    var _ = $._.runInContext(), cpx = new $.ComPosiX(), expect = $.expect;

    cpx.execute({
        '@const$.cpx.use._': _.constant(_),
        $dependencies: [{
            _: _.constant(_)
        }]
    });

    cpx.execute({
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
        "$_:test": []
    });

    var attr = {
        "@": {
            deps: {
                _: _
            }
        }
    };

    it('set', function () {
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
}));
