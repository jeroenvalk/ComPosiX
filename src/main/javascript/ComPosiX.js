/**
 * Copyright © 2016 dr. ir. Jeroen M. Valk
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

var Proxy = require('./Proxy');

var dependencies = {
    path: null,
    fs: null,
    http: null,
    request: null
};

module.exports = class ComPosiX {

    constructor() {
        this.deps = Object.create(dependencies);
        this.deps.cpx = this;
        this.deps.logger = null;
        this.deps._ = null;
        this._registry = {
            ComPosiX: this
        };
        this.data = {};
    }

    boot(entity, deps) {
        if (!deps) {
            deps = {};
        }
        deps.logger = deps.logger || null;
        deps.path = deps.path || require('path');
        deps.fs = deps.fs || require('fs');
        deps.http = deps.http || require('http');
        deps._ = deps._ || require('lodash');
        deps.request = deps.request || require('request');
        var path = deps.path;
        deps.pathname = path.resolve(deps.pathname || 'ComPosiX.js');
        this.dependencies(null, deps);
        this.execute(require(deps.pathname));
    }

    install(entity, _) {
        var cpx = this;
        var deep = function (a, b) {
            return _.isObject(a) && _.isObject(b) ? _.extend(a, b, deep) : b;
        };
        var extend = _.extend;
        _.mixin(_.extend({
            register: function cpx$register() {
                cpx.register.apply(cpx, arguments);
            },
            execute: function cpx$execute() {
                cpx.execute.apply(cpx, arguments);
            },
            trail: function cpx$trail(object, path) {
                if (!(path instanceof Array)) {
                    path = _.toPath(path);
                }
                var result = new Array(path.length + 1);
                result[0] = object;
                for (var i = 0; i < path.length; ++i) {
                    if (object) {
                        object = object[path[i]];
                        result[i + 1] = object;
                    } else {
                        break;
                    }
                }
            }
        }, _.merge ? {} : {
            extend: function cpx$extend() {
                var argv = Array.prototype.slice.call(arguments);
                var fn = _(argv).find(_.isFunction);
                if (!fn) {
                    return extend.apply(_, argv);
                }
                var target = argv.shift();
                _(argv).each(function (source) {
                    _(_(source).allKeys()).each(function (key) {
                        target[key] = fn(target[key], source[key]);
                    })
                });
                return target;
            },
            merge: function cpx$merge() {
                var argv = Array.prototype.slice.call(arguments);
                argv.push(deep);
                return _.extend.apply(_, argv);
            }
        }, _.toPath ? {} : {
            toPath: function cpx$toPath(path) {
                return _.compact(path.split(/[.[\]]/));
            }
        }));
        if (entity instanceof Object) {
            entity._ = _;
        }
    }

    throwError(entity, msg) {
        var e = new Error(msg);
        if (entity instanceof Object) {
            entity.ERROR = e;
        } else {
            throw e;
        }
    }

    dependencies(entity, deps) {
        console.log('DEPENDENCIES');
        var scope;
        for (var name in this.deps) {
            if (this.deps.hasOwnProperty(name)) {
                scope = this.deps;
            } else {
                scope = dependencies;
            }
            switch (scope[name]) {
                case null:
                    if (deps[name] === undefined) {
                        this.throwError(entity, "unresolved dependency: " + name);
                    }
                    scope[name] = deps[name];
                    break;
                default:
                    if (deps[name] !== undefined && scope[name] !== deps[name]) {
                        this.throwError(entity, "dependency change: " + name);
                    }
                    break;
            }
        }
    }

    registry(path) {
        if (path) {
            var part = path.split('.', 2);
            return this._registry[part[0]].registry(part[1]);
        }
        return this;
    }

    register(entity, path) {
        var _ = this.deps._;
        console.log('REGISTER');
        if (path) {
            return this.registry(path).register(entity);
        }
        _.merge(this.data, entity);
    }

    execute(entity, trail) {
        console.log('EXECUTE');
        var i, key;
        if (!trail) {
            console.log(entity);
            trail = [null];
        }
        if (entity instanceof Array) {
            entity['@@'] = trail.pop();
            trail.push(entity);
            for (i = 0; i < entity.length; ++i) {
                trail.push(i);
                this.execute(entity[i], trail);
                trail.pop();
            }
            trail.pop();
        } else if (entity instanceof Object) {
            key = trail.pop();
            entity['@@'] = key;
            trail.push(entity);
            this.dispatch(trail);
            key = this.deps._(entity).keys();
            for (i = 0; i < key.length; ++i) {
                switch(key[i].charAt(0)) {
                    case '@':
                    case '$':
                        break;
                    default:
                        trail.push(key[i]);
                        this.execute(entity[key[i]], trail);
                        trail.pop();
                        break;
                }
            }
            trail.pop();
        }
    }

    trail(array) {
        var current = this.$;
        var result = [];
        var allowInsert = true;
        for (var i = 0; i < array.length; ++i) {
            if (allowInsert && current._insert) {
                allowInsert = false;
                result.push(current._insert[array[i]]._);
            } else {
                allowInsert = true;
                current = current[array[i]];
                if (current._) {
                    result.push(current._);
                }
            }
        }
        return result;
    }

    keys(object) {
        var i, j = 0, result = Object.keys(object);
        for (i = 0; i < result.length; ++i) {
            switch (result[i].charAt(0)) {
                case '@':
                case '_':
                    break;
                default:
                    result[j++] = result[i];
            }
        }
        return result.slice(0, j);
    }

    normalize(object) {
        var _ = this.deps._;
        var key, attr = {}, task = {}, subtask = {};
        for (key in object) {
            if (object.hasOwnProperty(key)) {
                switch (key.length) {
                    case 0:
                        throw new Error('empty property');
                    case 1:
                        switch (key) {
                            case '@':
                                _.extend(attr, object['@']);
                                delete object['@'];
                                break;
                            case '$':
                                _.extend(task, object.$);
                                delete object.$;
                                break;
                        }
                        break;
                    default:
                        switch (key.charAt(0)) {
                            case '@':
                                attr[key.substr(1)] = object[key];
                                delete object[key];
                                break;
                            case '$':
                                task[key.substr(1)] = object[key];
                                delete object[key];
                                break;
                        }
                }
            }
        }
        for (key in attr) {
            if (attr.hasOwnProperty(key)) {
                switch (key.length) {
                    case 0:
                        throw new Error('empty attribute');
                    case 1:
                        switch (key) {
                            case '$':
                                _.extend(subtask, attr.$);
                                delete attr.$;
                                break;
                        }
                        break;
                    default:
                        switch (key.charAt(0)) {
                            case '$':
                                subtask[key.substr(1)] = attr[key];
                                delete attr[key];
                                break;
                        }
                }
            }
        }
        object['@'] = attr;
        object.$ = task;
        attr.$ = subtask;
    }

    dispatch(trail) {
        console.log('DISPATCH');
        var object = trail.pop();
        this.normalize(object);
        console.log(object);
        var key, task = object.$, subtask = object['@'].$;
        for (key in subtask) {
            if (subtask.hasOwnProperty(key)) {
                if (this[key]) {
                    this[key].call(this, object, subtask[key], true);
                } else {
                    throw new Error('method not defined: ' + key);
                }
            }
        }
        for (key in task) {
            if (task.hasOwnProperty(key)) {
                if (this[key]) {
                    object = this[key].call(this, object, task[key], false);
                } else {
                    throw new Error('method not defined: ' + key);
                }
            }
        }
        trail.push(object);
    }

    resolve(object, param) {
        var path = this.deps.path;
        var fs = this.deps.fs;
        var key = this.keys(object);
        for (var i = 0; i < key.length; ++i) {
            var file = object[key[i]];
            for (var j = 0; j < file.length; ++j) {
                var chain = param.chain[path.extname(file[j])];
                var basedir = this.data['@'].basedir;
                for (var k = chain.length - 1; k >= 0; --k) {
                    basedir = path.resolve(basedir, chain[k]);
                    try {
                        if (fs.statSync(path.resolve(basedir, file[j])).isFile()) {
                            file[j] = path.resolve(basedir, file[j]);
                        }
                    } catch (e) {
                        // not found
                    }
                }
            }
        }
    }

    extend(object, arg, isAttr) {
        var key = this.keys(object);
        for (var i = 0; i < key.length; ++i) {
            this.normalize(object[key]);
            if (!object[key]['@']._.extend) {
                object[key]['@']._.extend = arg;
            }
        }
        return object;
    }

    include(object, arg) {
        var _ = this.deps._;
        _(_(arg).keys()).each(function (proto) {
            switch (proto) {
                case 'file':
                    object = require('./' + arg[proto].filename);
            }
        });
        return object;
    }

    listen(object, arg) {
        var proxy = new Proxy(this);
        proxy.listen(arg.port);
        return object;
    }

};
