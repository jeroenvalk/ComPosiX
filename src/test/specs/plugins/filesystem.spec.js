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

describe('filesystem', _.globals(function ($) {
    'use strict';

    const path = require('path');
    const _ = $._.runInContext(), expect = $.expect, fs = require('fs');

    before(function () {
        require("../../../modules/cpx-iteration")(_);
        require("../../../main/javascript/plugins/filesystem")(_);
    });

    it('module', function (done) {
        _.module().readable.on("data", function (data) {
            const result = [];
            data.chain.on("data", function (data) {
                result.push(data);
            });
            data.chain.on("end", function () {
                expect(result).to.deep.equal([{
                    dirname: path.resolve('.'),
                    pkg: JSON.parse(fs.readFileSync('package.json'))
                }]);
                done();
            });
        });
        _.module().writable.write({dirname: '.'});
    });

    it('fsReadSync', function () {
        const result = {};
        _.fsReadSync(result, "src/test/cpx", 'utf8');
        expect(JSON.parse(result.models['Category.json'])).to.deep.equal(JSON.parse(fs.readFileSync('src/test/cpx/models/Category.json')));
        expect(JSON.parse(result.models['swagger.json'])).to.deep.equal(JSON.parse(fs.readFileSync('src/test/cpx/models/swagger.json')));
    });

    it('fsWriteSync', function () {
        const source = _.fsReadSync(null, "src/test/cpx")
        _.fsWriteSync(source, 'target');
        expect(_.fsReadSync(null, "target/models")).to.deep.equal(source.models);
    });

}));
