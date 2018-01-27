/**
 * Copyright © 2018 dr. ir. Jeroen M. Valk
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

// modified version of json2yml: https://www.npmjs.com/package/json2yaml

_.module('yaml', ['globals', 'typeOf'], function(globals, typeOf) {
	"use strict";

	const YAML = globals('YAML');

	YAML.stringify = function YAML$stringify(data) {
		var handlers
			, indentLevel = ''
		;

		handlers = {
			"undefined": function () {
				// objects will not have `undefined` converted to `null`
				// as this may have unintended consequences
				// For arrays, however, this behavior seems appropriate
				return 'null';
			}
			, "null": function () {
				return 'null';
			}
			, "number": function (x) {
				return x;
			}
			, "boolean": function (x) {
				return x ? 'true' : 'false';
			}
			, "string": function (x) {
				// to avoid the string "true" being confused with the
				// the literal `true`, we always wrap strings in quotes
				return JSON.stringify(x);
			}
			, "array": function (x) {
				var output = ''
				;

				if (0 === x.length) {
					output += '[]';
					return output;
				}

				x.forEach(function (y) {
					// TODO how should `undefined` be handled?
					var handler = handlers[typeOf(y)]
					;

					if (!handler) {
						throw new Error('what the crap: ' + typeOf(y));
					}

					indentLevel = indentLevel.replace(/$/, '    ');
					y = handler(y);
					indentLevel = indentLevel.replace(/    /, '');

					output += '\n' + indentLevel + '- ' + y;

				});

				return output;
			}
			, "object": function (x) {
				var output = ''
				;

				if (0 === Object.keys(x).length) {
					output += '{}';
					return output;
				}

				Object.keys(x).forEach(function (k) {
					var val = x[k]
						, handler = handlers[typeOf(val)]
					;

					if ('undefined' === typeof val) {
						// the user should do
						// delete obj.key
						// and not
						// obj.key = undefined
						// but we'll error on the side of caution
						return;
					}

					if (!handler) {
						throw new Error('what the crap: ' + typeOf(val));
					}

					indentLevel = indentLevel.replace(/$/, '    ');
					val = handler(val);
					indentLevel = indentLevel.replace(/    /, '');

					output += '\n' + indentLevel + k + ': ' + val;
				});

				output += '\n';

				return output;
			}
			, "function": function () {
				// TODO this should throw or otherwise be ignored
				return '[object Function]';
			}
		};

		return '---' + handlers[typeOf(data)](data) + '\n';
	};

	return YAML;
});
