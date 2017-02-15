/**
 * Copyright © 2016-2017 dr. ir. Jeroen M. Valk
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
    request: null,
    local: null
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
        deps.logger = entity || deps.logger || null;
        deps.path = deps.path || require('path');
        deps.fs = deps.fs || require('fs');
        deps.http = deps.http || require('http');
        deps._ = deps._ || require('lodash');
        deps.request = deps.request || require('request');
        var path = deps.path;
        deps.pathname = path.resolve(deps.pathname || 'ComPosiX.js');
        this.dependencies(null, deps);
        var bootstrap = require(deps.pathname);
        this.execute(bootstrap);
        // TODO: add $logger:info task to get logging output
        this.deps.logger && this.deps.logger.info(bootstrap);
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

    _() {
        var result = this.deps._;
        if (!result) {
            throw new Error('implementation for _ is required, e.g., Lodash or UnderscoreJS');
        }
        return result;
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
        //console.log('DEPENDENCIES');
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
        //console.log('REGISTER');
        if (path) {
            return this.registry(path).register(entity);
        }
        _.merge(this.data, entity);
    }

    execute(entity, trail, parent) {
        //console.log('EXECUTE');
        var i, key;
        if (!trail) {
            trail = [];
            parent = [];
        }
        if (entity instanceof Array) {
            parent.push(entity);
            for (i = 0; i < entity.length; ++i) {
                trail.push(i);
                this.execute(entity[i], trail, parent);
                if (trail.pop() !== i) {
                    throw new Error('internal error: ' + i);
                }
            }
            if (entity !== parent.pop()) {
                throw new Error('internal error');
            }
        } else if (entity instanceof Object) {
            parent.push(entity);
            for (key in entity) {
                if (entity.hasOwnProperty(key)) {
                    switch (key.charAt(0)) {
                        case '@':
                        case '$':
                            break;
                        default:
                            trail.push(key);
                            this.execute(entity[key], trail, parent);
                            if (trail.pop() !== key) {
                                throw new Error('internal error: ' + key);
                            }
                            break;
                    }
                }
            }
            if (entity !== parent.pop()) {
                throw new Error('internal error');
            }
            this.dispatch(entity, trail, parent);
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

    evaluate(expression) {
        var i = expression[0].substr(1).split(':');
        switch (i.length) {
            case 1:
                i.unshift('_');
                break;
            case 2:
                break;
            default:
                throw new Error('invalid method: ' + i.join(':'));
        }
        var dep = this.deps[i[0]];
        if (!dep) {
            throw new Error('missing dependency: ' + i[0]);
        }
        switch (i[1]) {
            case 'chain':
                expression = expression[1].reverse();
                for (i = expression.length - 2; i >= 0; --i) {
                    expression[i] = this.deps.path.join(expression[i + 1], expression[i]);
                }
                break;
            default:
                if (typeof this.deps[i[0]][i[1]] === 'function') {
                    expression = this.deps[i[0]][i[1]].apply(this.deps[i[0]], expression.slice(1));
                } else {
                    throw new Error('cannot invoke ' + i[0] + '.' + i[1]);
                }
                break;
        }
        return expression;
    }

    recurse(expression, attr) {
        var i, result;
        if (expression instanceof Array) {
            result = new Array(expression.length);
            for (i = 0; i < expression.length; ++i) {
                result[i] = this.recurse(expression[i], attr);
            }
            if (typeof result[0] === 'string' && result[0].charAt(0) === '$') {
                return this.evaluate(result);
            }
            return result;
        }
        if (expression instanceof Object) {
            result = {};
            for (i in expression) {
                if (expression.hasOwnProperty(i)) {
                    result[i] = this.recurse(expression[i], attr);
                }
            }
            return result;
        }
        if (typeof expression === 'string' && expression.charAt(0) === '@') {
            // TODO: nice error message on unresolved attribute while substituting
            return this.recurse(attr[expression.substr(1)]);
        }
        return expression;
    }

    normalize(object, trail, parent) {
        var _, key, attr;
        // TODO: fix processing of direct $task directives and direct @attr attributes
        //this.attributes(object['@'], object['@']);
        var task = {};
        attr = {};
        for (key in object) {
            if (object.hasOwnProperty(key)) {
                switch (key.length) {
                    case 0:
                        throw new Error('empty property');
                    case 1:
                        if (!_) _ = this._();
                        switch (key) {
                            case '@':
                                _.extend(attr, object['@']);
                                _.extend(task, object['@'].$);
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
        if (false && attr['^']) {
            var path = this.deps.path.posix;
            if (typeof attr['^'] === 'string') {
                attr['^'] = path.normalize(attr['^']).split('/');
                for (key = 0; key < attr['^'].length; ++key) {
                    if (attr['^'][key] !== '..') {
                        break;
                    }
                }
                attr['^'] = {
                    depth: key,
                    path: attr['^'].slice(key)
                };
                key = parent.length - key;
                if (parent[key]) {
                    attr['^'].parent = parent[key];
                    attr['^'].trail = trail.slice(key);
                } else {
                    throw new Error();
                }
            } else {
                delete attr['^'];
            }
        }
        attr.$ = task;
        object['@'] = attr;
    }

    dispatch(object, trail, parent) {
        // TODO: refactor to split processing from the ComPosiX object
        // TODO: add logging using Bunyan to get a full trace
        // TODO: create a tool that splits the log accross files to allow diff compares
        // TODO: http://json-diff.com/
        // console.log('DISPATCH');
        var _ = this.deps._;
        var key, name, attr;
        this.normalize(object, trail, parent);
        var task = object['@'].$, dep, context, target;
        for (key in task) {
            if (task.hasOwnProperty(key)) {
                if (!attr) {
                    attr = (key === 'dependencies' ? null : _.extend.apply(_, _.map([{'@': {}}].concat(parent.slice(0)).concat([object]), '@')));
                    for (name in attr) {
                        if (name !== '^' && name !== '$' && attr.hasOwnProperty(name)) {
                            attr[name] = this.recurse(attr[name], attr);
                        }
                    }
                }
                context = task[key];
                switch (key) {
                    case 'dependencies':
                        // do not recurse because dependencies can be cyclic
                        break;
                    default:
                        context = this.recurse(context, attr);
                        break;
                }
                if (context instanceof Object) {
                    if (!(context instanceof Array)) {
                        for (target in context) {
                            if (context.hasOwnProperty(target)) {
                                if (!(context[target] instanceof Array)) {
                                    throw new Error("multitask '" + key + "' ambiguity in context: " + JSON.stringify(context));
                                }
                            }
                        }
                    }
                } else {
                    throw new Error("task '" + key + "' ambiguity in context: " + JSON.stringify(context));
                }
                key = key.split(':');
                switch (key.length) {
                    case 1:
                        dep = this;
                        key = key[0];
                        if (!this[key]) {
                            throw new Error('method not defined: ' + key);
                        }
                        break;
                    case 2:
                        dep = this.deps[key[0]];
                        if (!dep) {
                            throw new Error('unresolved dependency: ' + key[0]);
                        }
                        if (!dep[key[1]]) {
                            console.log(dep);
                            throw new Error('method not defined: ' + key.join(':'));
                        }
                        key = key[1];
                        break;
                }
                if (context instanceof Array) {
                    dep[key].apply(dep, [object].concat(context));
                } else {
                    for (target in context) {
                        if (context.hasOwnProperty(target)) {
                            object[target] = dep[key].apply(dep, [object].concat(context[target]));
                        }
                    }
                }
            }
        }
    }

    which(object, file, search) {
        var i, j;
        var path = this.deps.path;
        var fs = this.deps.fs;
        var basedir = path.resolve(path.dirname(this.deps.pathname || '.'));
        for (i = 0; i < file.length; ++i) {
            if (search.length === 1) {
                // existence check not needed if only one choice possible
                file[i] = path.resolve(basedir, search[0], file[i]);
            } else {
                for (j = 0; j < search.length; ++j) {
                    try {
                        if (fs.statSync(path.resolve(basedir, search[j], file[i])).isFile()) {
                            file[i] = path.resolve(basedir, search[j], file[i]);
                            break;
                        }
                    } catch (e) {
                        // not found
                    }
                }
            }
            if (j === search.length) throw new Error('file not found: ' + file[i]);
        }
        return file;
    }

    extend(object, arg) {
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
