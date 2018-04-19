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

_.describe(['chai', 'searchPath'], function(_, chai, searchPath) {
	const path = require('path'), expect = chai.expect;

	_.ComPosiX('initialize');

	searchPath.postCurrent("file://localhost" + path.resolve(__dirname, "../../../..") + '/', 'src/main/');

	const strip = function(entity) {
		_.each(entity, function(value, key, object) {
			if (entity instanceof Object) {
				if (value instanceof Function) {
					delete object[key];
				} else {
					strip(value[key]);
				}
			}
		});
	};

	var errors;

	return {
		name: "errors",
		before: function() {
			return _.require('errors').then(function(value) {
				errors = value;
			});
		},
		xit: {
			errors: function() {
				const entity = _.clone(errors);
				strip(entity);
				_.each(entity, function(value) {
					expect(value.template).to.be.a('string');
					expect(value.scheme).to.be.an('object');
				});
				return true;
			}
		},
		it: {
			error: function() {
				const param = {};
				_.each([1], function(errno) {
					expect(_.error(errno, param)).to.be.an.instanceof(Error);
				});
				return true;
			}
		}
	}
});