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
	const yaml = require('js-yaml');

	_.module('js-yaml', ['globals', 'channel'], function(globals, channel) {
		const i = channel.create(), o = channel.create(true);

		const recurse = function() {
			channel.read(i.rd, Infinity, function(array) {
				const buffer = Buffer.concat(array);
				if (buffer.length > 0) {
					const doc = yaml.safeLoad(Buffer.concat(array));
					channel.write(o.wr, doc);
				} else {
					channel.write(o.wr, null);
				}
				recurse();
			});
		};

		const YAML = globals('YAML');

		recurse();

		YAML.parse = {
			rd: o.rd,
			wr: i.wr
		};

		return YAML.parse;
	});

	return _;
};