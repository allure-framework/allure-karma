var Server = require('karma').Server;

var karmaConfig = {
    basePath: __dirname,
    frameworks: ['jasmine'],
    files: [
        'specs/*.js'
    ],
    port: 9876,
    colors: true,
    browsers: ['PhantomJS', 'Firefox'],
    captureTimeout: 60000,
    singleRun: true,

    reporters: ['allure'],
    plugins: [
        require('./../../index.js'),
        'karma-jasmine',
        'karma-phantomjs-launcher',
        'karma-firefox-launcher'
    ],
    allureReport: {
        reportDir: 'out'
    }
};

var server = new Server(karmaConfig, function(exitCode) {
    process.exit(1);
});

server.start();

server.on('run_complete', function (browsers, results) {
    process.exit(0);
});
