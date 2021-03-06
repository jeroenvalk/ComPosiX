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


_.describe("globals", ['globals'], function(_, globals) {
    'use strict';

    const $ = globals('mocha');
    const expect = require('chai').expect;

    /* global describe, it */
    xit("NodeJS", function() {
        expect($.node).to.deep.equal({
            // add your NodeJS dependencies here
            //path: require('path'),
            //url: require('url'),
            //stream: require('stream')
            chai: require('chai')
        });
    });

    xit("lodash", function() {
        expect(_).to.equal(require('lodash'));
        expect($._).to.equal(require('lodash'));
    });

    it("describe", function() {
       expect(_.describe).to.equal(undefined);
    });
});
