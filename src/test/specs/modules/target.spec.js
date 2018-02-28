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

_.describe(['channel', 'pipe', 'target'], function(_, channel, pipe) {
	const fail = function(self) {
		return function(e) {
			self.write(_.pick(e, ['type', 'stack', 'CAUSE.stack']));
			self.write(null);
		};
	};

	const msg = Buffer.from("Hello World!");
	const passthrough = function target$passthrough(expect) {
		const self = this;
		const PassThrough = require('stream').PassThrough;
		const target = new PassThrough(), ch = channel.create();
		pipe(ch.rd, target).catch(fail(this));
		target.on("data", function(chunk) {
			expect(chunk).to.equal(msg);
		});
		target.on("end", function() {
			self.write(null);
		});
		channel.write(ch.wr, msg);
		channel.write(ch.wr, null);
	};

	return {
		name: 'target',
		use: {
			NodeJS: ['chai.expect']
		},
		it: {
			passthrough: passthrough
		}
	};
});
