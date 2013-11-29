module.exports = function(config) {
  config.set({

    basePath: '',
    frameworks: ['jasmine'],
    files: [
      'specs/*.js'
    ],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['PhantomJS'],
    captureTimeout: 60000,
    singleRun: false,

    reporters: ['allure'],
    plugins: [
        require('./../../index.js'),
        'karma-jasmine',
        'karma-phantomjs-launcher'
    ],
    allureReport: {
        reportDir: 'report-target'
    }
  });
};
