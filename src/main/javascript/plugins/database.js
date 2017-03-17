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

/* globals describe, it */

module.exports = function (_) {
    'use strict';

    var groupBy = function(keys, query, data) {
        _.each(_.pick(query, keys), function(query, key) {
            _.each(data[key], function(value) {
                groupBy(keys, query, value);
            });
            if (query.groupBy) {
                data[key] = _.groupBy(data[key], query.groupBy);
            }
        });
    };

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

    _.mixin({
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
            var result = {
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
        sequelizeIncludes: function (x, includes) {
            //return _(db).then(function (x) {
            var result = _.map(includes, function(value, key) {
                return _.extend({model: x[key], as: key}, _.pick(value, ['where', 'required']), _.sequelizeIncludes(x, _.pick(value, _.keys(x))));
            });
            return result.length > 0 ? {
                include: result
            } : {};
            //});
        },
        sequelizeQuery: function (x, query) {
            //return _(db).then(function (x) {
            return _.mapValues(query, function (value, key) {
                var includes = _.pick(value, _.keys(x));
                return {
                    sequelize: [x[key], "findAll", _.extend(_.pick(value, ['where']), _.sequelizeIncludes(x, includes))],
                    groupBy: value.groupBy,
                    includes: includes
                };
            });
            //});
        },
        query: function (db, query) {
            return new Promise(function (resolve, reject) {
                db.sequelize.then(function (x) {
                    _.each(_.sequelizeQuery(x, query), function(value, key) {
                        _.attempt(_.spread(_.bindKey)(value.sequelize)).then(function (array) {
                            var data = _.zipObject([key], [_.map(array, function (item) {
                                return item.get({plain: true});
                            })]);
                            groupBy(_.keys(x), query, data);
                            resolve(data);
                        });
                    });
                }).catch(function(e) {
                    console.log(e.stack);
                });
            });
        }
    }, {
        chain: false
    });

    return _;
};
