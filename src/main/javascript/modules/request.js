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

_.module("request", ["channel"], function(channel) {
	const i = channel.create(true), o = channel.create(true), rd = i.rd, wr = o.wr;

	const result = function cpx$request(req) {
		const asJSON = req.headers && req.headers.accept === "application/json";
		const exchange = httpClient.send(new Request(req.url, req.method || "GET", req.headers || {}, req.body || ""));

		function then(fn) {
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
			fn({
				status: res.status,
				headers: headers,
				body: asJSON && res.status == 200 ? JSON.parse(res.content) : res.content
			});
		}

		return {
			then: then
		};
	};

	channel.read(rd, Infinity, function(array) {
		channel.write(wr, _.map(array, result));
	});

	result.rd = o.rd;
	result.wr = i.wr;
	return result;
});
