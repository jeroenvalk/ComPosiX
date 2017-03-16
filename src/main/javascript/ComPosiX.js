/**
 * Copyright © 2016-2017 dr. ir. Jeroen M. Valk
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

module.exports = function(url, stream, Proxy, processor) {
    'use strict';

    var dependencies = {
        path: null,
        fs: null,
        http: null,
        request: null,
        local: null
    };

    return class ComPosiX {

        constructor() {
            this.deps = Object.create(dependencies);
            this.deps.cpx = this;
            this.deps.logger = null;
            this.deps._ = null;
            this._registry = {
                ComPosiX: this
            };
            this.data = {};
        }

        boot(entity, deps) {
            if (!deps) {
                deps = {};
            }
            deps.logger = entity || deps.logger || null;
            deps.path = deps.path || require('path');
            deps.fs = deps.fs || require('fs');
            deps.http = deps.http || require('http');
            deps._ = deps._ || require('lodash');
            deps.request = deps.request || require('request');
            var path = deps.path;
            deps.pathname = path.resolve(deps.pathname || 'ComPosiX.js');
            deps.local = null;
            this.dependencies(null, deps);
            var bootstrap = require(deps.pathname);
            this.execute(bootstrap);
            // TODO: add $logger:info task to get logging output
            this.deps.logger && this.deps.logger.info(bootstrap);
        }

        install(entity, _) {
            var cpx = this;
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
            if (entity instanceof Object) {
                entity._ = _;
            }
        }

        cache(object, path) {
            path = ['@', '@'].concat(path);
            for (var i = 0; i < path.length; ++i) {
                if (!object) {
                    break;
                }
                object = object[path[i]];
            }
            return object;
        }

        _(object, parent) {
            return this.dependency(object, parent, "_");
        }

        throwError(entity, msg) {
            var e = new Error(msg);
            if (entity instanceof Object) {
                entity.ERROR = e;
            } else {
                throw e;
            }
        }

        dependency(object, parent, dep) {
            var result = this.deps[dep];
            if (result) {
                return result;
            }
            result = this.cache(object, ["deps",dep]);
            if (result) {
                return result;
            }
            for (var i = parent.length - 1; i >= 0; --i) {
                result = this.cache(parent[i], ["deps",dep]);
                if (result) {
                    return result;
                }
            }
            throw new Error('implementation for _ is required' + (dep === "_" ? ', e.g., Lodash or UnderscoreJS' : ''));
        }

        dependencies(entity, deps) {
            //console.log('DEPENDENCIES');
            if (!this.deps._ && deps._) {
                require("./plugins/core.js")(deps._);
            }
            var scope;
            for (var name in this.deps) {
                if (this.deps.hasOwnProperty(name)) {
                    scope = this.deps;
                } else {
                    scope = dependencies;
                }
                switch (scope[name]) {
                    case null:
                        if (deps[name] === undefined) {
                            this.throwError(entity, "unresolved dependency: " + name);
                        }
                        scope[name] = deps[name];
                        break;
                    default:
                        if (deps[name] !== undefined && scope[name] !== deps[name]) {
                            this.throwError(entity, "dependency change: " + name);
                        }
                        break;
                }
            }
        }

        registry(path) {
            if (path) {
                var part = path.split('.', 2);
                return this._registry[part[0]].registry(part[1]);
            }
            return this;
        }

        register(entity, path) {
            var _ = this.deps._;
            //console.log('REGISTER');
            if (path) {
                return this.registry(path).register(entity);
            }
            _.merge(this.data, entity);
        }

        execute(entity, trail, parent) {
            return processor.call(this, entity).execute(entity);
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

        keys(object) {
            var i, j = 0, result = Object.keys(object);
            for (i = 0; i < result.length; ++i) {
                switch (result[i].charAt(0)) {
                    case '@':
                    case '_':
                        break;
                    default:
                        result[j++] = result[i];
                }
            }
            return result.slice(0, j);
        }

        which(object, file, search) {
            var i, j;
            var path = this.deps.path;
            var fs = this.deps.fs;
            var basedir = path.resolve(path.dirname(this.deps.pathname || '.'));
            for (i = 0; i < file.length; ++i) {
                if (search.length === 1) {
                    // existence check not needed if only one choice possible
                    file[i] = path.resolve(basedir, search[0], file[i]);
                } else {
                    for (j = 0; j < search.length; ++j) {
                        try {
                            if (fs.statSync(path.resolve(basedir, search[j], file[i])).isFile()) {
                                file[i] = path.resolve(basedir, search[j], file[i]);
                                break;
                            }
                        } catch (e) {
                            // not found
                        }
                    }
                }
                if (j === search.length) throw new Error('file not found: ' + file[i]);
            }
            return file;
        }

        extend(object, arg) {
            var key = this.keys(object);
            for (var i = 0; i < key.length; ++i) {
                this.normalize(object[key]);
                if (!object[key]['@']._.extend) {
                    object[key]['@']._.extend = arg;
                }
            }
            return object;
        }

        include(object, arg) {
            var _ = this.deps._;
            _(_(arg).keys()).each(function (proto) {
                switch (proto) {
                    case 'file':
                        object = require('./' + arg[proto].filename);
                }
            });
            return object;
        }

        listen(object, arg) {
            var proxy = new Proxy(this);
            proxy.listen(arg.port);
            return object;
        }

        pipe(self, path) {
            var _ = this.deps._;
            var result = _.get(self, path, null);
            if (result) {
                return result;
            }
            result = new stream.PassThrough({objectMode: true});
            _.set(self, path, result);
            return result;
        }

        serialize(self, data) {
            switch (typeof data) {
                case 'string':
                    return Buffer.from(data);
                case 'object':
                    if (data instanceof String) {
                        return Buffer.from(data.valueOf());
                    }
                    if (data instanceof Buffer) {
                        return data;
                    }
                    if (data instanceof Array) {
                        var result = new stream.PassThrough({objectMode: true});
                        for (let i = 0; i < data.length; ++i) {
                            result.write(this.serialize(data[i]));
                        }
                        return result;
                    }
                    return Buffer.from(JSON.stringify(data));
                default:
                    return null;
            }
        }

        write(self, stream, data) {
            self = this;
            if (data instanceof Buffer) {
                stream.write(data);
            } else {
                throw new Error('not implemented');
                // TODO: implement proper stream concatenation
                data.on('data', function (data) {
                    self.write(null, stream, data);
                });
            }
        }

        server(self, options) {
            var _ = this.deps._;
            var http = this.deps.http;
            var msg, result = this.pipe(self, 'cpx.result');
            self = this;
            http.createServer(function (req, res) {
                var www = self.data.www;
                switch (req.method) {
                    case 'GET':
                        msg = self.serialize(null, _.get(www, url.parse(req.url).pathname.split('/').slice(1)));
                        if (msg) {
                            res.writeHead(200, msg.headers);
                            self.write(null, res, msg);
                        } else {
                            res.statusCode = 404;
                            res.statusMessage = 'Not found';
                        }
                        res.end();
                        break;
                    case 'POST':
                        msg = [];
                        req.on('data', function (chunk) {
                            msg.push(chunk);
                        });
                        req.on('end', function () {
                            msg = JSON.parse(msg.join(''));
                            self.execute(msg);
                            res.write(JSON.stringify(msg));
                            res.end();
                        });
                        break;
                }
                result.write({
                    url: req.url,
                    headers: req.headers
                });
            }).listen(options.port);
            return result;
        }

        request(self, uri, options) {
            var _ = this.deps._;
            var http = this.deps.http;
            var data = this.serialize(null, options.body);
            return new Promise(function (resolve, reject) {
                var req = http.request(_.extend(url.parse(uri), options), function (res) {
                    // TODO: integrate JSONStreams to read the response
                    resolve({
                        headers: res.headers,
                        statusCode: res.statusCode,
                        statusMessage: res.statusMessage,
                    })
                });
                if (data) {
                    req.write(data);
                }
                req.end();
            });
        }

    };
};
