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

module.exports = function processor(self) {
    'use strict';

    var cpx = this, object = self, trail = [], parent = [];

    var getAttribute = function processor$getAttribute(path) {
        var i, part = path.split("."), result = object['@'];
        if (result) {
            result = result[part[0]];
            if (result) {
                for (i = 1; i < part.length; ++i) {
                    result = result[part[i]];
                }
                return result;
            }
        }
        for (i = parent.length - 1; i >= 0; --i) {
            result = parent[i]['@'];
            if (result) {
                result = result[part[0]];
                if (result) {
                    for (i = 1; i < part.length; ++i) {
                        result = result[part[i]];
                    }
                    return result;
                }
            }
        }
        throw new Error(trail.join(".") + ": missing attribute: " + path);
    };

    var cpxRequire = function processor$cpxRequire(dep) {
        var result = recurse(getAttribute(["cpx","use",dep].join(".")));
        if (result instanceof Array) {
            var head = result.shift();
            if (typeof head === "string") {
                switch(head) {
                    case "lodash":
                    case "underscore":
                        head = require(head);
                        break;
                    default:
                        throw new Error(trail.join(".") + ": require forbidden: " + head);
                }
            }
            result = head.reduce(result, function(_, plugin) {
                if (typeof plugin === "string") {
                    plugin = require('./plugins/' + plugin);
                }
                plugin = plugin(_);
                return plugin || _;
            }, head.runInContext());
        }
        return result;
    };
    
    var isEmpty = function processor$isEmpty(object) {
        if (object instanceof Object) {
            for (var key in object) {
                if (object.hasOwnProperty(key)) {
                    return false;
                }
            }
        }
        return true;
    };
    
    var evaluate = function processor$evaluate(expression) {
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
        var dep = cpxRequire(i[0]);
        switch (i[1]) {
            case 'chain':
                expression = expression[1].reverse();
                for (i = expression.length - 2; i >= 0; --i) {
                    expression[i] = cpxRequire("path").join(expression[i + 1], expression[i]);
                }
                break;
            default:
                if (typeof dep[i[1]] === 'function') {
                    expression = dep[i[1]].apply(dep, expression.slice(1));
                } else {
                    throw new Error('cannot invoke ' + i[0] + '.' + i[1]);
                }
                break;
        }
        return expression;
    };

    var recurse = function processor$recurse(expression) {
        var i, result;
        if (expression instanceof Object) {
            if (expression instanceof Array) {
                result = new Array(expression.length);
                for (i = 0; i < expression.length; ++i) {
                    result[i] = recurse(expression[i]);
                }
                if (typeof result[0] === 'string' && result[0].charAt(0) === '$') {
                    return evaluate(result);
                }
                return result;
            }
            if (expression instanceof Function && isEmpty(expression)) {
                return expression.call(null);
            }
            switch(Object.getPrototypeOf(expression)) {
                case Object.prototype:
                    result = {};
                    for (i in expression) {
                        if (expression.hasOwnProperty(i)) {
                            result[i] = recurse(expression[i]);
                        }
                    }
                    return result;
                default:
                    throw new Error('invalid attribute content: ' + expression);
            }
        }
        if (typeof expression === 'string' && expression.charAt(0) === '@') {
            return recurse(getAttribute(expression.substr(1)));
        }
        return expression;
    };

    var normalize = function processor$normalize(object) {
        if (Object.getPrototypeOf(object) !== Object.prototype) {
            throw new Error(trail.join(".") + ": plain object expected");
        }
        if (object.$ && (Object.getPrototypeOf(object.$) !== Object.prototype || isEmpty(object.$))) {
            throw new Error('non-empty POJO expected: ' + trail.concat(["$"]).join("."));
        }

        var i, size, aux, key, path, task, attr = object['@'];
        if (attr) {
            if (attr['@']) {
                // already normalized
                return;
            }
            if (Object.getPrototypeOf(attr) !== Object.prototype || isEmpty(attr)) {
                throw new Error('non-empty POJO expected: ' + trail.concat(["@"]).join("."));
            }
            if (attr.$) {
                throw new Error('pending tasks found: ' + trail.concat(["@","$"]).join("."));
            }
        }
        attr = attr || {};
        if (object.$) {
            attr.$ = attr.$ ? _.extend(attr.$, object.$) : object.$;
            delete object.$;
        }
        task = attr.$ || {};
        for (key in object) {
            if (object.hasOwnProperty(key)) {
                switch (key.length) {
                    case 0:
                        throw new Error('empty property');
                    case 1:
                        break;
                    default:
                        aux = attr;
                        switch (key.charAt(0)) {
                            case '@':
                                path = key.substr(1).split(".");
                                size = path.length - 1; aux = attr;
                                for (i = 0; i < size; ++i) {
                                    if (aux[path[i]]) {
                                        aux = aux[path[i]];
                                        if (Object.getPrototypeOf(aux) !== Object.prototype) {
                                            throw new Error(trail.join(".") + ": cannot mixin: " + key);
                                        }
                                    } else {
                                        aux = aux[path[i]] = {};
                                    }
                                }
                                if (aux[path[size]]) {
                                    throw new Error(trail.join(".") + ": duplicate attribute: " + key);
                                }
                                aux[path[size]] = object[key];
                                delete object[key];
                                break;
                            case '$':
                                path = key.substr(1).split(".");
                                if (path.length !== 1) {
                                    throw new Error(trail.join(".") + ": invalid task name: " + key);
                                }
                                task[path[0]] = object[key];
                                delete object[key];
                                break;
                        }
                }
            }
        }
        if (!isEmpty(task)) {
            attr.$ = task;
        } else {
            delete attr.$;
        }
        if (!isEmpty(attr)) {
            object['@'] = attr;
        } else {
            delete object['@'];
        }
    };

    normalize(self);

    var _ = this.deps._ || cpxRequire("_");

    if (!(_ instanceof Object)) {
        throw new Error("ComPosiX processor requires Lodash or UnderscoreJS");
    }

    return {
        cpx: cpx,
        
        getLogger() {
            return {
                trace() {
                    // TODO: create a tool that splits the log accross files to allow diff compares
                    // TODO: http://json-diff.com/
                }
            }
        },

        dispatch() {
            // TODO: add logging using Bunyan to get a full trace
            var key, name;
            if (object !== self) {
                normalize(object);
            }
            // TODO: implement constant inheritance feature
            if (object['@']) {
                var task = object['@'].$, dep, context, target;
                for (key in task) {
                    if (task.hasOwnProperty(key)) {
                        context = recurse(task[key]);
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
                                dep = cpx;
                                key = key[0];
                                if (!cpx[key]) {
                                    throw new Error('method not defined: ' + key);
                                }
                                break;
                            case 2:
                                dep = cpxRequire(key[0]);
                                if (!dep) {
                                    // skip unresolved dependencies
                                    continue;
                                    throw new Error('unresolved dependency: ' + key[0]);
                                }
                                if (!dep[key[1]]) {
                                    throw new Error('method not defined: ' + key.join(':'));
                                }
                                // remove action after execution; only unresolved dependencies remain
                                delete task[key.join(':')];
                                key = key[1];
                                break;
                        }
                        if (context instanceof Array) {
                            dep[key].apply(dep, [object].concat(context));
                        } else {
                            for (target in context) {
                                if (context.hasOwnProperty(target)) {
                                    if (!object.hasOwnProperty(target)) {
                                        object[target] = {};
                                    }
                                    dep[key].apply(dep, [object[target]].concat(context[target]));
                                }
                            }
                        }
                    }
                }
                if (_.isEmpty(object['@'].$)) {
                    delete object['@'].$;
                    if (_.isEmpty(object['@'])) {
                        delete object['@'];
                    }
                }
            }
        },

        execute() {
            var entity = object;
            var logger = this.getLogger(entity);
            logger.trace(entity, 'EXECUTE');
            var i, key;
            if (entity instanceof Array) {
                parent.push(entity);
                for (i = 0; i < entity.length; ++i) {
                    trail.push(i);
                    object = entity[i];
                    this.execute(entity[i]);
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
                                object = entity[key];
                                this.execute(entity[key]);
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
                object = entity;
                this.dispatch();
            }
        }
    };
};
