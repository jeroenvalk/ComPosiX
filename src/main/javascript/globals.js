/**
 * Copyright © 2017, 2018 dr. ir. Jeroen M. Valk
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

module.exports = function ($) {
	'use strict';

	if ($ === undefined) {
		$ = {};
	}

	if (Object.getPrototypeOf($) !== Object.prototype) {
		throw new Error("globals.js: first argument must be plain object");
	}

	$.url = $.url || require('url');
	$.stream = $.stream || require('stream');
	$.http = $.http || require('http');
	$._ = $._ || require('lodash');
	$._.mixin({require: require});
	$._ = require(".")($._);
	$._.ComPosiX({
		plugins: {
			mocha: true
		}
	});
	$._.ComPosiX('module', 'mocha');
	$.processor = $.processor || require('./processor');

	var globals = {
		_: $._,
		ComPosiX: $.ComPosiX || require('./ComPosiX')($.url, $.stream, $.http, $._, $.processor),
		node: {
			chai: require('chai')
		},
		expect: $.expect || require('chai').expect
	};

	$._.mixin({
		globals: function globals$globals(fn) {
			return function () {
				fn.call(this, globals);
			}
		}
	});

	return globals._;
};
