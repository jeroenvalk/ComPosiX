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

/* global global, require */

global._ = {
    globals: function(fn) {
        return function() {
            let $ = {};
            require('../main/javascript/globals')($);
            $.chai = require('chai');
            $._ = {
                nth: function(array, index) {
                    return array[(array.length + index) % array.length];
                },
                last: function(array) {
                    return array[array.length - 1];
                }
            };
            return fn.call(null, $);
        }
    }
};
