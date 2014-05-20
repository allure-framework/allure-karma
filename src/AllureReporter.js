/*jslint node: true */
'use strict';
var FileWriter = require('./FileWriter');
var xml = require('js2xmlparser');
var path = require('path');
var _ = require('underscore');
var crypto = require("crypto");

var ASSERTION_KEYWORD = 'Expected';

function generateUid(name) {
    return crypto.createHash("sha256").update(name, "utf8").digest("hex");
}

function getTestcaseLastLog(testcase) {
    var length = testcase.log.length;
    return length > 0 ? testcase.log[0] : '';
}

function getTestcaseStatus(testcase) {
    if(testcase.skipped) {
        return 'skipped';
    }
    else if(testcase.success) {
        return 'passed';
    }
    else {
        return getTestcaseLastLog(testcase).indexOf(ASSERTION_KEYWORD) !== -1 ? 'failed' : 'broken';
    }
}

function createPattern(path) {
    return {pattern: path, included: true, served: true, watched: false};
}


function writeTestCaseFailure(testcase, report) {
    if(!testcase.success) {
        var lastLog = getTestcaseLastLog(testcase).split('\n');
        report.failure = {
            message: lastLog[0] || '',
            'stack-trace': lastLog[1] || ''
        };
    }
}

function writeAllureFields(testcase, report) {
    function mapStep(step) {
        return {
            '@': {
                start: step.start,
                stop: step.stop,
                status: 'passed'
            },
            title: step.name,
            steps: {
                step: step.steps.map(mapStep)
            }
        }
    }
    var allure = testcase.allure;
    if(allure.description) {
        report.description = allure.description;
    }
    report['@'].severity = allure.severity || 'normal';
    if(allure.steps) {
        report.steps = {step: allure.steps.map(mapStep)};
    }
}


function AllureReporter(baseReporterDecorator, config,  emitter, logger, helper) {
    config.files.unshift(createPattern(__dirname + '/../client/allure.js'));
    config.allureReport = config.allureReport || {};
    var outDir = config.allureReport.reportDir ? path.resolve(config.basePath, config.allureReport.reportDir) : config.basePath;
    var writer = new FileWriter(outDir, logger, helper);

    var suites;
    var currentTestcase = {};

    baseReporterDecorator(this);

    this.adapters = [function (msg) {}];

    this.onRunStart = function (browsers) {
        suites = {};
    };

    this.onBrowserStart = function() {};

    this.onBrowserLog = function(browser, message, type) {
        if(type === 'allure') {
            if(message.step) {
                currentTestcase.steps = currentTestcase.steps || [];
                currentTestcase.steps.push(message.step);
                delete message.step;
            }
            _.extend(currentTestcase, message);
        }
    };

    this.onRunComplete = function () {
        _.each(suites, function (value, key) {
            var suiteStart = Number.POSITIVE_INFINITY,
                suiteStop = 0,
                uid = generateUid(key),
                testcases = [],
                data = {
                    '@': {},
                    title: key,
                    'test-cases': {
                        'test-case': testcases
                    }
                };

            value.forEach(function (testcase) {
                var caseStart = testcase.stop - testcase.time,
                    report = {
                        '@': {
                            start: caseStart,
                            stop: testcase.stop,
                            status: getTestcaseStatus(testcase)
                        },
                        title: testcase.description
                    };
                suiteStart = Math.min(suiteStart, caseStart);
                suiteStop  = Math.max(suiteStop,  testcase.stop);
                writeTestCaseFailure(testcase, report);
                writeAllureFields(testcase, report);
                testcases.push(report);
            });

            data['@'].start = suiteStart;
            data['@'].stop  = suiteStop;
            writer.writeFile(uid + '-testsuite.xml', xml('test-suite', data));
        });
        suites = null;
    };

    this.specSuccess = this.specSkipped = this.specFailure = function (browser, result) {
        var suite = suites[result.suite[0]] = suites[result.suite[0]] || [];
        result.stop = Date.now();
        result.allure = currentTestcase;
        currentTestcase = {};
        suite.push(result);
    };

    // wait for writing all the xml files, before exiting
    emitter.on('exit', function (done) {
        writer.waitPendingFiles(done);
    });
}
AllureReporter.$inject = ['baseReporterDecorator', 'config', 'emitter', 'logger', 'helper'];
module.exports = AllureReporter;
