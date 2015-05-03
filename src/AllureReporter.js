/*jslint node: true */
'use strict';
var Allure = require('allure-js-commons');
var path = require('path');

function AllureReporter(baseReporterDecorator, config) {
    config.files.unshift(this.createClientScriptConfig(path.resolve(__dirname, '../client/allure.js')));
    config.allureReport = config.allureReport || {};

    var outDir = config.allureReport.reportDir ? path.resolve(config.basePath, config.allureReport.reportDir) : undefined;
    this.allure = new Allure({
        targetDir: outDir
    });
    this.suites = {};
    baseReporterDecorator(this);

    this.onRunComplete = function () {
        Object.keys(this.suites).forEach(function(suite) {
            var results = this.suites[suite],
                stopTime = results.reduce(function(stop, result) {
                    return Math.max(stop, result.stop);
                }, Number.NEGATIVE_INFINITY);
            this.allure.endSuite(suite, stopTime);
        }, this);
    };

    this.specSuccess = this.specFailure = function (browser, result) {
        this.addTimeToResult(result);
        var suite = this.getSuite(browser, result);
        this.allure.startCase(suite, result.description, result.start);
        var err = this.getTestcaseError(result);
        this.allure.endCase(suite, result.description, this.getTestcaseStatus(result, err), err, result.stop);
    };
    this.specSkipped = function(browser, result) {
        this.addTimeToResult(result);
        var suite = this.getSuite(browser, result);
        this.allure.pendingCase(suite, result.description, result.stop);
    };
}

AllureReporter.prototype.addTimeToResult = function(result) {
    result.stop = Date.now();
    result.start = result.stop - result.time;
    return result;
};

AllureReporter.prototype.getSuite = function(browser, result) {
    var suiteName = '['+browser+ '] '+result.suite.join(' '),
        suite = this.suites[suiteName];
    if(!suite) {
        suite = [];
        this.suites[suiteName] = suite;
        this.allure.startSuite(suiteName, result.start);
    }
    suite.push(result);
    return suiteName;
};

AllureReporter.prototype.getTestcaseError = function(result) {
    var log = result.log[0];
    if(log) {
        log = log.split('\n');
        return {
            message: log[0],
            stack: log[1]
        }
    }
};

AllureReporter.prototype.createClientScriptConfig = function(path) {
    return {pattern: path, included: true, served: true, watched: false};
};

AllureReporter.prototype.getTestcaseStatus = function(result, err) {
    if(result.skipped) {
        return 'pending';
    }
    else if(result.success) {
        return 'passed';
    }
    else {
        return err && err.message.indexOf('Expected') > -1 ? 'failed' : 'broken';
    }
};

AllureReporter.$inject = ['baseReporterDecorator', 'config', 'emitter', 'logger', 'helper'];
module.exports = AllureReporter;
