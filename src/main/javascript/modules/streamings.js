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

_.module("streamings", ["url", "request", "channel", "pipe", "target"], function (_, url, request, channel, pipe) {
	const i = channel.create(true), o = channel.create(true);

	var busy = false, count = 0;

	const process = function (options) {
		++count;
		if (options.url) {
			_.extend(options, url.parse(options.url));
		}
		request(options).then(function(response) {
			const body = response.body;
			response.body = body.contentType === "application/json" ? JSON.parse(Buffer.concat(body['#']).toString()) : null;
			channel.write(o.wr, response);
			if (--count === 0) {
				busy = false;
				channel.write(o.wr, null);
			}
		});
	};

	pipe(i.rd, {
		type: 'target',
		amount: 1,
		forever: true,
		write: function (array) {
			if (busy) {
				throw new Error('busy');
			}
			_.each(array, process);
		},
		end: function () {
			busy = true;
		}
	});
	return {
		request: {
			type: "node",
			rd: o.rd,
			wr: i.wr
		}
	};
});

