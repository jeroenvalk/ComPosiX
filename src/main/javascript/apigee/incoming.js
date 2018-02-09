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

_.module("incoming", ["channel"], function (_, channel) {
	const argv = [this], cfg = channel.create(true), ch = channel.create(true);
	_.extend(this, {
		'#': cfg.wr,
		incoming: {
			'#': ch.rd
		}
	});

	channel.read(cfg.rd, Infinity, function(array) {
		Array.prototype.push.apply(argv, array);
		_.extend.apply(_, argv);

		const headers = {};
		for (var name in context.proxyRequest.headers) {
			headers[name] = context.proxyRequest.headers[name];
		}
		const incoming = {
			protocol: context.getVariable("client.scheme") + ":",
			method: context.getVariable("request.verb"),
			hostname: context.getVariable("request.header.host"),
			path: context.getVariable("request.uri"),
			pathname: context.getVariable("request.path"),
			headers: headers
		};

		channel.write(ch.wr, incoming);
	});
});
