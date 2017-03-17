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

    _.mixin({
        keysDeep: function cpx$keysDeep(entity) {
            var result = [];
            if (entity instanceof Object) {
                // now it is no longer possible to iterate over strings
                _.each(entity, function(value, key) {
                    if (key !== "@") {
                        var flag = true;
                        _.each(_.keysDeep(value), function(tail) {
                            flag = false;
                            result.push([key, tail].join("."));
                        });
                        if (flag) {
                            result.push(key + "");
                        }
                    }
                });
            }
            return result;
        },
        all: function cpx$all(entity) {
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
        then: function cpx$then(entity, onFulfilled, onRejected) {
            //return onFulfilled(entity);
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
        }
    }, {
        chain: false
    });

    return _;
};
