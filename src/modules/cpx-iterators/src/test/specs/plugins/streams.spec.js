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

    const _ = use._.runInContext(), expect = use.chai.expect, https = use.https;

    before(function () {
        require("../../../main/javascript/plugins/streams")(_);
    });

    let node, $$, request;

    const speedtest = function(done) {
        const uri = "https://service.adreskenmerken.eu/LocatieService30/locatieService.asmx";
        const req = https.request(_.extend({method: "POST", headers: {"Content-Type": "application/soap+xml"}}, url.parse(uri)), function (res) {
            res.on("data", function() {
                console.log("CHUNK");
            })
            res.on("end", function() {
                done();
            })
        });
        req.end('<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope"><s:Body><v3:GeefLocaties xmlns:v3="http://tntpost.nl/parcels/customerInteraction/locatieService/v3.0/" xmlns:dat="http://tntpost.nl/parcels/customerInteraction/datatypes/" xmlns:dat1="http://tntpost.nl/parcels/global/datatypes/"> <v3:Adres> <dat:Postcode>3532VA</dat:Postcode> <dat:LandCode>NL</dat:LandCode> </v3:Adres> <v3:Klantnummers/> <v3:Diensten> <v3:Dienst> <v3:Code>PG</v3:Code> </v3:Dienst> </v3:Diensten> <v3:Partners/> <v3:BronCode>11</v3:BronCode> <v3:MaxAantalLocaties>20</v3:MaxAantalLocaties> <v3:AanleverDatum>2018-03-17</v3:AanleverDatum> <v3:OpeningsTijd>16:00:00</v3:OpeningsTijd> <v3:LogistiekeCode> <dat1:Code>000</dat1:Code> </v3:LogistiekeCode> <v3:ProductOptie> <dat1:OptieSrt> <dat1:Code>000</dat1:Code> </dat1:OptieSrt> <dat1:KenmSrt> <dat1:Code>118</dat1:Code> </dat1:KenmSrt> </v3:ProductOptie> </v3:GeefLocaties></s:Body></s:Envelope>');
    };

    it('speedtest', speedtest);
    it('speedtest', speedtest);
    it('speedtest', speedtest);
    it('speedtest', speedtest);
    it('speedtest', speedtest);
    it('speedtest', speedtest);
    it('speedtest', speedtest);
    it('speedtest', speedtest);
    it('speedtest', speedtest);
    it('speedtest', speedtest);
    it('speedtest', speedtest);

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

    it("swagger", function (done) {
        let EOF = _.node(function (writable) {
            writable.end();
        }, 1);
        request = function (uri) {
            return _.node(function (readable, writable) {
                const req = https.request(_.extend({method: "POST", headers: {"Content-Type": "application/soap+xml"}}, url.parse(uri)), function (res) {
                    res.pipe(writable);
                });
                req.end('<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope"><s:Body><v3:GeefLocaties xmlns:v3="http://tntpost.nl/parcels/customerInteraction/locatieService/v3.0/" xmlns:dat="http://tntpost.nl/parcels/customerInteraction/datatypes/" xmlns:dat1="http://tntpost.nl/parcels/global/datatypes/"> <v3:Adres> <dat:Postcode>3532VA</dat:Postcode> <dat:LandCode>NL</dat:LandCode> </v3:Adres> <v3:Klantnummers/> <v3:Diensten> <v3:Dienst> <v3:Code>PG</v3:Code> </v3:Dienst> </v3:Diensten> <v3:Partners/> <v3:BronCode>11</v3:BronCode> <v3:MaxAantalLocaties>20</v3:MaxAantalLocaties> <v3:AanleverDatum>2018-03-17</v3:AanleverDatum> <v3:OpeningsTijd>16:00:00</v3:OpeningsTijd> <v3:LogistiekeCode> <dat1:Code>000</dat1:Code> </v3:LogistiekeCode> <v3:ProductOptie> <dat1:OptieSrt> <dat1:Code>000</dat1:Code> </dat1:OptieSrt> <dat1:KenmSrt> <dat1:Code>118</dat1:Code> </dat1:KenmSrt> </v3:ProductOptie> </v3:GeefLocaties></s:Body></s:Envelope>');
            });
        };
        let result = new stream.PassThrough();
        let aux = _(EOF).pipe(request("https://service.adreskenmerken.eu/LocatieService30/locatieService.asmx")).pipe(result);
        result.on("data", function (data) {
            //console.log(data);
            //expect(JSON.parse(data.toString()).swagger).to.equal("2.0");
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

}));