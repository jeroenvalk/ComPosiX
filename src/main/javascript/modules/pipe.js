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

_.module('pipe', ['globals', 'typeOf', 'globals', 'channel'], function (_, globals2, typeOf, globals, channel) {
	const pipeSource = globals('pipe.source'), pipeTarget = globals('pipe.target'), isInteger = Number.isInteger;

	pipeSource.number = _.identity;
	pipeTarget.number = function (wr) {
		_.throw(isInteger(wr) ? (wr < 0 ? 13 : 0) : 24)
		return {
			type: 'target',
			result: NaN,
			amount: 1, // TODO: this can better be NaN
			write: function (array) {
				channel.write(wr, array);
			},
			end: function () {
				channel.write(wr, null);
			}
		}
	};

	const helper = function (source, target) {
		var k = 0;
		const recurse = function () {
			channel.read(source, target.amount, function (array) {
				target.write(array, k += array.length);
				if (array.length < target.amount) {
					target.end(k);
					if (k > 0) {
						k = 0;
						recurse();
					}
				} else {
					recurse();
				}
			});
		};
		recurse();
		return target.result;
	};

	const _source = function(source) {
		return Promise.resolve(source).then(function(source) {
			const func = pipeSource[typeOf(source)];
			if (!_.isFunction(func)) {
				return Promise.reject(_.error(21, {type: typeOf(source)}));
			}
			return func(source);
		}).then(function(rd) {
			_.throw(isInteger(rd) ? (rd > 0 ? 14 : 0) : 23);
			return rd;
		});
	};

	const _target = function(target) {
		return Promise.resolve(target).then(function(target) {
			const func = pipeTarget[typeOf(target)];
			if (!_.isFunction(func)) {
				return Promise.reject(_.error(22, {type: typeOf(target)}));

			}
			return func(target);
		}).then(function(obj) {
			_.throw(obj && obj.type === 'target' ? 0 : 24);
			return obj;
		});
	};

	return _.extend(function cpx$pipe(source, target) {
		return Promise.all([_source(source), _target(target)]).then(_.spread(helper)).catch(_.cause(20));
	}, {
		source: _source,
		target: _target
	});
});