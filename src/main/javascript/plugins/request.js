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

_.plugin("request", function(_) {
	const https = require("https"), url = require("url");

	_.module("request", ["channel"], function(_, channel) {
		const i = channel.create(true), o = channel.create(true);
		const func = channel.create(true, function() {
			const self = this;
			_.map(arguments, function(options) {
				_.extend(options, url.parse(options.url));
				https.request(options, function(res) {
					const result = [];
					res.on("data", function(chunk) {
						result.push(chunk);
					})
					res.on("end", function() {
						const buffer = Buffer.concat(result);
						self.write({body: [JSON.parse(buffer.toString())]});
						self.write(null);
					});
				}).end();
			});
		});
		const recurse = function(depth) {
			channel.read(i.rd, Infinity, function(array) {
				channel.read(func.apply(null, array), Infinity, function(array) {
					channel.write(o.wr, array);
					channel.write(o.wr, null);
					if (--depth > 0) recurse(depth);
				});
			});
		};
		recurse(Infinity);
		return {
			rd: o.rd,
			wr: i.wr
		};
	});
});
