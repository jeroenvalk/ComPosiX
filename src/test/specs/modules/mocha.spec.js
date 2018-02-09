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

_.describe({
	name: "mocha",
	use: {
		NodeJS: ['chai.expect'],
		ComPosiX: ['pipe', 'source', 'target']
	},
	it: {
		sync: function(expect, pipe) {
			// for successfull tests use the pipe method send an EOF to this testcase
			// otherwise the test will run into a timeout
			pipe(null, this);
			// note that null is used as EOF symbol (as implemented in source.js)
			// also note that 'this' is a writable target (see target.js for supported writables)
		},
		simple: function () {
			// simply throwing an error will fail the test
			// throw _.extend(new Error(), {type: 'INFO'});

			// for synchronous tests you can alternatively return true to send an EOF
			return true;
		},
		async: function(expect, pipe) {
			_.module(['globals', 'channel'], function(_, globals, channel) {
				const ch = channel.create(true);
				const info = function(error) {
					console.error('[INFO]', error);
					channel.write(ch.wr, null);
					return ch.rd;
				};
				const error = function(error) {
					channel.write(ch.wr, _.pick(error, ['type', 'stack', 'CAUSE.stack']));
					channel.write(ch.wr, null);
					return ch.rd;
				};
				const fatal = function(error) {
					console.error(error); error(error);
					return ch.rd;
				};

				_.extend(globals('source.object'), {
					INFO: info,
					ERROR: error,
					FATAL: fatal
				});
			});

			const EOF = function(self) {
				return function() {
					pipe(null, self);
				};
			};

			const ERR = function(self) {
				const fatal = new Error('internal error');
				fatal.type = 'FATAL';
				return function(error) {
					pipe(error, self, {
						write: function(err) {
							fatal.CAUSE = err;
							console.error('ERROR', fatal);
						},
						end: EOF(self)
					});
				};
			};

			const self = this;
			Promise.resolve().then(function() {
				throw _.extend(new Error(), {type: 'INFO'});
				//throw _.extend(new Error(), {type: 'ERROR'});
				//throw _.extend(new Error(), {type: 'FATAL'});
			}).then(EOF(this), ERR(this)); // use ERR function to catch errors
		}
	}
});
