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

_.module("consume", ["iterate"], function(iterate) {
	const isExchange = function(exchange) {
		return typeof exchange.waitForComplete === "function";
	};

	const result = function(exchange) {
		exchange.waitForComplete();
		if (!exchange.isSuccess()) {
			if (exchange.isError()) {
				throw new Error(exchange.getError());
			}
			throw new Error('unknown error');
		}
		const res = exchange.getResponse(), headers = {};
		for (var name in res.headers) {
			headers[name] = res.headers[name];
		}
		return [{
			status: res.status,
			headers: headers,
			body: [new Buffer(res.content)]
		}];
	};

	const consume = function cpx$consume(entity, options, depth) {
		iterate(entity).eachValuesDeep(function(value) {
			const I = iterate(value);
			switch(I.type) {
				case -1:
					I.replace(function(array) {
						return array instanceof Array ? array : result(array);
					});
					break;
			}
		});
	};
});
