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

describe('xml', _.globals(function ($) {
    'use strict';

    const _ = $._.runInContext(), expect = $.expect;

    before(function () {
        require("../../../main/javascript/plugins/xml")(_);
    });

    it("toXML", function () {
        let object = {
            "test.xml": {
                "@": {
                    "root": {}
                },
                "alice": "bob"
            }
        };
        _.toXML(object, "test.xml");
        expect(object["test.xml"]).to.deep.equal("<root><alice>bob</alice></root>");

        object = {
            "test.xml": {
                "@": {
                    "root": {}
                },
                "alice": {
                    "bob": "charlie",
                    "david": "edgar"
                }
            }
        };
        _.toXML(object, "test.xml");
        expect(object["test.xml"]).to.deep.equal("<root><alice><bob>charlie</bob><david>edgar</david></alice></root>");

        object = {
            "test.xml": {
                "@": {
                    "root": {}
                },
                "alice": {
                    "bob": ["charlie", "david"]
                }
            }
        };
        _.toXML(object, "test.xml");
        expect(object["test.xml"]).to.deep.equal("<root><alice><bob>charlie</bob><bob>david</bob></alice></root>")

        object = {
            "test.xml": {
                "@": {
                    "alice": {
                        "charlie": "david",
                        $: "bob"
                    }
                }
            }
        };
        _.toXML(object, "test.xml");
        expect(object["test.xml"]).to.deep.equal('<alice charlie="david">bob</alice>');
    });

}));
