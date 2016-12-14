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

var path = require('path');
var http = require('http');

var registry, path, http, _, request;
var deps = {
    cpx: null,
    path: null,
    http: null,
    _: null,
    request: null
};

module.exports = class Proxy {

    constructor(dependencies, name) {
        var data;
        this.server = http.createServer(function (req, res) {
            try {
                var pathname = path.posix.resolve(req.url), chain = [];
                for (; ;) {
                    var node = pathname === '/' ? data : _.at(data, pathname.substr(1).replace(/\//g, '.'))[0];
                    if (!node) {
                        throw new Error('not found: ' + pathname);
                    }
                    if (!node['@']) {
                        break;
                    }
                    chain.push(node['@']);
                    if (!node['@']['^']) {
                        break;
                    }
                    pathname = path.posix.resolve(pathname, node['@']['^']);
                }
                if (chain.length === 0) {
                    throw new Error('no defaults chain found on: ' + req.url);
                }
                var wrapper = request;
                for (var i = chain.length - 1; i >= 0; --i) {
                    wrapper = wrapper.defaults(chain[i]);
                }
                var method = req.method;
                if (method === 'PUT' || method === 'POST') {
                    req.pipe(wrapper({
                        method: method
                    })).pipe(res);
                } else {
                    throw new Error('not yet implemented');
                }
            } catch (e) {
                res.write(e.stack);
                res.end();
                console.log(e.stack);
            }
        });
        if (!deps.cpx) {
            dependencies.cpx.dependencies(dependencies, deps);
            registry = deps.cpx;
            path = deps.path;
            http = deps.http;
            _ = deps._;
            request = deps.request;
        }
        data = registry.data.request;
        if (!data) {
            throw new Error('not registered: request');
        }
    }

    listen(port) {
        console.log('Server listening on port: ' + port);
        this.server.listen(port);
    }

}
