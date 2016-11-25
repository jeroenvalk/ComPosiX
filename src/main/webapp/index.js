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

var install = function cpx$install(_) {
    console.log('INSTALL');
    var cpx = new ComPosiX(_);
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
    }));
    global._ = _;
    cpx.register(require(process.cwd() + '/registry'));
    console.log(cpx.$);
    return _;
};

module.exports = {
    install: install
};
