_.plugin('initialize', function(_) {
	const cpx = _.ComPosiX, url = require('url');
	const searchPath = _.require('searchPath');
	const authority = url.resolve(cpx.config('authority'), cpx.config('pathname'));
	cpx.pathResource(function (suffix) {
		const part = cpx.resolveHome(suffix, "./");
		searchPath.postCurrent(authority, url.resolve(part[0], part[1]));
	});
	cpx.eachHome(function (home) {
		cpx.pathHome(home, function (pathname, suffix) {
			const part = cpx.resolveHome(suffix, pathname);
			searchPath.postCurrent(url.resolve(authority, part[0]), part[1]);
		});
	});
});
