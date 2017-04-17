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

    const serializeTag = function core$serializeTag(tagname, attr) {
        const result = ['<', tagname];
        let text;
        if (attr) {
            _.each(attr, function(value, key) {
                if (key.charAt(0) === '$') {
                    text = value;
                } else {
                    result.push(' ' + key + '=' + JSON.stringify(value));
                }
            })
        }
        result.push('>');
        if (text) {
            result.push(text);
        }
        return result.join("");
    };

    const serializeXML = function core$serializeXML(tagname, attr, data, writable) {
        switch (Object.getPrototypeOf(data)) {
            case Object.prototype:
                writable.write(serializeTag(tagname, attr));
                _.each(data, function (value, key) {
                    if (key.charAt(0) !== '@') {
                        serializeXML(key, value['@'] ? value['@'][key] : {}, value, writable);
                    }
                });
                writable.write('</' + tagname + '>');
                break;
            case Array.prototype:
                for (let i = 0; i < data.length; ++i) {
                    serializeXML(tagname, data[i]['@'] ? data[i]['@'][tagname]: {}, data[i], writable);
                }
                break;
            default:
                writable.write(serializeTag(tagname, attr));
                writable.write(data.toString());
                writable.write('</' + tagname + '>');
                break;
        }
    };

    _.mixin({
        toXML: function core$serialize(object, pattern) {
            let result = [];

            function write(chunk) {
                result.push(chunk);
            }

            if (_.isString(pattern)) {
                const data = object[pattern], tagname = data['@'] ? _.keys(data['@'])[0] : null;
                serializeXML(tagname, tagname ? data['@'][tagname] : {}, data, {write: write});
                object[pattern] = result.join("");
            }
        }
    });
};
