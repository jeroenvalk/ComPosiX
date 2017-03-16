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

    var cpx = this, _ = self['@const$.cpx.use._'];

    if (_ instanceof Function) {
        _ = _();
    } else {
        _ = cpx.deps._;
    }

    if (!(_ instanceof Object)) {
        throw new Error("ComPosiX processor requires Lodash or UnderscoreJS");
    }

    var trail = [], parent = [];
    
    return {
        getLogger() {
            return {
                trace() {
                    // TODO: create a tool that splits the log accross files to allow diff compares
                    // TODO: http://json-diff.com/
                }
            }
        },

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
            var dep = cpx.deps[i[0]];
            if (!dep) {
                throw new Error('missing dependency: ' + i[0]);
            }
            switch (i[1]) {
                case 'chain':
                    expression = expression[1].reverse();
                    for (i = expression.length - 2; i >= 0; --i) {
                        expression[i] = cpx.deps.path.join(expression[i + 1], expression[i]);
                    }
                    break;
                default:
                    if (typeof cpx.deps[i[0]][i[1]] === 'function') {
                        expression = cpx.deps[i[0]][i[1]].apply(cpx.deps[i[0]], expression.slice(1));
                    } else {
                        throw new Error('cannot invoke ' + i[0] + '.' + i[1]);
                    }
                    break;
            }
            return expression;
        },

        recurse(expression, attr) {
            var i, result;
            if (expression instanceof Object) {
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
                if (expression instanceof Function && _.isEmpty(expression)) {
                    return expression.call(null);
                }
                if (Object.getPrototypeOf(expression) === Object.prototype) {
                    result = {};
                    for (i in expression) {
                        if (expression.hasOwnProperty(i)) {
                            result[i] = this.recurse(expression[i], attr);
                        }
                    }
                    return result;
                }
                throw new Error('invalid attribute content: ' + expression);
            }
            if (typeof expression === 'string' && expression.charAt(0) === '@') {
                i = expression.substr(1);
                if (attr.hasOwnProperty('@') && attr['@'].hasOwnProperty(i)) {
                    return attr['@'][i];
                }
                if (attr.hasOwnProperty(i)) {
                    return this.recurse(attr[i], attr);
                }
                throw new Error('missing attribute: ' + i);
            }
            return expression;
        },

        normalize(object, trail, parent) {
            var i, size, aux, key, path, task, attr = object['@'];
            if (Object.getPrototypeOf(object) !== Object.prototype) {
                throw new Error(trail.join(".") + ": plain object expected");
            }
            if (attr && Object.getPrototypeOf(attr) !== Object.prototype) {
                throw new Error('plain object expected: ' + trail.concat(["@"]).join("."));
            }
            if (attr && attr.$ && Object.getPrototypeOf(attr.$) !== Object.prototype) {
                throw new Error('plain object expected: ' + trail.concat(["@","$"]).join("."));
            }
            if (object.$ && Object.getPrototypeOf(object.$) !== Object.prototype) {
                throw new Error('plain object expected: ' + trail.concat(["$"]).join("."));
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
            if (_.isEmpty(task)) {
                delete attr.$;
            } else {
                attr.$ = task;
            }
            if (_.isEmpty(attr)) {
                delete object['@'];
            } else {
                object['@'] = attr;
            }
            if (attr.const$) {
                // TODO: implement constant inheritance feature
                // attr['@'] = this.recurse(attr.const$, attr.const$);
            }
        },

        dispatch(object, trail, parent) {
            // TODO: add logging using Bunyan to get a full trace
            //console.log('DISPATCH');
            //var _ = cpx._(object, parent);
            var key, name, attr;
            this.normalize(object, trail, parent);
            if (object['@']) {
                var task = object['@'].$, dep, context, target;
                for (key in task) {
                    if (task.hasOwnProperty(key)) {
                        if (!attr) {
                            attr = _.extend.apply(_, _.map([{'@': {}}].concat(parent.slice(0)).concat([object]), '@'));
                        }
                        context = this.recurse(task[key], attr);
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
                                dep = cpx.dependency(object, parent, key[0]);
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

        execute(self) {
            var logger = this.getLogger(self);
            logger.trace(self, 'EXECUTE');
            var i, key;
            if (self instanceof Array) {
                parent.push(self);
                for (i = 0; i < self.length; ++i) {
                    trail.push(i);
                    this.execute(self[i], trail, parent);
                    if (trail.pop() !== i) {
                        throw new Error('internal error: ' + i);
                    }
                }
                if (self !== parent.pop()) {
                    throw new Error('internal error');
                }
            } else if (self instanceof Object) {
                parent.push(self);
                for (key in self) {
                    if (self.hasOwnProperty(key)) {
                        switch (key.charAt(0)) {
                            case '@':
                            case '$':
                                break;
                            default:
                                trail.push(key);
                                this.execute(self[key], trail, parent);
                                if (trail.pop() !== key) {
                                    throw new Error('internal error: ' + key);
                                }
                                break;
                        }
                    }
                }
                if (self !== parent.pop()) {
                    throw new Error('internal error');
                }
                this.dispatch(self, trail, parent);
            }
            return self;
        }
    };
};
