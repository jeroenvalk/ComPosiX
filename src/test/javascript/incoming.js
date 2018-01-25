const _ = require('../../main/javascript/index')(require('lodash'));

global.context = {
	proxyRequest: {
		headers: []
	},
	getVariable: function (name) {
		switch (name) {
			case 'request.path':
				return '/Mosaic';
		}
	}
};

_.module(['channel', 'path', 'swagger', 'response', 'incoming'], function (channel, path, swagger, response) {
	channel.write(this['#'], null);
	channel.read(swagger.refresh({
		swagger: "2.0",
		info: {
			title: path.normalize(channel.read(this.incoming['#'], 1)[0].pathname, true).pop(),
			contact: {
				name: 'Nutreco'
			}
		}
	}), Infinity, function(array) {
		console.log(array);
		response({
			statusCode: 200,
			body: array
		});
	});
});
