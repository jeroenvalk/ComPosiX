var fs = require("fs");
var expect = require("chai").expect;
var _ = require("lodash");
var cpx = require("../../main/webapp");
require("../../main/javascript/underscore")(_);

describe('underscore', function () {
    var x = cpx.execute({
        '@': {
            '@': {
                deps: {
                    _: require("lodash")
                }
            },
            const$: {
                category: ["$get", "src/test/cpx/models/Category.json"]
            }
        }
    });

    it("keysDeep", function () {
        var rng = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

        // normal _.keys iterates over strings which would lead no infinite recursion for _.keysDeep
        expect(_.keys("HelloWorld")).to.deep.equal(rng);
        expect(_.keysDeep("HelloWorld")).to.deep.equal([]); // use new String('HelloWorld') instead

        // normal _.keys also counts non-enumerable own properties
        var helloWorld = new String("HelloWorld");
        helloWorld.test = 42;
        expect(_.keys(helloWorld)[10]).to.equal('test');

        var array = [1, 2, 3];
        array.test = 42;
        expect(_.keys(array)[3]).to.equal('test');

        // _.keysDeep respects enumerability and iteration
        expect(_.keysDeep(helloWorld)).to.deep.equal(rng);
        expect(_.keysDeep(array)).to.deep.equal(["0", "1", "2"]);

        (function () {
            expect(_.keysDeep(arguments)).to.deep.equal(['0.a', '1.b']);
        })({a: "a"}, {b: "b"});

        _([
            new String("HelloWorld"),
            1,
            {a: 1},
            [1, 2, 3]
        ]).each(function (obj) {
            expect(_.keysDeep(obj)).to.deep.equal(_.keys(obj));
        });

        _([
            {'a': [{'b': {'c': 3}}, 4]},
            {'a': [{'b': {'c': new Promise(_.wrap())}}, Promise.resolve(4)]}
        ]).each(function (obj) {
            var paths = _.keysDeep(obj);
            var result = _.zipObjectDeep(paths, _.at(obj, paths));
            //console.log(JSON.stringify(result));
            expect(result).to.deep.equal(obj);
        });
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

    it('all', function (done) {
        _.all([{
            a: 1
        }]);
        _([Promise.resolve(1), Promise.resolve(2)]).all().then(function (result) {
            expect(result).to.deep.equal([1, 2]);
            done();
        });
    });

    it('then', function () {
        _([
            1,
            {a: 1},
            [1, 2],
            new String("a"),
            "a"
        ]).each(function (value) {
            expect(_(value).then(function (val) {
                expect(val).to.equal(value);
                return val;
            })).to.equal(value);
        })
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

});
