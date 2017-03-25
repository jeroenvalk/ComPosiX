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

    const url = require("url"), stream = require("stream");

    const _ = use._.runInContext(), expect = use.chai.expect, http = use.http;

    before(function () {
        require("../../../main/javascript/plugins/streams")(_);
    });

    let node, $$, request;

    describe("writable", function () {
        it("simple", function (done) {
            const x = [""], writable = new stream.PassThrough();
            let flag = false;
            _(x).writable(writable).then(function () {
                expect(flag).to.equal(true);
                done();
            }).catch(done);
            writable.write("Hello World!");
            writable.end();
            expect(x).to.deep.equal(["", new Buffer("Hello World!")]);
            flag = true;
            //expect(flag).to.equal(false);
        });

        it("nested", function (done) {
            const x = [], writable = new stream.PassThrough({objectMode: true});
            let flag = false, properties = {
                timestamp: new Date(),
                seqnr: 0,
                message: "Hello World!",
                flag: false
            };
            let readable = new stream.PassThrough();
            _(x).writable(writable).then(function () {
                expect(flag).to.equal(true);
                done();
            }).catch(done);
            writable.write({
                properties: properties,
                stream: readable
            });
            writable.end();
            readable.write("Hello World!");
            readable.end();
            expect(x).to.deep.equal([{
                properties: properties,
                stream: [new Buffer("Hello World!")]
            }]);
            flag = true;
        });

        it("object", function (done) {
            const x = {}, main = new stream.PassThrough();
            let flag = false;
            try {
                _(x).writable(main);
                expect(true).to.equal(false);
            } catch (e) {

            }
            expect(x).to.deep.equal({});
            _(x).writable({main: main}).then(function () {
                expect(flag).to.equal(true);
                done();
            }).catch(done);
            main.write("Hello World!");
            main.end();
            expect(x).to.deep.equal({main: [new Buffer("Hello World!")]});
            flag = true;
        });

        it("indirection", function (done) {
            const x = [];
            const main = new stream.PassThrough({objectMode: true});
            const indirect = new stream.PassThrough();
            let flag = false;
            _(x).writable(main).then(function () {
                expect(true).to.equal(false);
                done();
            }, function (e) {
                expect(e).to.be.an.instanceof(Error);
                done();
            });
            main.write(indirect);
            main.end();
            indirect.write("Hello World!");
            indirect.end();
            expect(x).to.deep.equal([]);
            flag = true;
        });
    });

    describe("readable", function () {
        it("simple", function (done) {
            const x = [];
            _(x).writable(_(["Hello World!"]).readable()).then(function () {
                expect(x).to.deep.equal([new Buffer("Hello World!")]);
                done();

            }).catch(done);
        });

        it("nested", function (done) {
            const x = [];
            _(x).writable(_([{readable: ["Hello World!"]}]).readable()).then(function () {
                expect(x).to.deep.equal([{readable: [new Buffer("Hello World!")]}]);
                done();
            }).catch(done);
        });

        it("indirection", function (done) {
            const x = [];
            _(x).writable(_(["Hello", [[" "], "World!"]]).readable()).then(function () {
                expect(x).to.deep.equal([new Buffer("Hello"), new Buffer(" "), new Buffer("World!")]);
                done();

            }).catch(done);
        });
    });

    it("request", function (done) {
        const x = [], writable = new stream.PassThrough({objectMode: true});
        _(x).writable(writable).then(function () {
            expect(x[0].statusCode).to.equal(200);
            expect(x[0].statusMessage).to.equal("OK");
            expect(x[0].headers['access-control-allow-origin']).to.equal('*');
            expect(JSON.parse(x[0].body.toString()).swagger).to.equal("2.0");
            done();
        }).catch(done);
        _(_([{
            protocol: "http:",
            hostname: "composix.nl",
            port: 80,
            path: "/composix/api/petstore/swagger.json",
            method: "GET",
            body: [""]
        }]).readable()).request(writable);
    });

    describe("node", function () {
        it("local", function () {
            // do not pipe streams but pipe NODES!
            let source = _.node(function (writable) { // create a write node
                writable.write("Hello");
                writable.write("World!"); // that writes two utf8 data chunks
                writable.end();
            }, 1);
            node = function () {
                return _.node(function (readable, writable) { // and pipe it
                    let array = [];   // into another node that
                    readable.on("data", function (data) {
                        array.push(data.toString());  // collects all chunks
                    });   // accepting either strings or buffers
                    readable.on("end", function () {
                        writable.write(array.join(" ")); // and joins them together
                        writable.end();
                    });
                })
            };
            source.pipe(node()).pipe(_.node(function (readable) {
                readable.on("data", function (data) { // and pipe it again
                    expect(data).to.equal("Hello World!"); // to check out the result
                });
            }));
        });

        xit("swagger", function (done) {
            let EOF = _.node(function (writable) {
                writable.end();
            }, 1);
            request = function (uri) {
                return _.node(function (readable, writable) {
                    const req = http.request(_.extend({method: "GET", headers: {}}, url.parse(uri)), function (res) {
                        res.pipe(writable);
                    });
                    req.end();
                });
            };
            let result = new stream.PassThrough();
            _(EOF).pipe(request("http://composix.nl/composix/api/petstore/swagger.json")).pipe(result);
            result.on("data", function (data) {
                expect(JSON.parse(data.toString()).swagger).to.equal("2.0");
            });
            result.on("end", function () {
                done();
            })
        });

        xit("Google", function () {
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

        xit("PartyAgenda", function () {
            _.node({
                "salsa_nl": request("http://www.salsa.nl/uitgaansagendas/latin-agenda.php").pipe($$({
                    "div.ibox": {
                        "div.agenda": ["h2.highlight", "p"]
                    }
                })).pipe(function (readable, writable) {
                    readable.on("data", function (readable) {
                        readable.on("data", function (readable) {
                            // TODO: think on how to structure this
                        })
                    });
                }),
                "latinnet": request("http://www.latinnet.nl/")
            }).pipe(function (readable, salsa_nl, latinnet) {

            });
        });
    });

}));