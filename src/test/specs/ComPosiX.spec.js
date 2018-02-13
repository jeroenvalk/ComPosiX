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

_.describe('ComPosiX', ['globals'], function (_, globals) {
    'use strict';

    const expect = globals('mocha').expect;

    /* global describe, it */

    const ComPosiX = require("../../main/javascript/ComPosiX")(null, null, null, null, require('../../main/javascript/processor'));
    const cpx = new ComPosiX();

    const underscore = {
        isEmpty(object) {
            if (object instanceof Object) {
                for (var key in object) {
                    if (object.hasOwnProperty(key)) {
                        return false;
                    }
                }
            }
            return true;
        }
    }

    describe("use", function () {
        let plugins = [], id = 0;
        const object = {
            mixin(plugin, options) {
                plugins.push([plugin, options]);
            }
        };
        const plugin = function (object) {
            object.mixin(id++);
        }
        const e = new Error();

        it("wrong", function (done) {
            try {
                cpx.use({}, plugin);
                throw e;
            } catch (e) {
            }
            expect(id).to.equal(1);
            expect(plugins).to.deep.equal([]);

            try {
                cpx.use({}, object);
                throw e;
            } catch (e) {
            }
            try {
                cpx.use(object, new Date());
                throw e;
            } catch (e) {
            }
            try {
                cpx.use(object, function (a, b) {
                });
                throw e;
            } catch (e) {
            }
            expect(plugins).to.deep.equal([]);
            done();
        });

        it("object", function () {
            plugins.length = 0;
            cpx.use(object, {});
            expect(plugins).to.deep.equal([[{}, undefined]]);
        });

        it("function", function () {
            plugins.length = 0;
            cpx.use(object, plugin);
            cpx.use(object, plugin);
            expect(plugins).to.deep.equal([[id - 2, undefined], [id - 1, undefined]]);
        });

        it("cpx-iteration", function () {
            plugins.length = 0;
            cpx.use(object, 'cpx:iteration');
            expect(plugins).to.have.length.above(0);
        });
    });

    describe("execute", function () {
        it("simple", function () {
            let x = {
                "@": {
                    cpx: {
                        use: {
                            _: _.constant(underscore)
                        }
                    }
                },
                "$extend": [{}]
            };
            let y = cpx.execute(x);
            expect(y).to.equal(x);
            delete x['@'];
            expect(underscore.isEmpty(x)).to.equal(true);
        });
    });
});
