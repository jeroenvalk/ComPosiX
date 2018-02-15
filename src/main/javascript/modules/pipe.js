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
	const pipeSource = globals('pipe.source'), pipeTarget = globals('pipe.target');

	var cause;

	const onReject = function pipe$onReject(error) {
		if (cause) {
			error.CAUSE = cause;
		}
		throw error;
	};

	pipeSource.number = _.identity;
	pipeTarget.number = function (wr) {
		return {
			result: 0,
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
	};

	const normalize = function (pair) {
		const normalizeSource = pipeSource[typeOf(pair[0])], normalizeTarget = pipeTarget[typeOf(pair[1])];
		if (!_.isFunction(normalizeSource)) {
			throw new Error('pipe: no source (1st arg) plugin for type: ' + typeOf(pair[0]));
		}
		if (!_.isFunction(normalizeTarget)) {
			throw new Error('pipe: no target (2nd arg) plugin for type: ' + typeOf(pair[1]));
		}
		return Promise.resolve(normalizeSource(pair[0])).then(function (source) {
			if (!isFinite(source)) {
				_.throw();
			}
			return Promise.resolve(normalizeTarget(pair[1])).then(function (target) {
				pair[0] = source;
				pair[1] = target;
				return pair;
			});
		});
	};

	return function cpx$pipe(source, target) {
		cause = new Error('pipe');
		return Promise.all([source, target]).then(normalize).then(function (pair) {
			helper(pair[0], pair[1]);
			return pair[1].result;
		}).catch(onReject);
	};
});