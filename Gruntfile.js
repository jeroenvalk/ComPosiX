module.exports = function (grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat: {
			composix: {
				files: [{
					src: [
						'src/main/javascript/modules/composix.js',
						'src/main/javascript/modules/module.js',
						'src/main/javascript/modules/emitter.js',
						'src/main/javascript/modules/request.js',
						'src/main/javascript/modules/response.js'
					],
					dest: "target/dist/composix-debug.js"
				}]
			},
			swagger: {
				files: [{
					src: [
						'src/main/javascript/modules/validator.js',
						'src/main/javascript/modules/swagger.js'
					],
					dest: "target/dist/swagger-debug.js"
				}]
			},
			afterFlow: {
				files: [{
					src: ['src/main/javascript/modules/afterFlow.js'],
					dest: "target/dist/afterFlow-debug.js"
				}]
			},
			beforeFlow: {
				files: [{
					src: ['src/main/javascript/modules/beforeFlow.js'],
					dest: "target/dist/beforeFlow-debug.js"
				}]
			},
			underscore: {
				files: [{
					src: ['src/main/javascript/modules/underscore.js'],
					dest: "target/dist/underscore-debug.js"
				}]
			},
			all: {
				files: [{
					src: [
						'target/dist/composix-debug.js',
						'src/main/javascript/modules/config.js',
						'target/dist/swagger-debug.js',
						'target/dist/beforeFlow-debug.js'
					],
					dest: "target/dist/all.js"
				}]
			}
		},
		uglify: {
			options: {
				banner: '/* Copyright © ComPosiX (source @ https://github.com/jeroenvalk/ComPosiX) - v<%= pkg.version %> - ' +
				'<%= grunt.template.today("yyyy-mm-dd") %> */'
			},
			composix: {
				files: {
					'target/dist/composix-release.js': ['target/dist/composix-debug.js'],
					'target/dist/swagger-release.js': ['target/dist/swagger-debug.js'],
					'target/dist/afterFlow-release.js': ['target/dist/afterFlow-debug.js'],
					'target/dist/beforeFlow-release.js': ['target/dist/beforeFlow-debug.js'],
					'target/dist/underscore-release.js': ['target/dist/underscore-debug.js']
				}
			}
		}
	});

	grunt.registerMultiTask("concat", "Concatenate JavaScript files", function () {
		const fs = require("fs"), _ = require("lodash");
		_(this.data.files).each(function (files) {
			fs.writeFileSync(files.dest, _(files.src).map(function (filename) {
				return fs.readFileSync(filename).toString();
			}).join(""));
		})
	});

	grunt.registerMultiTask("uglify", "JavaScript minifier", function () {
		const options = grunt.config("uglify.options");
		const UglifyJS = require("uglify-es"), fs = require("fs"), _ = require("lodash");
		_.each(_.mapValues(this.data.files, function (array) {
			const input = _.mapValues(_.zipObject(array, array), function (filename) {
				return fs.readFileSync(filename).toString();
			});
			return UglifyJS.minify(input);
		}), function (result, filename) {
			if (result.error) {
				throw result.error;
			}
			fs.writeFileSync(filename, options.banner + result.code);
		});
	});

	grunt.registerTask('default', ['concat', 'uglify']);
};