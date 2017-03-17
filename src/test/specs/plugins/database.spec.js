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

describe('database', _.globals(function ($) {
    'use strict';

    var fs = require("fs");

    var _ = $._.runInContext(), cpx = new $.ComPosiX(), expect = $.expect;

    before(function () {
        require("../../../main/javascript/plugins/core")(_);
        require("../../../main/javascript/plugins/database")(_);
    });

    it('swagger', function () {
        var category = JSON.parse(fs.readFileSync('src/test/cpx/models/Category.json'));
        var actual = _.swagger(_.extend({}, category));
        expect(actual.Category).to.deep.equal(JSON.parse(fs.readFileSync('src/test/cpx/models/swagger.json')).definitions.Category);
    });

    it('sequelize', function () {
        var result = _.sequelizeQuery(
            {
                Company: "$Company$",
                Department: "$Department$",
                Application: "$Application$"
            },
            {
                Company: {
                    groupBy: ['kvknumber'],
                    Department: {
                        where: {
                            kvknumber: {
                                $col: 'company.kvknumber'
                            }
                        },
                        required: false,
                        Application: {
                            required: false
                        }
                    }
                }
            }
        );
        //console.log(JSON.stringify(result));
        expect(result).to.deep.equal({
            "Company": {
                "sequelize": [
                    "$Company$",
                    "findAll",
                    {
                        "include": [
                            {
                                "as": "Department",
                                "model": "$Department$",
                                "where": {
                                    "kvknumber": {
                                        "$col": "company.kvknumber"
                                    }
                                },
                                "required": false,
                                "include": [
                                    {
                                        "as": "Application",
                                        "model": "$Application$",
                                        "required": false
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "groupBy": [
                    "kvknumber"
                ],
                "includes": {
                    "Department": {
                        "where": {
                            "kvknumber": {
                                "$col": "company.kvknumber"
                            }
                        },
                        "required": false,
                        "Application": {
                            "required": false
                        }
                    }
                }
            }
        });
    });

}));
