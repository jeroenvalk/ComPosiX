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

_.module("streamings", ["url", "https", "channel", "pipe", "target"], function (_, url, https, channel, pipe) {
	const i = channel.create(true), o = channel.create(true);

	var busy = false, count = 0;

	const mimeType = {
		".txt": "text/plain",
		".json": "application/json",
		".yaml": "application/x-yaml",
		".yml": "application/x-yaml",
		".js": "application/javascript"
	};

	const process_https = function (options) {
		++count;
		if (options.url) {
			_.extend(options, url.parse(options.url));
		}
		https.request(options, function (res) {
			const result = [];
			res.on("data", function (chunk) {
				result.push(chunk);
			});
			res.on("end", function () {
				const body = {
					"contentType": mimeType[options.pathname.substr(options.pathname.lastIndexOf('.'))] || res.headers['content-type'],
					"#": result
				};
				channel.write(o.wr, {
					statusCode: res.statusCode,
					headers: _.fromPairs(_.map(res.headers, function (value, key) {
						return [_.camelCase(key), value];
					})),
					body: body.contentType === "application/json" ? JSON.parse(Buffer.concat(body['#']).toString()) : null
				});
				if (--count === 0) {
					busy = false;
					channel.write(o.wr, null);
				}
			});
		}).end(options.body ? options.body['#'] : undefined);
	};

	const process = function (options) {
		switch (options.protocol) {
			case undefined:
			case 'https':
				process_https(options);
				break;
			default:
				throw new Error('not implemented');
		}
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

