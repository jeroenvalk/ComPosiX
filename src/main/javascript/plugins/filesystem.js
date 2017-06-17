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

    const stripWhitespace = function(str) {
        str = str.replace(/>\s*/g, '>');
        str = str.replace(/\s*</g, '<');
        return str;
    };

    const writeModule = function(x, data) {
        var dirname = data.dirname;
        const writer = function (x) {
            const filename = path.resolve(dirname, 'package.json');
            fs.readFile(filename, function (err, data) {
                if (err) {
                    if (dirname === '/') {
                        x.chain.end();
                        return;
                    }
                    dirname = path.resolve(dirname, '..');
                } else {
                    const pkg = JSON.parse(data);
                    x.chain.write({
                        dirname: path.resolve(dirname),
                        pkg: pkg
                    });
                    if (pkg.directories && pkg.directories.parent) {
                        dirname = path.resolve(pathname, pkg.directories.parent);
                    } else {
                        dirname = path.resolve(dirname, '..');
                    }
                }
                writer(x);
            })
        };
        const y = {
            chain: [0, true]
        }
        x.readable.write(_.wiring(y));
        writer.call(null, y);
    };

    const modules = _.wiring({
        writable: writeModule,
        readable: [1, true]
    });

    _.mainstream('$mixin', {
        module: modules
    }, '$');

    _.mixin({
        read: function filesystem$read(readable) {
          switch(Object.getPrototypeOf(readable)) {
              case Array.prototype:
                  return readable.shift();
              default:
                  throw new Error();
          }
        },
        write: function filesystem$write(writable, data) {
           switch(Object.getPrototypeOf(writable)) {
               case Array.prototype:
                   return writable.push(data);
               default:
                   throw new Error();
           }
        },
        parseSync: function filesystem$parse(object, options) {
            // TODO: check if object is readable to throw error: cannot synchrously parse async stream (or peek into it if possible)
            // TODO: check if object is promise to throw error: cannot synchronously parse promise (or peek into it if possible)
            // TODO: make sure that writeable streams are silently ignored
            _.each(object, function(value, key) {
                const ext = path.extname(key);
                switch(ext) {
                    case '.json':
                        // TODO: implement writing if path.basename(key, ext) is a writable stream
                        if (object[key] instanceof Buffer) {
                            // TODO: create readable streams for arrays
                            object[path.basename(key, ext)] = JSON.parse(object[key].toString());
                            if (!options || options.purge !== false) {
                                delete object[key];
                            }
                        } else {
                            throw new Error('buffer expected');
                        }
                        break;
                    case '.xml':
                        if (object[key] instanceof Buffer) {
                            object[path.basename(key, ext)] = [stripWhitespace(object[key].toString())];
                            if (!options || options.purge !== false) {
                                delete object[key];
                            }
                        } else {
                            throw new Error('buffer expected');
                        }
                        break;
                    default:
                        _.parseSync(object[key]);
                        break;
                }
            });
            return object;
        },
        stringifySync: function(object, options) {
            // TODO: check if object is readable to throw error: cannot synchrously parse async stream
            // TODO: check if object is promise to throw error: cannot synchronously parse promise
            // TODO: make sure that writeable streams are silently ignored
            _.each(object, function(value, key) {
                const ext = path.extname(key);
                switch(ext) {
                    case '.json':
                        // TODO: implement writing if object[key] is a writable stream
                        // TODO: create readable streams for arrays
                        object[key] = JSON.stringify(object[path.basename(key, ext)], null, options && options.pretty ? '\t' : undefined);
                        if (!options || options.purge !== false) {
                            delete object[path.basename(key, ext)];
                        }
                        break;
                    default:
                        _.stringifySync(object[key]);
                        break;
                }
            });
            return object;
        },
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
                        if (key.charAt(0) !== '@') {
                            _.fsWriteSync(value, path.join(pathname, key), options);
                        }
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
