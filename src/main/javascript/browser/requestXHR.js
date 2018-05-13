/**
 * Copyright © 2018 dr. ir. Jeroen M. Valk
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
	const optionsToURL = function (options) {
		return options.protocol + '//' + options.hostname + (options.port ? ":" + options.port : "") + options.pathname + '?' + new URLSearchParams(options.query).toString();
	};

	const request = function(options, contentType) {
		return new Promise(function (resolve) {
			const xhr = new XMLHttpRequest();
			xhr.open(options.method, optionsToURL(options));
			_.each(options.headers, function (value, key) {
				xhr.setRequestHeader(key, value);
			});
			xhr.onreadystatechange = function () {
				var response;
				switch (this.readyState) {
					case this.DONE:
						response = {
							type: "response",
							statusCode: xhr.status,
							body: {
								contentType: contentType || xhr.getResponseHeader('content-type'),
								"#": [xhr.responseText]
							}
						};
						resolve(response);
						break;
				}
			};
			xhr.send(options.body && JSON.stringify(options.body));
		});
	}

	_.module('requestHTTPS', _.constant(request));
	_.module('requestHTTP', _.constant(request));
});
