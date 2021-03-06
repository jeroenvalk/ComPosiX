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

    const stream = require('stream');
    const Readable = stream.Readable, PassThrough = stream.PassThrough;

    class Channel { 
        constructor() {
            const array = _.flatten(arguments);
            if (typeof array[0] !== 'number') {
                throw new Error();
            }
            if (typeof array[1] !== 'boolean') {
                throw new Error();
            }
            this.passthrough = new PassThrough({objectMode: true});
        }

        getWritable() {
            return this.passthrough;
        }

        getReadable() {
            return this.passthrough;
        }
    }

    const writable = function (array) {
        const readable = (array.length > 0 && (typeof array[0] === "string" || array[0] instanceof Buffer)) ? new PassThrough() : new PassThrough({objectMode: true});
        readable.on('data', function (data) {
            data = _.writable(data);
            array.push(data);
        });
        return readable;
    };

    const readObject = function (object, stream) {
        let result = [];
        for (const key in stream) {
            if (stream.hasOwnProperty(key)) {
                let readable = stream[key];
                switch (Object.getPrototypeOf(readable)) {
                    case Array.prototype:
                    case Object.prototype:
                        result.push(readObject(object[key] = {}, readable));
                        break;
                    case Boolean.prototype:
                    case Date.prototype:
                    case Number.prototype:
                    case String.prototype:
                        object[key] = readable;
                        break;
                    default:
                        if (readable instanceof Readable) {
                            result.push(readArray(object[key] = [], readable));
                        } else {
                            throw new Error("only serializable object allowed");
                        }
                        break;
                }
            }
        }
        return Promise.all(result);
    };

    const readArray = function (array, stream) {
        return new Promise(function (resolve, reject) {
            let result = [];
            stream.on("data", function (writable) {
                if (Object.getPrototypeOf(writable) === Object.prototype) {
                    const value = {};
                    array.push(value);
                    result.push(_.writable(value, writable));
                } else if (writable instanceof Buffer || typeof writable === 'string') {
                    array.push(writable);
                } else {
                    reject(new Error("object or buffer expected"));
                }
            });
            stream.on("end", function () {
                Promise.all(result).then(function (value) {
                    resolve(value);
                });
            });
        });
    };

    const readable = function (array) {
        let writable = null;
        const stream = function (readable, offset, count) {
            if (readable instanceof Array) {
                for (let i = offset; i < readable.length; ++i) {
                    count = stream(readable[i], 0, count);
                    if (count instanceof Promise) {
                        return count.then(function (count) {
                            return stream(readable, ++i, count);
                        });
                    }
                }
                return count;
            }
            if (!writable) {
                if (typeof readable === "string" || readable instanceof Buffer) {
                    writable = new PassThrough();
                } else {
                    writable = new PassThrough({objectMode: true});
                }
            }
            if (readable instanceof Promise) {
                return readable.then(function (readable) {
                    return stream(readable, 0, count);
                });
            }
            readable = _.readable(readable);
            writable.write(readable);
            return ++count;
        }
        const result = stream(array, 0, 0);
        if (result instanceof Promise) {
            result.then(function () {
                writable.end();
            });
        } else {
            writable.end();
        }
        return writable;
    };

    const endpoint = new stream.PassThrough({objectMode: true});
    const argv = ['$'];

    endpoint.on('data', function(data) {
        var i, j;
        switch(Object.getPrototypeOf(data)) {
            case Array.prototype:
                for (i = 0; i < data.length; ++i) {
                    if (typeof data[i] === 'string' && data[i].charAt(0) === '$') {
                        j = 0;
                        if (argv[0] === '$') {
                            for (j = 1; j < argv.length; ++j) {
                                if (argv[j].charAt(0) === '$') {
                                    break;
                                }
                            }
                        }
                        if (j < argv.length) {
                            const method = argv[j++].substr(1);
                            switch(method) {
                                case "mixin":
                                    argv[j] = _.mapValues(argv[j], function(value) {
                                        return function() {
                                            return _.wiring(value);
                                        }
                                    });
                                    break;
                            }
                            _[method].apply(_, argv.slice(j));
                        }
                        argv.length = 0;
                    }
                    argv.push(data[i]);
                }
                break;
            default:
                argv.push(data);
                break;
        }
    });

    const Node = require("../Node");
    const http = {
        "http:": require('http'),
        "https:": require('https')
    };

    _.mixin({
        mainstream: function() {
            for (var i = 0; i < arguments.length; ++i) {
                endpoint.write([arguments[i]]);
            }
        },
        wiring: function(stream) {
            // TODO: accept JSON schema as second argument for type-safe streaming
            const connectReadable = function(readable, fn) {
                readable.on('data', function(data) {
                    if (data) {
                        fn(stream, data);
                    }
                });
                readable.on('end', function() {
                    fn(stream, null);
                })
            };
            const todo = [];
            const result = _.mapValues(stream, function (value, key) {
                var channel, endpoint;
                switch(Object.getPrototypeOf(value)) {
                    case Function.prototype:
                        delete stream[key];
                        channel = new Channel(0, true);
                        endpoint = channel.getReadable();
                        if (!endpoint) throw new Error();
                        _.set(stream, key, endpoint);
                        todo.push([endpoint, value]);
                        return channel.getWritable();
                    case Array.prototype:
                        delete stream[key];
                        channel = new Channel(value);
                        _.set(stream, key, channel.getWritable());
                        return channel.getReadable();
                    default:
                        return value;
                }
            });
            _.each(todo, function(pair) {
                connectReadable.apply(null, pair);
            });
            return result;
        },
        writable: function (object, writable) {
            if (Object.getPrototypeOf(object) === Object.prototype) {
                if (Object.getPrototypeOf(writable) !== Object.prototype) {
                    throw new Error("composite stream must be an Object");
                }
                return readObject(object, writable);
            }
            if (object instanceof Array) {
                if (!(writable instanceof Readable)) {
                    throw new Error("composite stream must be a stream.Readable");
                }
                return readArray(object, writable);
            }
            throw new Error("plain object or array expected");
        },
        readable: function (object) {
            if (Object.getPrototypeOf(object) === Object.prototype) {
                let keys = [], values = [], result = {};
                for (const key in object) {
                    switch (key.charAt(0)) {
                        case '@':
                        case '$':
                            break;
                        default:
                            if (object.hasOwnProperty(key)) {
                                const value = object[key];
                                if (value instanceof Promise) {
                                    keys.push(key);
                                    values.push(value);
                                } else {
                                    result[key] = _.readable(value);
                                }
                            }
                            break;
                    }
                }
                if (!keys.length) {
                    return result;
                }
                return Promise.all(values).then(function (values) {
                    for (let i = 0; i < keys.length; ++i) {
                        result[keys[i]] = _.readable(values[i]);
                    }
                    return result;
                });
            }
            if (object instanceof Array) {
                return readable(object);
            }
            return object;
        },
        request: function cpxIterators$request(readable, writable) {
            let todo = 0, done = false;
            readable.on('data', function (options) {
                ++todo;
                if (!http[options.protocol]) {
                    throw new Error("option 'protocol' must be 'http:' or 'https:'");
                }
                const body = options.body;
                delete options.body;
                const req = http[options.protocol].request(options, function (res) {
                    const body = new stream.PassThrough();
                    const response = {
                        statusCode: res.statusCode,
                        statusMessage: res.statusMessage,
                        headers: res.headers,
                        body: body
                    };
                    if (req.toCurl) {
                        response.curl = req.toCurl().replace(/(\\n0?)|(\\r)/g, "");
                    }
                    writable.write(response);
                    res.pipe(body);
                    if (!--todo && done) {
                        writable.end();
                    }
                });
                req.on("error", function(e) {
                    writable.write(e);
                    if (!--todo && done) {
                        writable.end();
                    }
                });
                req.on("timeout", function() {
                    writable.write(new Error('timeout'));
                    if (!--todo && done) {
                        writable.end();
                    }
                });
                if (body) {
                    body.pipe(req);
                } else {
                    req.end();
                }
            });
            readable.on('end', function () {
                if (todo) {
                    done = true;
                } else {
                    writable.end();
                }
            });
        },
        node: function cpxIterators$node(fn, modes) {
            return new Node(fn, modes);
        },
        pipe: function (source, target) {
            return source.pipe(target);
        }
    }, {
        chain: false
    });

    return _;
};
