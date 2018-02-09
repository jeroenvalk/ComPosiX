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

_.module('source', ['globals', 'channel'], function (_, globals, channel) {
	const sourceUndefined = function source$undefined(readable) {
		return new Promise(function (resolve) {
			var ch;

			readable.on('data', function (chunk) {
				if (!ch) {
					ch = channel.create(!(chunk instanceof Buffer));
					resolve(ch.rd);
				}
				channel.write(ch.wr, chunk);
			});

			readable.once('end', function () {
				channel.write(ch.wr, null);
				channel.write(ch.wr, null);
				readable.destroy();
			});
		})
	};

	const objectSource = _.extend(globals('source.object'), {
		undefined: sourceUndefined
	});

	const sourceNull = function source$null() {
		const ch = channel.create(true);
		channel.write(ch.wr, null);
		return ch.rd;
	};

	const sourceObject = function source$object(obj) {
		const normalize = objectSource[obj.type];
		if (!_.isFunction(normalize)) {
			throw new Error('source: no plugin for object type: ' + obj.type);
		}
		return normalize(obj);
	};

	_.extend(globals('pipe.source'), {
		object: sourceObject,
		null: sourceNull
	})
});
