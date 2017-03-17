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

module.exports = function (_) {
    'use strict';
    
    var expect = require('chai').expect;

    var testHierarchy = function cpx$testHierarchy(hierarchy) {
        _.each(hierarchy, function(value, key) {
            if (/[.]describe[_\s][^.]*/.test(key)) {
                describe(key, function() {
                    testHierarchy(value);
                });
            } else if (/[.]it[_\s][^.]*/.test(key)) {
                it(key, function() {
                    expect(_.omit(value.actual, ['@'])).to.deep.equal(_.omit(value.expected, ["@"]));
                });
            }
        });
    };

    _.mixin({
        hierarchy: function cpx$hierarchy(regex, entity) {
            var paths = _.map(_(entity).keysDeep(), function(path) {
                path = "." + path;
                var i = 0, j, result = [];
                while ((j = path.indexOf(".", j + 1)) >= 0) {
                    if (regex.test(path.substring(i, j))) {
                        result.push(path.substring(i,j));
                        i = j;
                    }
                }
                return result;
            });
            return _.zipObjectDeep(paths, _.map(paths, function(path) {
                return _.get(entity, path.join("").substr(1));
            }));
        },
        test: function(entity) {
            entity = _.hierarchy(/[.](describe)|(it)[_\s][^.]*/, entity);
            testHierarchy(entity);
        }
    }, {
        chain: false
    });

    return _;
};
