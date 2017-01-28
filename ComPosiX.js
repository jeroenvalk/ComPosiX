module.exports = {
    $register: ['ComPosiX'],
    $dependencies: [{
        fs: require('fs'),
        path: require('path'),
        request: require('request')
    }],
    $listen: [{
        port: 8080
    }]
};