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

module.exports = function(_) {
	const xml2js = require('xml2js');
	const xmlValues = new xml2js.Builder({
		tagNameProcessors: [function(name) {
			return name.toUpperCase();
		}]
	});

	_.module("json", ["channel"], function(channel) {
		const i = channel.create(true), o = channel.create();

		const recurse = function() {
			channel.read(i.rd, 1, function(array) {
				if (array.length > 0) {
					channel.write(o.wr, Buffer.from(xmlValues.buildObject(array[0])));
				} else {
					channel.write(o.wr, null);
				}
				channel.write(o.wr, null);
				recurse();
			});
		};

		recurse();

		return {
			rd: o.rd,
			wr: i.wr
		};
	});
};