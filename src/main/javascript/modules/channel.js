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

_.module("channel", ["emitter"], function (emitter, x) {
	const state = {0: [{push: _.identity}, true]}, push = Array.prototype.push;
	var current = 0;

	const onError = function (errno, value) {
		var msg;
		if (errno) {
			msg = "expected object but got: " + JSON.stringify(value);
		} else {
			msg = "expected buffer but got: " + JSON.stringify(value);
		}
		throw new Error(msg);
	};

	const continuation = function (buf, fd, amount, callback) {
		const listener = function (value) {
			if (buf) {
				if (value) {
					if (buf.length + value.length < amount) {
						push.apply(buf, value);
					} else {
						value = _.flatten([buf, value.slice(0, amount - buf.length)]);
						buf = null;
						callback(value);
					}
				} else {
					value = buf;
					buf = null;
					callback(value);
				}
			}
		};
		emitter.addListener(fd, listener);
	};

	const write = function cpx$write(fd) {
		return function cpx$result$write() {
			x.write(fd, _.flatten(arguments));
		};
	};

	x.create = function cpx$channel$create(mode, func) {
		const fd = ++current;
		state[fd] = [[], mode || false, false];
		if (!func) {
			return {
				rd: -fd,
				wr: fd
			};
		}
		const self = {
			write: write(fd)
		};
		return function () {
			const result = func.apply(self, arguments);
			if (result) {
				if (result instanceof Object) {
					x.write(fd, result);
				}
				x.write(fd, null);
			}
			return -fd;
		};
	};

	x.write = function cpx$channel$write(fd) {
		var i;
		if (fd < 0) {
			if (isNaN(fd)) {
				throw new Error("channel descriptor must be a number");
			}
			throw new Error("writing to readable endpoint");
		}
		const array = _.flatten(arguments), paused = state[fd][0], objectMode = state[fd][1],
			typeCheck = objectMode ? _.isPlainObject : _.isBuffer;
		if (array[1] === null) {
			if (paused) {
				paused.push(null);
			} else {
				state[fd][0] = [];
				emitter.removeAllListeners(fd, true);
				emitter.emit(fd, null);
			}
		} else {
			for (i = 1; i < array.length; ++i) {
				if (!typeCheck(array[i])) {
					onError(objectMode, array[i]);
				}
			}
			if (paused) {
				for (i = 1; i < array.length; ++i) {
					paused.push(array[i]);
				}
			} else {
				emitter.emit(fd, array.slice(1));
			}
		}
	};

	x.read = function cpx$channel$read(fd, amount, callback) {
		fd = -fd;
		if (fd > 0) {
			var i, data, buf = state[fd][0];
			if (buf) {
				for (i = 0; i < buf.length; ++i) {
					if (!buf[i]) break;
				}
				if (i < buf.length) {
					if (i < amount) {
						data = buf.splice(0, i + 1);
						if (data.pop()) {
							throw new Error("internal error");
						}
						callback && callback(data);
						state[fd][2] = false;
					} else {
						data = buf.splice(0, amount);
						state[fd][2] = true;
						callback && callback(data);
						if (state[fd][2]) {
							buf.splice(0, i - amount + 1);
							state[fd][2] = false;
						}
					}
					return data;
				}
				if (i < amount) {
					state[fd][0] = null;
					return continuation(buf, fd, amount, callback);
				}
				data = buf.splice(0, amount);
				callback && callback(data);
				return data;
			}
			return continuation([], fd, amount, callback);
		}
		throw new Error("reading from writable endpoint");
	};
});
