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

// emitter (basic version)
_.module("emitter", function () {
	const listeners = {};

	const emit = function emitter$emit(event) {
		const argv = _.tail(arguments);
		_.each(listeners[event], function (listener) {
			listener.apply(null, argv);
		});
	};

	const addListener = function emitter$addListener(eventName, listener) {
		listeners[eventName] = _.concat(listeners[eventName] || [], listener);
	};

	return {
		emit: emit,
		addListener: addListener
	};
});
