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

_.module(function(_) {
	const msg = {
		1: _.constant("not implemented"),
		2: _.constant("internal error"),
		3: function(param) {
			return "module not found: " + param;
		},
		10: function (param) {
			return "expected object but got: " + JSON.stringify(param);
		},
		11: function (param) {
			return "expected buffer but got: " + JSON.stringify(param);
		},
		12: _.constant("channel descriptor must be a number"),
		13: _.constant("writing to readable endpoint"),
		14: _.constant("reading from writable endpoint"),
		20: _.constant("pipe error"),
		21: function(param) {
			return "pipe: no source (1st arg) plugin for type: " + param.type;
		},
		22: function (param) {
			return 'pipe: no target (2nd arg) plugin for type: ' + param.type;
		}
	};

	const error = function error$error(errno, param) {
		if (isFinite(errno) && errno > 0) {
			throw new Error((msg[errno] ? msg[errno](param) : JSON.stringify(param)) + " (errno=" + errno + ")");
		}
		return null;
	};

	const throwError = function error$throw(errno, param) {
		const e = error(errno, param);
		if (e) {
			throw e;
		}
	};

	_.mixin({
		error: error,
		throw: throwError
	});
});
