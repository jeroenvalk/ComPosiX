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

module.exports = function (_) {
    'use strict';

    const validator = function validator(swagger) {

        const trail = [], errors = [], path = [];

        let schema = swagger;

        const error = function error() {
            errors.push({
                type: schema.type,
                trail: trail.slice(0),
                path: path.slice(0)
            });
        };

        const validateSchema = function (object, force) {
            if (schema.$ref) {
                schema = _.get(swagger, schema.$ref.split('/').slice(1));
            }
            const current = schema, method = ['is', schema.type.charAt(0).toUpperCase(), schema.type.substr(1)].join('');
            switch (schema.type) {
                case 'object':
                    if (!_.isPlainObject(object)) {
                        return error();
                    }
                    let key;
                    if (force) {
                        key = _.difference(_.keys(schema.properties), _.keys(object));
                        for (let i = 0; i < key.length; ++i) {
                            if (schema.properties[key].default) {
                                object[key] = schema.properties[key].default;
                            }
                        }
                    }
                    key = _.keys(object);
                    if (_.difference(key, _.keys(schema.properties)).length > 0) {
                        return error();
                    }
                    if (schema.required && _.difference(schema.required, key).length > 0) {
                        return error();
                    }
                    path.push('properties');
                    for (let i = 0; i < key.length; ++i) {
                        trail.push(key[i]);
                        path.push(key[i]);
                        schema = current.properties[key[i]];
                        validateSchema(object[key[i]], force);
                        trail.pop();
                        path.pop();
                    }
                    path.pop();
                    break;
                case 'array':
                    if (!_.isArray(object)) {
                        return error();
                    }
                    path.push('items');
                    schema = schema.items;
                    for (let i = 0; i < object.length; ++i) {
                        trail.push(i);
                        validateSchema(object[i], force);
                        trail.pop();
                    }
                    path.pop();
                    break;
                default:
                    if (!_[method].call(_, object)) {
                        return error();
                    }
                    schema.example = object;
                    break;
            }
            schema = current;
        };

        return {
            validate: function validator$validate(object, pathname, force) {
                if (!_.isArray(pathname)) {
                    pathname = pathname.split(".");
                }
                path.push(pathname[0]);
                switch (pathname[0]) {
                    case 'definitions':
                        path.push(pathname[1]);
                        schema = swagger.definitions[pathname[1]];
                        validateSchema(object, force);
                        path.pop();
                        break;
                    default:
                        throw new Error("not implemented");
                }
                const result = errors.slice(0);
                errors.length = 0;
                return result;
            }
        };
    };

    _.mixin({
        validator: validator
    });
};
