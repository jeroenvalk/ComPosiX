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

describe('testing', _.globals(function ($) {
    'use strict';

    var _ = $._.runInContext(), cpx = new $.ComPosiX(), expect = $.expect;

    before(function () {
        require("../../../main/javascript/plugins/core")(_);
        require("../../../main/javascript/plugins/testing")(_);
    });

    it('hierarchy', function () {
        var result = _.hierarchy(/[.](describe)|(it)[_\s][^.]*/, {
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
            }
        });
        //console.log(JSON.stringify(result));
        expect(result).to.deep.equal({
            ".a.describe_MAIN": {
                ".a.describe_A": {
                    ".tryout.it_A": {
                        "actual": "a",
                        "expected": "a"
                    }
                }, ".b.describe_B": {".it_B": {"actual": "b", "expected": "b"}}
            }
        });
    });
    
}));