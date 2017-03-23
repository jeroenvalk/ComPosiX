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
const _ = require('lodash');

module.exports = {
    "@": {
        cpx: {
            hostname: "localhost",
            port: 8080,
            pkg: JSON.parse(fs.readFileSync('package.json')),
            use: {
                _: [_.constant(_), "core"]
            }
        }
    },
    server: {
        "@": {
            cpx: {
                use: {
                    _: [_.constant(_), "core"],
                    path: _.constant(require('path'))
                }
            }
        },
        $server: [{
            port: "@cpx.port"
        }],
        target: {
            composix: {
                api: {
                    petstore: {
                        "$_:extend": [{
                            "swagger.json": JSON.parse(fs.readFileSync('src/main/swagger/petstore.json'))
                        }]
                    }
                }
            }
        }
    },
    register: {
        "@": {
            "swagger": {
                "statusCode": {
                    "200": {
                        "200": {
                            "description": "OK"
                        }
                    }
                },
                "param": {
                    "organization": {
                        "in": "path",
                        "name": "organization",
                        "description": "name of your organization all in lowercase",
                        "required": true,
                        "type": "string",
                        "example": "composix"
                    },
                    "apiname": {
                        "in": "path",
                        "name": "apiname",
                        "description": "name of your API",
                        "required": true,
                        "type": "string",
                        "example": "petstore"
                    }
                }
            }
        },
        $request: [{
            protocol: "http:",
            hostname: "@cpx.hostname",
            port: "@cpx.port",
            path: "/composix/api/swagger/swagger.json",
            method: "POST",
            body: {
                "swagger": "2.0",
                "info": {
                    "title": "ComPosiX swagger generator",
                    "version": "@cpx.pkg.version",
                    "description": "Creating Swagger API documentation the easy way",
                    "contact": {
                        "email": "@cpx.pkg.author.email"
                    },
                    "license": {
                        "name": "GNU Lesser General Public License (LGPL-v3)",
                        "url": "http://www.gnu.org/licenses/"
                    }
                },
                "host": "@cpx.hostname",
                "basePath": "swagger",
                "schemes": ["http"],
                "paths": {
                    "/{organization}/api/{apiname}/swagger.json": {
                        "get": {
                            "summary": "get Swagger documentation for your API",
                            "description": "enter the complete URL at http://swagger.io/ to try out your API",
                            "produces": ["application/json"],
                            "parameters": ["@swagger.param.organization", "@swagger.param.apiname"]
                        },
                        "put": {
                            "summary": "update Swagger documentation for your API",
                            "description": "allows you to host your Swagger documentation at composix.nl",
                            "consumes": ["application/json"],
                            "parameters": ["@swagger.param.organization", "@swagger.param.apiname"]
                        },
                        "post": {
                            "summary": "generate Swagger documentation for your API",
                            "description": "ComPosiX offers a DRY format for writing Swagger files based on hierarchical inheritance",
                            "consumes": ["application/json"],
                            "produces": ["application/json"],
                            "parameters": ["@swagger.param.organization", "@swagger.param.apiname", {
                                "in": "query",
                                "name": "update",
                                "description": "specify whether you want a dry run or update the hosted swagger",
                                "required": true,
                                "type": "boolean",
                                "default": false
                            }]
                        }
                    }
                }
            }
        }]
    }
};
