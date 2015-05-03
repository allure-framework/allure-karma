var mockery = require('mockery');
describe('AllureReporter', function() {
    var baseReporterDecorator, config, emitter, logger, helper,
        Allure, allure,
        Reporter;

    function TestResult(suite, description, error, success) {
        this.suite = [suite];
        this.description = description;
        this.log = [error];
        this.success = success;
    }

    beforeEach(function() {
        mockery.enable({ useCleanCache: true });
        mockery.registerMock('allure-js-commons', Allure = jasmine.createSpy('Allure'));
        allure = jasmine.createSpyObj('allure', ['startSuite', 'endSuite', 'startCase', 'endCase', 'pendingCase']);
        Allure.and.returnValue(allure);
        mockery.registerAllowable('../../src/AllureReporter.js');
        mockery.registerAllowable('path');
        Reporter = require('../../src/AllureReporter.js');
    });
    afterEach(function() {
        mockery.deregisterAll();
        mockery.resetCache();
        mockery.disable();
    });
    beforeEach(function() {
        baseReporterDecorator = jasmine.createSpy('decorator');
        config = {
            files: [],
            basePath: '/'
        };
        emitter = jasmine.createSpyObj('emitter', ['on']);
        logger = {};
        helper = {};
    });

    it('should use default as out dir by default', function() {
        var reporter = new Reporter(baseReporterDecorator, config);
        expect(Allure).toHaveBeenCalledWith({targetDir: undefined});
    });

    it('should use allure report dir when it is set', function() {
        config.allureReport = {reportDir : "reports"};
        var reporter = new Reporter(baseReporterDecorator, config);
        expect(Allure).toHaveBeenCalledWith({targetDir: '/reports'});
    });

    describe("reporting", function () {
        var reporter;

        beforeEach(function() {
            reporter = new Reporter(baseReporterDecorator, config);
        });

        it("should report tests in one suite", function () {
            reporter.specSuccess('test', new TestResult('a suite', 'first', null, true, false));
            expect(allure.startSuite).toHaveBeenCalled();
            expect(allure.startCase).toHaveBeenCalled();
            expect(allure.endCase).toHaveBeenCalledWith('[test] a suite', 'first', 'passed', undefined, jasmine.any(Number));
            expect(allure.endSuite).not.toHaveBeenCalled();

            allure.startSuite.calls.reset();
            reporter.specSuccess('test', new TestResult('a suite', 'second', null, true, false));
            expect(allure.endCase).toHaveBeenCalledWith('[test] a suite', 'second', 'passed', undefined, jasmine.any(Number));
            expect(allure.startSuite).not.toHaveBeenCalled();
        });

        it("should report failed tests", function () {
            reporter.specFailure('test', new TestResult('fails', 'first', 'Expected but not happened', false, false));
            expect(allure.endCase).toHaveBeenCalledWith('[test] fails', 'first', 'failed', jasmine.any(Object), jasmine.any(Number));

            reporter.specFailure('test', new TestResult('fails', 'second', 'Error without reason', false, false));
            expect(allure.endCase).toHaveBeenCalledWith('[test] fails', 'second', 'broken', jasmine.any(Object), jasmine.any(Number));
        });

        it("should report skipped tests", function () {
            reporter.specSkipped('test', new TestResult('future', 'ignored test', null, false, true));
            expect(allure.pendingCase).toHaveBeenCalledWith('[test] future', 'ignored test', jasmine.any(Number));
        });

        it("should finish suites on testrun finish", function () {
            reporter.suites = {
                'a': [{start: 0,  stop: 2},  {start: 6,  stop: 7}],
                'b': [{start: 45, stop: 48}, {start: 51, stop: 57}]
            };
            reporter.onRunComplete();
            expect(allure.endSuite).toHaveBeenCalledWith('a', 7);
            expect(allure.endSuite).toHaveBeenCalledWith('b', 57);
        });
    });


});
