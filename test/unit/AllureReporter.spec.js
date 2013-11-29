var mockery = require('mockery');
describe('AllureReporter', function() {
    var baseReporterDecorator, config, emitter, logger, helper,
        writer,
        Reporter;

    beforeEach(function() {
        mockery.enable({ useCleanCache: true });
        mockery.registerMock('./FileWriter', writer = jasmine.createSpy('writer'));
        mockery.registerAllowable('../src/AllureReporter.js');
        mockery.registerAllowable('crypto');
        mockery.registerAllowable('js2xmlparser');
        mockery.registerAllowable('path');
        mockery.registerAllowable('underscore');
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

    it('should use basePath as out dir by default', function() {
        var reporter = new Reporter(baseReporterDecorator, config, emitter, logger, helper);
        expect(writer).toHaveBeenCalledWith('/', logger, helper);
    });

    it('should use allure report dir when it is set', function() {
        config.allureReport = {reportDir : "reports"};
        var reporter = new Reporter(baseReporterDecorator, config, emitter, logger, helper);
        expect(writer).toHaveBeenCalledWith('/reports', logger, helper);
    });
});