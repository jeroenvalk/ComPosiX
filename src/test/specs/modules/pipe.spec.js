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

/* global _ */

_.describe(['pipe'], function (_) {
	const errorHandler = function(self, ignore) {
		return function (e) {
			if (!(e instanceof Error)) {
				e = new Error();
			}
			e.type = "ERROR";
			if (!ignore) {
				self.write([_.pick(e, ['type', 'stack', 'CAUSE.stack'])]);
			}
			self.write(null);
		};
	};

	_.mixin({
		error: _.wrap(_.error, function(func, errno) {
			const e = func(errno);
			if (e) {
				e.errno = errno;
			}
			return e;
		})
	});

	const expectErrno = function(expect, errno) {
		return function(e) {
			expect(e.errno).to.equal(errno);
		};
	};

	return {
		name: "pipe",
		use: {
			NodeJS: ['chai.expect'],
			ComPosiX: ['channel', 'pipe']
		},
		it: {
			null: function (expect, channel, pipe) {
				const self = this;
				Promise.all([
					pipe(0, 0),
					pipe(NaN).catch(expectErrno(expect, 23)),
					pipe(0, NaN).catch(expectErrno(expect, 24))
				]).then(function(rd) {
					expect(isNaN(rd[0])).to.equal(true);
					expect(rd[1]).to.equal(undefined);
					expect(rd[2]).to.equal(undefined);
					self.write(null);
				}).catch(errorHandler(this));
			},
			error: function (expect, channel, pipe) {
				pipe('', 0).then(errorHandler(this), errorHandler(this, true));
			},
			plugin: function (expect, channel, pipe) {
				_.module(['globals'], function (_, globals) {
					_.extend(globals('pipe.source'), {
						array: function (array) {
							if (array.length > 0) {
								const ch = channel.create(!(array[0] instanceof Buffer));
								channel.write(ch.wr, array);
								channel.write(ch.wr, null);
								return ch.rd;
							}
							return 0;
						}
					});
				});
				const self = this, ch = channel.create(), msg = [new Buffer('Hello World!')];
				var flag = false;
				pipe(msg, ch.wr).then(function (rd) {
					flag = true;
					expect(isNaN(rd)).to.equal(true);
					expect(channel.read(ch.rd, Infinity)).to.deep.equal(msg);
					self.write(null);
				}).catch(errorHandler(self));
				expect(flag).to.equal(false);
			}
		}
	};
});
