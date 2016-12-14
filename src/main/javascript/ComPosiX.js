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

module.exports = class ComPosiX {

    constructor(deps) {
        this.deps = {
            cpx: this,
            logger: null,
            path: null,
            http: null,
            _: null,
            request: null
        };
        this._registry = {
            ComPosiX: this
        };
        this.data = {};
        this.dependencies(deps, this.deps);
    }

    dependencies(deps) {
        for (var i = 1; i < arguments.length; ++i) {
            for (var name in arguments[i]) {
                if (arguments[i].hasOwnProperty(name)) {
                    switch(arguments[i][name]) {
                        case null:
                            if (deps[name] === undefined || deps[name] === null) {
                                throw new Error("unresolved dependency: " + name);
                            }
                            arguments[i][name] = deps[name];
                            break;
                        default:
                            if (deps[name] !== undefined && arguments[i][name] !== deps[name]) {
                                throw new Error("changed static dependency: " + name);
                            }
                            break;
                    }
                }

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
        var _ = this.deps._;
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
        } else if (entity instanceof Object) {
            key = trail.pop();
            entity['@@'] = key;
            trail.push(entity);
            this.dispatch(trail);
            entity = trail[trail.length - 1];
            if (key !== null) {
                trail[trail.length - 2][key] = entity;
            }
            key = _(entity).keys();
            for (var i = 0; i < key.length; ++i) {
                trail.push(key[i]);
                this.execute(entity[key[i]], trail);
                trail.pop();
            }
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
                    object = this[key].call(this, object, subtask[key], true);
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
        var proxy = new Proxy(this.deps, arg.name);
        proxy.listen(arg.port);
        return object;
    }

};
