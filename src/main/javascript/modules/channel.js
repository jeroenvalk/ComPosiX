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
	const state = {}, push = Array.prototype.push;
	var current = 0;

	const onError = function (errno) {
		var msg;
		if (errno) {
			msg = "channel accept raw buffers only";
		} else {
			msg = "channel accepts plain objects only";
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

	x.create = function cpx$channel$create(mode) {
		const fd = ++current;
		state[fd] = [[], mode || false];
		return {
			rd: -fd,
			wr: fd
		};
	};

	x.write = function cpx$channel$write(fd) {
		var i;
		if (fd > 0) {
			const array = _.flatten(arguments), paused = state[fd][0], objectMode = state[fd][1],
				typeCheck = objectMode ? _.isPlainObject : _.isBuffer;
			if (array[1] === null) {
				if (paused) {
					paused.push(null);
				} else {
					emitter.emit(fd, null);
					emitter.removeAllListeners();
					state[fd][0] = [];
				}
			} else {
				for (i = 1; i < array.length; ++i) {
					if (array[i] !== null && !_.isPlainObject(array[i])) {
						onError(objectMode);
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
		} else {
			throw new Error("writing to readable endpoint");
		}
	};

	x.read = function cpx$channel$read(fd, amount, callback) {
		fd = -fd;
		if (fd > 0) {
			var i, data, buf = state[fd][0], aux;
			if (buf) {
				for (i = 0; i < buf.length; ++i) {
					if (!buf[i]) break;
				}
				if (i < buf.length) {
					var msg = JSON.stringify(buf) + amount + " " + i;
					if (amount < i) {
						data = buf.splice(0, amount);
						aux = buf.length;
						callback && callback(data);
						if (aux === buf.length) {
							buf.splice(0, i - amount + 1);
						}
					} else {
						data = buf.splice(0, i);
						aux = buf.length;
						callback && callback(data);
						if (aux === buf.length) {
							buf.shift();
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
