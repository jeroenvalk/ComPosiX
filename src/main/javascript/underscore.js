var expect = require('chai').expect;

module.exports = function (_) {

    var getType = function cpx$getType(type, key) {
        if (type instanceof Object) {
            return type.$ref ? type : _.extend({
                    type: "object",
                    properties: _.swagger(type)
                },
                key ? {
                    xml: {
                        name: key
                    }
                } : {});
        }

        if (typeof type === "string") {
            return {
                type: type
            };
        }
        throw new Error("invalid model: " + key);
    };

    var testHierarchy = function cpx$testHierarchy(hierarchy) {
        _.each(hierarchy, function(value, key) {
            if (/[.]describe[_\s][^.]*/.test(key)) {
                describe(key, function() {
                    testHierarchy(value);
                });
            } else if (/[.]it[_\s][^.]*/.test(key)) {
                it(key, function() {
                   expect(value.actual).to.deep.equal(value.expected);
                });
            }
        });
    };

    _.mixin({
        keysDeep: function cpx$keysDeep(entity) {
            var result = [];
            if (entity instanceof Object) {
                // now it is no longer possible to iterate over strings
                _.each(entity, function(value, key) {
                    var flag = true;
                    _.each(_.keysDeep(value), function(tail) {
                        flag = false;
                        result.push([key, tail].join("."));
                    });
                    if (flag) {
                        result.push(key + "");
                    }
                });
            }
            return result;
        },
        hierarchy: function cpx$hierarchy(regex, entity) {
            var paths = _.map(_(entity).keysDeep(), function(path) {
                path = "." + path;
                var i = 0, j, result = [];
                while ((j = path.indexOf(".", j + 1)) >= 0) {
                    if (regex.test(path.substring(i, j))) {
                        result.push(path.substring(i,j));
                        i = j;
                    }
                }
                return result;
            });
            return _.zipObjectDeep(paths, _.map(paths, function(path) {
                return _.get(entity, path.join("").substr(1));
            }));
        },
        test: function(entity) {
            entity = _.hierarchy(/[.](describe)|(it)[_\s][^.]*/, entity);
            testHierarchy(entity);
        },
        all: function cpx$all(entity) {
            var array = _.at(entity, _.keysDeep(entity));
            var i, index = [], result = new Array(array.length);
            for (i = 0; i < array.length; ++i) {
                if (array[i] instanceof Promise) {
                    index.push(i);
                } else {
                    result[i] = array[i];
                }
            }
            if (index.length > 0) {
                var promise = new Array(index.length);
                for (i = 0; i < index.length; ++i) {
                    promise[i] = array[index[i]];
                }
                return Promise.all(promise).then(function (res) {
                    for (var i = 0; i < index.length; ++i) {
                        result[index[i]] = res[i];
                    }
                    return result;
                });
            } else {
                return result;
            }
        },
        then: function cpx$then(entity, onFulfilled, onRejected) {
            return onFulfilled(entity);
            var result = _(entity).all();
            return result instanceof Promise ? result.then(onFulfilled, onRejected) : onFulfilled(result);
        },
        isPromise: function cpx$isPromise(entity) {
            return typeof entity.then === "function";
        },
        isReadable: function cpx$isStream(entity) {
            return typeof entity.on === "function" && typeof entity.end === "function";
        },
        toPromise: function cpx$toPromise(entity, value) {
            if (entity instanceof Promise && !value) {
                return entity;
            }
            if (value instanceof Promise) {
                return value.then(function (value) {
                    return _.toPromise(entity, value);
                })
            }
            return new Promise(function (resolve, reject) {
                if (_.isPromise(entity)) {
                    entity.then(function (val) {
                        value = value || val;
                        if (value instanceof Error) {
                            reject(value);
                        } else {
                            resolve(value);
                        }
                    }, function (e) {
                        if (e instanceof Error) {
                            reject(e);
                        } else {
                            resolve(e);
                        }
                    });
                } else if (_.isReadable(entity)) {
                    if (!(value instanceof Array)) {
                        value = value ? [value] : [];
                    }
                    try {
                        entity.on('data', function (data) {
                            value.push(data);
                        });
                        entity.on('end', function () {
                            resolve(result);
                        });
                    } catch (e) {
                        if (e instanceof Error) {
                            reject(e);
                        } else {
                            resolve(e);
                        }
                    }
                } else {
                    if (e instanceof Error) {
                        reject(e);
                    } else {
                        resolve(e);
                    }
                }
            });
        },
        swagger: function cpx$models(models) {
            return _.mapValues(models, _.bind(function (value, key) {
                if (value instanceof Array) {
                    switch (value.length) {
                        case 1:
                            return {
                                type: "array",
                                items: getType(value[0])
                            }
                        case 2:
                            return _.extend({type: value[0]}, value[1]);
                        default:
                            throw new Error("syntax error");
                    }
                }
                return getType(value, key);
            }, this));
        },
        database: function (options) {
            var Sequelize = options.Sequelize;
            options = options.environment;
            //var result = new stream.PassThrough({objectMode: true});
            var sequelize = new Sequelize(options.database, options.username, options.password, {
                host: options.host,
                dialect: 'mysql',
                pool: {
                    max: 5,
                    min: 0,
                    idle: 10000
                }
            });
            var x = {};
            result = {
                swagger: function (models) {
                    var refs = [];
                    _.extend(x, _.mapValues(models, function (value, name) {
                        if (value.type !== "object") {
                            throw new Error();
                        }
                        return sequelize.define(name.toLowerCase(), _.extend({
                            ID: {
                                type: Sequelize.STRING(36),
                                column: Sequelize.UUID,
                                defaultValue: Sequelize.UUIDV1,
                                primaryKey: true
                            }
                        }, _.mapValues(_.pickBy(value.properties, function (value, key) {
                            if (value.type === "array") {
                                refs.push([name, value.items.$ref.split('/')[2], key]);
                            }
                            return value.type !== "array";
                        }), function (value) {
                            return {
                                type: Sequelize[value.type.toUpperCase()],
                                allowNull: true,
                                defaultValue: null
                            }
                        })), {
                            freezeTableName: true
                        });
                    }));

                    _.each(refs, function (ref) {
                        x[ref[0]].hasMany(x[ref[1]], {as: ref[2]});
                    });

                    return result;
                },
                sequelize: _.toPromise(sequelize.authenticate(), x)
            };
            return result;
        },
        sequelizeIncludes: function (db, includes) {
            return _(db).then(function (x) {
                var result = _.map(includes, function(value, key) {
                    return _.extend({model: x[key], as: key}, _.pick(value, ['where', 'required']), _.sequelizeIncludes(x, _.pick(value, _.keys(x))));
                });
                return result.length > 0 ? {
                    include: result
                } : {};
            });
        },
        sequelizeQuery: function (db, query) {
            return _(db).then(function (x) {
                return _.mapValues(query, function (value, key) {
                    var includes = _.pick(value, _.keys(x));
                    return {
                        sequelize: [x[key], "findAll", _.extend(_.pick(value, ['where']), _.sequelizeIncludes(x, includes))],
                        groupBy: value.groupBy,
                        includes: includes
                    };
                });
            });
        },
        query: function (db, query) {
            return new Promise(function (resolve, reject) {
                db.sequelize.then(function (x) {
                    query = _.sequelizeQuery(x, query);
                    _.each(query, function(value, key) {
                        _.attempt(_.spread(_.bindKey)(value.sequelize)).then(function (array) {
                            var data = _.zipObject([key], [_.map(array, function (item) {
                                return item.get({plain: true});
                            })]);
                            resolve(data);
                        });
                    });
                });
            });
        }
    }, {
        chain: false
    });

    return _;
};
