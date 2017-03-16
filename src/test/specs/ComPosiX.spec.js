var _ = require("lodash");
var cpx = require("../../main/webapp");
//require("../../main/javascript/underscore")(_);

var expect = require("chai").expect;

describe('ComPosiX', function () {

    cpx.execute({
        '@': {
            '@': {
                deps: _
            }
        },
        $dependencies: [{
            _: _
        }]
    });

    cpx.execute({
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
        },
        it_core: {
            '@': {
                attr: function() {
                    return "HelloWorld";
                }
            },
            expected: 'HelloWorld',
            '$_:set': ["actual", "@attr"]
        },
        "$_:test": []
    });

    var attr = {
        "@": {
            deps: {
                _: _
            }
        }
    };

    it('set', function () {
        var x = cpx.execute({
            "@": attr,
            "simple": {
                "$_:set": ["a[0].b.c", 4],
                "a": [{"b": {"c": 3}}]
            },
            "multi": {
                "$_:set": {
                    "one": ["a[0].b.c", 5],
                    "two": [['x', '1', 'y', 'z'], 6]
                },
                "two": {
                    "x": [2]
                }
            }
        })

        expect(x['@']).not.to.equal(attr);
        expect(x['@']).to.deep.equal(attr);
        expect(_.omit(x, '@')).to.deep.equal({
            "simple": {"a": [{"b": {"c": 4}}]},
            "multi": {
                "one": {"a": [{"b": {"c": 5}}]},
                "two": {"x": [2, {"y": {"z": 6}}]}
            }
        });
    })
})