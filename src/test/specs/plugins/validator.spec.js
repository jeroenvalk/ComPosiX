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

describe('validator', _.globals(function ($) {
    'use strict';

    const _ = $._.runInContext(), expect = $.expect, fs = require('fs');

    const swagger = JSON.parse(fs.readFileSync('src/test/cpx/models/swagger.json'));

    before(function () {
        require("../../../main/javascript/plugins/validator")(_);
    });

    it("select", function() {
        const params = _.validator({}).select(swagger, {"type": "object", "recurse": true, "required": ["in"]}, 10);
        expect(params.length).to.equal(9);
    });

    it("validate", function() {
        const errors = _.validator(swagger).validate({
            name: "Doggie",
            photoUrls: []
        }, ['definitions', 'Pet']);
        expect(errors).to.deep.equal([]);
    });
}));
