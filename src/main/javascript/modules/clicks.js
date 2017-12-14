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

_.module("clicks", ["path", "channel"], function (path, channel) {
	const recurse = function clicks$wiring(value, context) {
		_.each(value, function (value, key) {
			switch (key.charAt(0)) {
				case '$':
					context.on(key.substr(1), function (event) {
						const pathname = path.toPath($(event.target));
						_.each(_.get(value, pathname), function (value, key, object) {
							switch (key.charAt(0)) {
								case '$':
									channel.write(value['#'] || value.$['#'], object);
									break;
							}
						});
					});
					break;
				default:
					recurse(value, $(key, context));
					break;
			}
		});
	};

	const wiring = function clicks$wiring(value) {
		window.viewmodel = value;
		recurse(value, $(window.document));
	};

	const clear = function clicks$clear() {
		const parent = this.parent['^'].value;
		return function () {
			$(parent.at).html("");
		};
	};

	const handlebars = function clicks$handlebars() {
		const parent = this.parent['^'].value, context = this.parent['^'].parent['^'].value;
		const template = $(parent.view).html();
		if (!template) throw new Error();
		const func = Handlebars.compile(template);
		return function () {
			const model = parent.model || context;
			const str = func(model);
			$(parent.at).html(str);
		};
	};

	return {
		wiring: wiring,
		clear: clear,
		handlebars: handlebars
	};
});
