var karma = require('karma').server;

karma.start({
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
}, function (done) {

});
