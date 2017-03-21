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

/* global describe, it, require */

describe('streams', _.globals(function (use) {
    'use strict';

    let _ = use._.runInContext(), expect = use.chai.expect;

    before(function () {
        require("../../../main/javascript/plugins/core")(_);
        require("../../../main/javascript/plugins/streams")(_);
    });

    let node, $$;

    it("local", function () {
        // do not pipe streams but pipe NODES!
        let source = _.node(function (readable, writable) { // create a write node
            readable.on("end", function () {
                writable.write("Hello");
                writable.write("World!"); // that writes two utf8 data chunks
                writable.end();
            });
        });
        node = _.node(function (readable, writable) { // and pipe it
            let array = [];   // into another node that
            readable.on("data", function (data) {
                array.push(data.toString());  // collects all chunks
            });   // accepting either strings or buffers
            readable.on("end", function () {
                writable.write(array.join(" ")); // and joins them together
                writable.end();
            });
        });
        source.pipe(node).pipe(_.node(function (readable) {
            readable.on("data", function () { // and pipe it again
                expect(data).to.equal("Hello World!"); // to check out the result
            });
        }));
    });

    it("Google", function () {
        // imagine the cool things you can do with that
        $$ = function (selector) {
            return _.node(function (readable, writable) {
                _(readable).pipe(node).pipe(function (readable, writable) {
                    readable.on("")
                })
            });
        };

        // and now lets check out Google
        let request = function (url) {
            return _.node(function (readable, writable) {
                readable.pipe(http.get(url, function (res) {
                    res.pipe(writable);
                }));
            });
        };
        request("http://www.google.com/").pipe($$("div.jsb input")).pipe(_.node(function (readable) {
            readable.once("data", function (data) {
                expect(data.value).to.equal("Google Search");
                readable.once("data", function (data) {
                    expect(data.value).to.equal("I'm Feeling Lucky");
                });
            });
        }));
    });

    it("PartyAgenda", function () {
        _.node({
            "salsa_nl": request("http://www.salsa.nl/uitgaansagendas/latin-agenda.php").pipe($$({
                "div.ibox": {
                    "div.agenda": ["h2.highlight", "p"]
                }
            })).pipe(function (readable, writable) {
                readable.on("data", function (readable) {
                    readable.on("data", function(readable) {
                        // TODO: think on how to structure this
                    })
                });
            }),
            "latinnet": request("http://www.latinnet.nl/")
        }).pipe(function (readable, salsa_nl, latinnet) {

        });
    });

}));