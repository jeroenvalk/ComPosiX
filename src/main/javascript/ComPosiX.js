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

    constructor(_) {
        this._ = _;
        this.$ = {
            _: {
                ComPosiX: this
            }
        };
    }

    registry(path) {
        if (path) {
            var part = path.split('.', 2);
            return this.$._[part[0]].registry(path[1]);
        }
        return this;
    }

    register(entity, path) {
        console.log('REGISTER');
        if (path) {
            return this.registry(path).register(entity);
        }
        this._.merge(this.$, entity);
    }

    execute(entity) {
        console.log('EXECUTE');
        var self = this;
        var recurse = function cpx$execute$recurse(a, b) {
            return _.isObject(b) ? self._.extend(a, self.dispatch(b), recurse) : b;
        }
        return self._.extend({}, self.dispatch(entity), recurse);
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

    dispatch(object) {
        console.log('DISPATCH');
        console.log(object);
        var self = this, _ = this._;
        if (_(object).has('_')) {
            var tasks = object._;
            delete object._;
            _(_(tasks).keys()).each(function(method) {
                object = self[method].call(self, object, tasks[method]);
            })
        }
    }

    include(object, arg) {
        var _ = this._;
        _(_(arg).keys()).each(function(proto) {
            switch(proto) {
                case 'file':
                    object = require('./' + arg[proto].filename);
            }
        });
        return object;
    }

    listen(object, arg) {
        var proxy = new Proxy(this, arg.name);
        proxy.listen(arg.port);
        return object;
    }

};
