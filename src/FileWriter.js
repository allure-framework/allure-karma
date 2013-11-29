var fs = require('fs'),
    path = require('path');

module.exports = function FileWriter(outDir, logger, helper) {
    var self = this,
        pendingFileWritings = 0,
        log = logger.create('reporter.allure');

    this.addNamespace = function(xml) {
        return xml.replace('<test-suite', '<ns2:test-suite xmlns:ns2="urn:model.allure.qatools.yandex.ru"')
            .replace('</test-suite', '</ns2:test-suite');
    };

    this.writeFile = function (outputFile, xmlToOutput) {
        helper.mkdirIfNotExists(outDir, function () {
            xmlToOutput = self.addNamespace(xmlToOutput);
            fs.writeFile(path.resolve(outDir, outputFile), xmlToOutput, function (err) {
                if (err) {
                    log.warn('Cannot write JUnit xml\n\t' + err.message);
                } else {
                    log.debug('JUnit results written to "%s".', outputFile);
                }

                if (!--pendingFileWritings) {
                    self.fileWritingFinished();
                }
            });
        });
    };

    this.waitPendingFiles = function (done) {
        if (pendingFileWritings) {
            this.fileWritingFinished = done;
        } else {
            done();
        }
    };

    this.fileWritingFinished = function () {};
};
