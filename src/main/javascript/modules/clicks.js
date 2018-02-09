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

_.module("clicks", ["path", "channel"], function (_, path, channel) {
	const execute = function clicks$execute(value) {
		_.each(value, function (value, key, object) {
			switch (key.charAt(0)) {
				case '$':
					console.log(key, value);
					channel.write(value['#'] || value.$['#'], object);
					break;
			}
		});
	};

	const recurse = function clicks$wiring(value, context) {
		_.each(value, function (value, key) {
			switch (key.charAt(0)) {
				case '$':
					context.on(key.substr(1), function (event) {
						const pathname = path.toPath($(event.target));
						execute(_.get(value, pathname, value));
					});
					break;
				default:
					if (_.isObject(value)) {
						recurse(value, $(key, context));
					}
					break;
			}
		});
	};

	const wiring = function clicks$wiring(value, context) {
		recurse(value, $(context));
	};

	const plugins = function(window) {
		const cpx = window.ComPosiX || window;

		const clear = function clicks$clear() {
			const parent = this.parent['^'].value;
			return function () {
				$(parent.at, cpx.document).html("");
			};
		};

		const handlebars = function clicks$handlebars() {
			const parent = this.parent['^'].value, context = this.parent['^'].parent['^'].value;
			const template = $(parent.view, cpx.document).html();
			if (!template) throw new Error();
			const func = Handlebars.compile(template);
			return function () {
				const model = parent.model || context;
				const str = func(model);
				$(parent.at, cpx.document).html(str);
			};
		};

		return {
			clear: clear,
			handlebars: handlebars
		};
	};

	const plugin = plugins(window);

	return {
		wiring: wiring,
		plugins: plugins,
		execute: execute,
		clear: plugin.clear,
		handlebars: plugin.handlebars
	};
});
