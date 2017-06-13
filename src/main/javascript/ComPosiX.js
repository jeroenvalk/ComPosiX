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

module.exports = function (url, stream, http, _, processor) {
    'use strict';

    const path = require('path');

    var dependencies = {
        path: null,
        fs: null,
        http: null,
        request: null,
        local: null
    };

    var cpx = null;

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

        module(data) {
            const __ = data.use._ || _;
            this.use(__, 'cpx:iteration');
            this.use(__, 'cpx:filesystem');
            const argv = [];
            if (argv.length) {
                throw new Error();
            }
            argv.push({
                "@": {
                    "cpx": {
                        "use": __.extend({
                            _: __.constant(__),
                            url: __.constant(url),
                            path: __.constant(path),
                        }, data.use)
                    }
                }
            });
            const result = __.wiring(data);
            __.module().readable.on('data', function (data) {
                data.chain.on('data', function(data) {
                    const dirname = path.resolve(data.dirname, (data.pkg.directories && data.pkg.directories.resources) || 'src/main/resources');
                    argv.push(__.parseSync(__.fsReadSync(null, dirname)));
                });
                data.chain.on('end', function() {
                    result.executions.write(__.merge.apply(__, argv));
                });
            });
            __.module().writable.write({
                dirname: '.'
            });
        }

        project(object, testing) {
            const cpx = this;
            cpx.use(object, 'cpx:iteration');
            cpx.use(object, 'cpx:filesystem');
            const index = typeof testing === 'boolean' ? 2 : 1;
            const flag = index > 1 ? testing : false;
            const argv = [{
                "@": {
                    "cpx": {
                        "use": {
                            "url": _.constant(url),
                            "path": _.constant(path),
                            "_": _.constant(object)
                        }
                    }
                }
            }];
            for (var i = index; i < arguments.length; ++i) {
                try {
                    argv.push(object.parseSync(object.fsReadSync(null, path.join(arguments[i], 'src/main/resources'))));
                } catch (e) {

                }
                try {
                    if (flag) argv.push(object.parseSync(object.fsReadSync(null, path.join(arguments[i], 'src/test/resources'))));
                } catch (e) {

                }
            }
            const resources = object.merge.apply(object, argv);
            cpx.use(object, {
                run: function project$run(fn) {
                    return fn.call(null, object, cpx, resources, flag ? require('chai') : null);
                }
            });
            return object;
        }

        debug(object, flag) {
            if (!object.describe) {
                this.use(object, {
                    describe: function cpx$describe(name, fn) {
                        describe(name, function () {
                            fn.call(null, {
                                _: object,
                                npm: {
                                    chai: require('chai')
                                }
                            });
                        });
                    }
                });
            }
            return object;
        }

        use(object, plugin) {
            let name;
            if (typeof plugin === 'string') {
                name = plugin;
                plugin = plugin.split(":", 2);
                if (plugin.length > 1) {
                    switch (plugin[0]) {
                        case 'cpx':
                            try {
                                plugin = require("./plugins/" + plugin[1]);
                            } catch (e) {
                                plugin = require('../../modules/cpx-' + plugin[1]);
                            }
                            break;
                        default:
                            throw new Error('unknown prefix: ' + plugin[0]);
                    }
                } else {
                    require(name);
                }
            }
            if (plugin instanceof Function && plugin.length === 1) {
                return plugin.call(this, object);
            }
            if (Object.getPrototypeOf(plugin) === Object.prototype) {
                return object.mixin(plugin);
            }
            throw new Error((name ? name + ": " : "") + "invalid plugin");
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

        throwError(entity, msg) {
            var e = new Error(msg);
            if (entity instanceof Object) {
                entity.ERROR = e;
            } else {
                throw e;
            }
        }

        dependencies(entity, deps) {
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

        execute(entity, parent) {
            if (!cpx) {
                cpx = processor.call(this, entity, parent);
                try {
                    cpx.execute();
                } finally {
                    cpx = null;
                }
                return entity;
            }
            throw new Error("processor busy");
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

        // TODO: write _.write() function that takes a stream and chunks JSON into it (also implement objectmode)
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

        server(object, options) {
            const self = this;
            let secret;
            require('crypto').randomBytes(48, function (err, buffer) {
                secret = buffer.toString("base64");
                console.log(secret);
            });
            http.createServer(function (req, res) {
                let msg, pathname = url.parse(req.url).pathname.split('/').slice(1), target = req.url === "/" ? object.target : _.get(object.target, pathname);
                switch (req.method) {
                    case 'GET':
                        msg = target
                        if (msg) {
                            res.writeHead(200, {"Access-Control-Allow-Origin": "*"});
                            // TODO: use _.serialize to avoid in-memory buffering
                            res.write(JSON.stringify(msg));
                        } else {
                            res.statusCode = 404;
                            res.statusMessage = 'Not found';
                        }
                        res.end();
                        break;
                    case 'PURGE':
                        _.each(target, function (value, key) {
                            delete target[key];
                        });
                        res.statusCode = 204;
                        res.statusMessage = "No Content";
                        res.end();
                        break;
                    case 'PUT':
                        msg = [];
                        // TODO: use _.read which takes a stream on JSON chunks and merges them
                        // TODO: think about streaming and how it merges into the target streams
                        req.on('data', function (chunk) {
                            msg.push(chunk);
                        });
                        req.on('end', function () {
                            try {
                                _.merge(target, JSON.parse(msg.join('')));
                                res.statusCode = 201;
                                res.statusMessage = "Created";
                            } catch (e) {
                                res.statusCode = 415;
                                res.statusMessage = "Unsupported Media Type";
                            }
                            res.end();
                        });
                        break;
                    case 'POST':
                        msg = [];
                        req.on('data', function (chunk) {
                            msg.push(chunk);
                        });
                        req.on('end', function () {
                            msg = msg.join('');
                            try {
                                msg = JSON.parse(msg);
                                res.statusCode = 202;
                                res.statusMessage = "Accepted";
                            } catch (e) {
                                res.statusCode = 415;
                                res.statusMessage = "Unsupported Media Type";
                                res.end();
                                return;
                            }
                            try {
                                if (url.parse(req.url, true).query.update && JSON.stringify(url.parse(req.url, true).query.update)) {
                                    _.set(object, ["src", pathname].join("."), JSON.parse(msg));
                                    _.set(object.target, pathname, msg);
                                }
                                self.execute(msg, [object]);
                            } catch (e) {
                                res.statusCode = 400;
                                res.statusMessage = "Bad Request";
                                res.end(e.stack);
                            }
                            res.end(JSON.stringify(msg));
                        });
                        break;
                    // TODO: implement POST or PATCH which is like PUT but also executes
                    default:
                        res.statusCode = 405;
                        res.statusMessage = "Method Not Allowed";
                        res.end();
                        break;
                }
            }).listen(options.port);
        }

        request(self, options) {
            var _ = this.deps._;
            var http = this.deps.http;
            var data = options && options.body && this.serialize(null, options.body);
            return new Promise(function (resolve, reject) {
                var req = http.request(_.extend(options.url ? url.parse(options.url) : {}, options), function (res) {
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
