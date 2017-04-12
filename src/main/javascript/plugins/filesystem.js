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

/* global module */

module.exports = function(_) {
    'use strict';

    const path = require('path'), fs = require('fs');

    _.mixin({
        fsReadSync: function filesystem$fsReadSync(object, pathname, options) {
            const stat = fs.statSync(pathname);
            if (stat.isDirectory()) {
                if (!object) object = {};
                _.each(fs.readdirSync(pathname), function(file) {
                    object[file] = _.fsReadSync(null, path.join(pathname, file), options);
                });
                return object;
            }
            if (stat.isFile()) {
                return fs.readFileSync(pathname, options);
            }
        },
        fsWriteSync: function filesystem$fsWriteSync(object, pathname, options) {
            switch(Object.getPrototypeOf(object)) {
                case Object.prototype:
                    fs.existsSync(pathname) || fs.mkdirSync(pathname);
                    _.each(object, function(value, key) {
                        _.fsWriteSync(value, path.join(pathname, key), options);
                    });
                    break;
                case Buffer.prototype:
                    fs.writeFileSync(pathname, object, options);
                    break;
                default:
                    fs.writeFileSync(pathname, object.toString(), options);
                    break;
            }
        }
    });
};
