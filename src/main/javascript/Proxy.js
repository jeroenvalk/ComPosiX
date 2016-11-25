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

var http = require('http');
var request = require('request');

module.exports = class Proxy {

    constructor(registry, name) {
        this.server = http.createServer(function (req, res) {
            try {
                var trail = _.compact(registry.trail(['request'].concat(req.url.split('/').slice(1))));
                var wrapper = request;
                for (var i = 0; i < trail.length; ++i) {
                    wrapper = wrapper.defaults(trail[i]);
                }
                var method = req.method;
                if (method === 'PUT' || method === 'POST') {
                    req.pipe(wrapper({
                        method: method
                    })).pipe(res);
                } else {
                    throw new Error('not yet implemented');
                }
            } catch(e) {
                res.write(e.stack);
                res.end();
                console.log(e.stack);
            }
        });
    }

    listen(port) {
        console.log('Server listening on port: ' + port);
        this.server.listen(port);
    }

}
