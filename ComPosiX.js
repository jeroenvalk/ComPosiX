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

const fs = require('fs');
const _ = require('underscore');

module.exports = {
    "@": {
        cpx: {
            pkg: JSON.parse(fs.readFileSync('package.json')),
            use: {
                _: _.constant(_)
            }
        }
    },
    server: {
        $server: [{
            port: 80
        }],
        cpx: {
            '$_:extend': ['@cpx'],
            sayhi: 'Hello world!'
        }
    },
    register: {
        '@': {
            petstore: JSON.parse(fs.readFileSync('src/main/swagger/petstore.json'))
        },
        $request: {
            petstore: ["http://localhost/", {
                method: "PUT",
                body: {
                    cpx: {
                        api: {
                            petstore: {
                                "swagger.json": '@petstore'
                            }
                        }
                    }
                }
            }]
        }
    }
};
