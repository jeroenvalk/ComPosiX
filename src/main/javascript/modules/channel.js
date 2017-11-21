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

_.module("channel", ["emitter"], function(emitter, x) {
	const paused = {};
	var current = 1;

	x.create = function cpx$channel$create() {
		paused[current] = [];
		return {
			rd: -current,
			wr: current++
		};
	};

	x.write = function cpx$channel$write(fd, data) {
		if (fd > 0) {
			if (paused[fd]) {
				paused[fd].push(data);
			} else {
				emitter.emit(fd, data);
			}
		} else {
			throw new Error("writing to readable endpoint");
		}
	};

	x.read = function cpx$channel$read(fd, listener) {
		fd = -fd;
		if (fd > 0) {
			var i = 0;
			emitter.addListener(fd, listener);
			while (i < paused[fd].length) {
				emitter.emit(fd, paused[fd][i++]);
			}
			delete paused[fd];
		} else {
			throw new Error("reading from writable endpoint");
		}
	};
});
