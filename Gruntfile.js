module.exports = function (grunt) {

    grunt.initConfig({
        babel: {
            options: {
                minified: true,
                compact: true,
                comments: false
            },
            dist: {
                files: [{
                    "expand": false,
                    "src": ["src/main/javascript/plugins/validator.js"],
                    "dest": "target/dist/validator.min.js"
                }]
            }
        },
        replace: {
            validator: {
                src: ["target/dist/validator.min.js"],
                overwrite: true,
                replacements: [
                    {
                        from: "module.exports=",
                        to: "/* This file is part of ComPosiX v0.1.0 © https://github.com/jeroenvalk/ComPosiX/blob/master/src/main/javascript/plugins/validator.js */("
                    },
                    {
                        from: "_.mixin({validator:validator})};",
                        to: "_.mixin({validator:validator})})(_);"
                    }
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-babel');
    grunt.loadNpmTasks('grunt-text-replace');

    grunt.registerTask('default', ['babel', 'replace']);

};