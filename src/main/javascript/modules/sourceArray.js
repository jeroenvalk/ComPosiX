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

_.module('sourceArray', ['globals', 'channel'], function(_, globals, channel) {
	_.extend(globals('pipe.source'), {
		array: function source$array(array) {
			const ch = channel.create(array.length > 0 && !(array[0] instanceof Buffer));
			channel.write(ch.wr, array);
			channel.write(ch.wr, null);
			return ch.rd;
		}
	})
});
