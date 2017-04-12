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

    var flattenDeep = _.flattenDeep;

    _.mixin({
        definition: function (schema) {
            if (!schema) {
                throw new Error();
            }
            return {
                type: 'object',
                properties: _.mapValues(schema, function (value) {
                    var isArray = value instanceof Array;
                    if (isArray) {
                        // TODO: properly handle optional fields
                        value = value[0];
                    }
                    if (_.isString(value)) {
                        return {
                            type: value
                        }
                    }
                    if (isArray) {
                        return {
                            type: 'array',
                            items: value
                        }
                    }
                    return value;
                })
            }
        },
        flattenDeep: function core$flattenDeep(object) {
            if (object instanceof Promise) {
                return object.then(function (result) {
                    return _.flattenDeep(result);
                });
            }
            if (object instanceof Array) {
                return flattenDeep(object);
            }
            var i = 0, index = [];
            var aux = _.map(object, function (value, key) {
                if (value instanceof Promise) {
                    index.push(i);
                }
                ++i;
                return _.flattenDeep(value);
            });
            if (!index.length) {
                return _.flatten(aux);
            }
            //console.log(aux);
            return Promise.all(_.at(aux, index)).then(function (result) {
                for (var i = 0; i < index.length; ++i) {
                    aux[index[i]] = result[i];
                }
                return _.flatten(aux);
            });
        },
        keysDeep: function core$keysDeep(entity) {
            var result = [];
            if (entity instanceof Object) {
                // now it is no longer possible to iterate over strings
                _.each(entity, function (value, key) {
                    if (key !== "@") {
                        var flag = true;
                        _.each(_.keysDeep(value), function (tail) {
                            flag = false;
                            tail.unshift(key);
                            result.push(tail);
                        });
                        if (flag) {
                            result.push([key]);
                        }
                    }
                });
            }
            return result;
        },
        all: function core$all(entity) {
            var keys = _.keysDeep(entity);
            var array = _.at(entity, keys);
            var i, index = [];
            for (i = 0; i < array.length; ++i) {
                if (array[i] instanceof Promise) {
                    index.push(i);
                }
            }
            if (index.length > 0) {
                var promise = new Array(index.length);
                for (i = 0; i < index.length; ++i) {
                    promise[i] = array[index[i]];
                }
                return Promise.all(promise).then(function (res) {
                    for (var i = 0; i < index.length; ++i) {
                        _.set(entity, keys[index[i]], res[i]);
                    }
                    return entity;
                });
            } else {
                return entity;
            }
        },
        then: function core$then(entity, onFulfilled, onRejected) {
            var result = _(entity).all();
            return result instanceof Promise ? result.then(onFulfilled, onRejected) : onFulfilled(result);
        },
        isPromise: function core$isPromise(entity) {
            return typeof entity.then === "function";
        },
        isReadable: function core$isStream(entity) {
            return typeof entity.on === "function" && typeof entity.end === "function";
        },
        toPromise: function core$toPromise(entity, value) {
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
        }
    }, {
        chain: false
    });

    return _;
};
