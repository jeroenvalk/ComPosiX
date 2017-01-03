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

var ComPosiX = require('../javascript/ComPosiX.js');

var dependencies = function cpx$dependencies(deps) {
    deps.logger = deps.logger || logger;
    deps.path = deps.path || require('path');
    deps.fs = deps.fs || require('fs');
    deps.http = deps.http || require('http');
    deps._ = deps._ || require('lodash');
    deps.request = deps.request || require('request');
};

var install = function cpx$install(deps, basedir) {
    if (!deps) {
        deps = {};
    }
    dependencies(deps);
    if (!basedir) {
        basedir = process.cwd();
    }
    var _ = deps._;
    var logger = deps.logger;
    logger.info('INSTALL');
    var cpx = new ComPosiX(deps, basedir);
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
};

var logger = {
    info: function cpx$logger$info(msg) {
        console.log(msg);
    }
};

var start = function cpx$start(deps, pathname) {
    if (!deps) {
        deps = {};
    }
    dependencies(deps);
    var path = deps.path;
    var _ = deps._;
    pathname = path.resolve(pathname || 'ComPosiX.js');
    install(deps, path.dirname(pathname));
    _.execute(require(pathname));
};

module.exports = {
    install: install,
    start: start
};
