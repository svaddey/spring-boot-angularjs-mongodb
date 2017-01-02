var app = angular.module('input-directives', [
    'ngRoute'
]);

app.directive('emailInputField', function(ErrorMsgSvc) {
    return {
        restrict : 'A',
        require : 'ngModel',
        replace : false,
        link : function(scope, elem, attrs, ctrl) {
            var validator = function(value) {
                ctrl.$setValidity('emailAvailable', true);
                ctrl.$setValidity('required', value);
                ctrl.$setValidity('format', value ? value.match("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z0-9]+$") != null : false);
                return value;
            };

            validator(ctrl.$viewValue);
            ctrl.$parsers.unshift(validator);
            ctrl.$formatters.push(validator);

        }
    };
});

app.directive('nameInputField', function(ErrorMsgSvc) {
    return {
        restrict : 'A',
        require : 'ngModel',
        replace : false,
        link : function(scope, elem, attrs, ctrl) {
            var validator = function(value) {
                ctrl.$setValidity('required', value);
                return value;
            };

            validator(ctrl.$viewValue);
            ctrl.$parsers.unshift(validator);
            ctrl.$formatters.push(validator);
        }
    };
});

app.directive('requiredInputField', function(ErrorMsgSvc) {
    return {
        restrict : 'A',
        require : 'ngModel',
        replace : false,
        scope : {
            requireEnforced : '='
        },
        link : function(scope, elem, attrs, ctrl) {
            var validator = function(value) {
                if (scope.requireEnforced === undefined) {
                    ctrl.$setValidity('required', value);
                } else {
                    ctrl.$setValidity('required', scope.requireEnforced ? value : true);
                }
                return value;
            };

            if (scope.requireEnforced !== undefined) {
                scope.$watch('requireEnforced', function() {
                    validator(ctrl.$viewValue);
                });
            }

            validator(ctrl.$viewValue);
            ctrl.$parsers.unshift(validator);
            ctrl.$formatters.push(validator);
        }
    };
});

app.directive('passwordInputField', function(ErrorMsgSvc) {
    return {
        restrict : 'A',
        require : 'ngModel',
        replace : false,
        link : function(scope, elem, attrs, ctrl) {
            var validator = function(value) {
                if (value) {
                    ctrl.$setValidity('required', true);
                    // Check password meets requirements
                    if (attrs.minlength) {
                        ctrl.$setValidity('minlength', value.length >= attrs.minlength);
                    }
                    if (attrs.maxlength) {
                        ctrl.$setValidity('maxlength', value.length <= attrs.maxlength);
                    }
                    ctrl.$setValidity('caseDiverse', value.match(".*[a-z].*") && value.match(".*[A-Z].*"));
                    ctrl.$setValidity('specChars', value.match(".*[!@#$%^&/+/./,/?/~/-/_0-9].*"));
                } else {
                    ctrl.$setValidity('required', false);
                }
                return value;
            };

            validator(ctrl.$viewValue);
            ctrl.$parsers.unshift(validator);
            ctrl.$formatters.push(validator);
        }
    };
});

app.directive('confirmPasswordField', function(ErrorMsgSvc) {
    return {
        restrict : 'A',
        require : 'ngModel',
        replace : false,
        scope : {
            originalPassword : '='
        },
        link : function(scope, elem, attrs, ctrl) {

            var validator = function(value) {
                ctrl.$setValidity('confirmPassword', value == scope.originalPassword);
                return value;
            };

            validator(ctrl.$viewValue);
            ctrl.$parsers.unshift(validator);
            ctrl.$formatters.push(validator);

            scope.$watch('originalPassword', function(original) {
                ctrl.$setValidity('confirmPassword', ctrl.$viewValue == original);
            });
        }
    };
});