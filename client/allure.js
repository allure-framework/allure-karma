(function(window, karma) {
    function Step(name) {
        this.name = name;
        this.start = Date.now();
        this.steps = [];
    }
    Step.prototype.complete = function(status) {
        this.status = status || 'passed';
        this.stop = Date.now();
    };

    function Allure(karma, console) {
        function sendMessage(message) {
            karma.info({log: message, type: 'allure'})
        }
        this.severity = function(severity) {
            if(!this.severity.hasOwnProperty(severity.toUpperCase())) {
                console.warn('Unknown severity: ' + severity);
            }
            sendMessage({severity: allure.severity[severity.toUpperCase()]});
        };
        this.severity.BLOCKER = 'blocker';
        this.severity.CRITICAL = 'critical';
        this.severity.NORMAL = 'normal';
        this.severity.MINOR = 'minor';
        this.severity.TRIVIAL = 'trivial';

        this.description = function(description) {
            sendMessage({description: description});
        };

        var currentStep;
        this.createStep = function(name, stepFunc) {
            return function() {
                var parentStep = currentStep,
                    step = new Step(name);
                if(parentStep) {
                    parentStep.steps.push(step);
                }
                currentStep = step;
                try {
                    var result = stepFunc.apply(this, arguments);
                }
                catch(error) {
                    var status = 'broken';
                    throw error;
                }
                finally {
                    step.complete(status);
                    if(!parentStep) {
                        sendMessage({step: step})
                    }
                    currentStep = parentStep;
                }
                return result;
            }
        }
    }
    window.allure = new Allure(karma, window.console);
})(window, window.__karma__);
