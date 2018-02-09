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

_.module("produce", ["channel"], function(_, channel) {

	const customizer = function(value) {
		if (_.isArray(value)) {
			const ch = channel.create();
			_(value).each(function(value) {
				if (_.isPlainObject(value) || _.isBuffer(value)) {
					channel.write(ch.wr, value);
				} else {
					throw new Error("invalid channel data");
				}
			});
			channel.write(ch.wr, null);
			return [ch.rd];
		}
	};

	const produce = function cpx$produce(fd, value) {
		return _.cloneDeepWith(value, customizer);
	};
});