var app = angular.module('interfaceApp', [
    'ui.bootstrap',
    'LoadingIndicator',
    'ngCookies',
    'datatablesDirectives',
    'ngSanitize',
    'interfaceApp.admin-directives',
    'interfaceApp.trade-directives',
    'misc-directives',
    'input-directives',
    'filter-directives'
]).config([
    '$routeProvider',
    '$httpProvider',
    '$locationProvider',
    function($routeProvider, $httpProvider, $locationProvider) {

        var access = routingConfig.accessLevels;
        $routeProvider.when('/login', {
            templateUrl : 'views/login.html',
            controller : LoginCtrl,
            access : access.anon
        }).when('/resetPassword', {
            templateUrl : 'views/resetPassword.html',
            controller : ResetPasswordCtrl,
            access : access.anon
        }).when('/tickets', {
            templateUrl : 'views/tickets.html',
            controller : TicketsCtrl,
            access : access.user
        }).when('/admin', {
            templateUrl : './views/admin.html',
            controller : AdminCtrl,
            access : access.user
        }).otherwise({
            redirectTo : 'tickets'
        });
        // $locationProvider.html5Mode(true);

        var interceptor = [
            '$location',
            '$q',
            function($location, $q) {

                function success(response) {
                    return response;
                }

                function error(response) {

                    if (response.status === 401) {
                        $location.path('/login');
                        return $q.reject(response);
                    } else {
                        return $q.reject(response);
                    }
                }

                return function(promise) {
                    return promise.then(success, error);
                }
            }
        ];

        $httpProvider.responseInterceptors.push(interceptor);

    }
]);

app.run(function($rootScope, $location, Auth) {
    $rootScope.$on("$routeChangeStart", function(event, next, current) {
        if (next.access !== undefined) {
            $rootScope.error = null;
            if (!Auth.authorize(next.access)) {
                if (Auth.isLoggedIn()) {
                    $location.path('/');
                } else {
                    $location.path('/login');
                }
            }
        }

    });
    // global configurations
    $rootScope.responseMessages = {
        '202' : 'Success',
        '500' : 'Failed',
        '400' : 'Bad Request'
    };

    // $rootScope.APIServer = window.location.protocol + "//localhost:8081/fixaffirmss-engine/"; // For stub project // DEBUG
    $rootScope.APIServer = window.location.protocol + "//" + window.location.host + "/ims/";

    $rootScope.userSessionExpired = false;

});

app.directive('focusMe', function($timeout) {
    return {
        link : function(scope, element, attrs, model) {
            $timeout(function() {
                element[0].focus();
            });
        }
    };
});

app.directive('accessLevel', [
    'Auth',
    function(Auth) {
        return {
            restrict : 'A',
            link : function($scope, element, attrs) {
                var prevDisp = element.css('display'), userRole, accessLevel;

                $scope.user = Auth.user;
                $scope.$watch('user', function(user) {
                    if (user.firstName)
                        $scope.userFullName = user.firstName + ' ' + user.lastName;
                    if (user.role)
                        userRole = user.role;
                    updateCSS();
                }, true);

                attrs.$observe('accessLevel', function(al) {

                    if (al)
                        accessLevel = $scope.$eval(al);
                    updateCSS();
                });

                function updateCSS() {
                    if (userRole && accessLevel) {
                        if (!Auth.authorize(accessLevel, userRole)) {
                            element.css('display', 'none');
                            $scope.isLoged = true;
                        } else {
                            element.css('display', 'block');
                            $scope.isLoged = false;
                        }
                    }
                }
            }
        };
    }
]);

app.directive('onKeyup', function() {
    return function(scope, elm, attrs) {
        elm.bind("keyup", function() {
            scope.$apply(attrs.onKeyup);
        });
    };
});

/* Controllers */

app.controller('MainCtrl', function($scope, $location, Auth, $rootScope, $modal, $http) {
    $scope.user = Auth.user;
    $scope.$watch('user', function(user) { // This is where a user's preferences will be loaded
    }, true);
    $scope.userRoles = Auth.userRoles;
    $scope.accessLevels = Auth.accessLevels;

    $scope.logout = function() {
        var opts = {
            backdrop : true,
            keyboard : true,
            backdropClick : false,
            templateUrl : 'views/modals/logout.html',
            controller : 'LogoutCtrl',
            scope : $scope
        };
        $modal.open(opts);
    };

    // change main menu active element
    $scope.toggleActive = function(path) {
        if ($location.path().substr(0, path.length) == path) {
            return "active";
        } else {
            return "";
        }
    };

});

function LoginCtrl($rootScope, $scope, $location, $window, $modal, Auth, ErrorMsgSvc) {
    $scope.rememberme = true;
    if ($rootScope.userSessionExpired) {
        $scope.serverDown = false;
        $scope.sessionExpired = true;
        $scope.invalidLogin = false;
        $scope.justLogout = false;
        $scope.accountDisabled = false;
    }

    if (Auth.user.username != "")
        $location.path('/');

    $scope.login = function() {

        Auth.login({
            username : $scope.username,
            password : $scope.password,
            rememberme : $scope.rememberme
        }, function(res) {
            $rootScope.userSessionExpired = false;
            // setup a timer to monitor user idleness
            var timeoutVal = 30; // default 30 minutes.
            $(document).idleTimer(timeoutVal * 60000, {
                startImmediately : true, // starts a timeout as soon as the timer is set up; otherwise it waits for the first event.
                idle : false, // indicates if the user is idle
                enabled : true, // indicates if the idle timer is enabled
                events : 'mousemove keydown DOMMouseScroll mousewheel mousedown touchstart touchmove' // activity is one of these events
            });

            // setup a function to be called when user is idle.
            $(document).on("idle.idleTimer", function() {
                Auth.logout(function(res) {
                    $rootScope.userSessionExpired = true;
                    $location.path('/login');
                }, function(err) {
                    alert('Unable to logout ' + err);
                });
            });
            $location.path('/');
        }, function(err, status) {
            $scope.justLogout = false;
            $scope.sessionExpired = false;
            $scope.serverDown = false;
            $scope.invalidLogin = false;
            $scope.accountDisabled = false;
            switch (status) {
                case 401:
                    $scope.invalidLogin = true;
                    break;
                case 403:
                    $scope.accountDisabled = true;
                    break;
                default:
                    $scope.serverDown = true;
                    break;
            }
        });
    };

    $scope.forgotPassword = function() {
        var opts = {
            backdrop : true,
            keyboard : true,
            backdropClick : false,
            templateUrl : 'views/modals/forgotPassword.html',
            controller : 'ForgotPasswordCtrl'
        };
        $modal.open(opts);
    };

    $scope.loginOauth = function(provider) {
        $window.location.href = '/auth/' + provider;
    };

};

function ResetPasswordCtrl($rootScope, $routeParams, $scope, $location, $window, $http, Auth, ErrorMsgSvc) {
    if ($rootScope.userSessionExpired) {
        $scope.serverDown = false;
        $scope.sessionExpired = true;
        $scope.invalidLogin = false;
        $scope.justLogout = false;
        $scope.accountDisabled = false;
    }

    $scope.fieldBlankMessage = ErrorMsgSvc.getMessage("FIELD_BLANK");
    $scope.maxlengthInvalidMessage = ErrorMsgSvc.getMessage("VALUE_OVER_100_CHAR");
    $scope.passwordInvalidMessage = {
        minlength : ErrorMsgSvc.getMessage("PASSWORD_TOO_SHORT"),
        caseDiverse : ErrorMsgSvc.getMessage("PASSWORD_NOT_CASE_DIVERSE"),
        specChars : ErrorMsgSvc.getMessage("PASSWORD_NOT_SPECIAL")
    };
    $scope.confirmInvalidMessage = ErrorMsgSvc.getMessage("PASSWORD_DOES_NOT_MATCH");

    $scope.showAllErrors = false;

    $scope.resetPassword = function() {
        if (!$routeParams.token) {
            ErrorMsgSvc.showAlert(0, "INVALID_PASSWORD_RESET_TOKEN", "Password Reset");
            return;
        }
        if ($scope.resetPasswordForm.$valid) {
            Auth.passResetLogin({
                token : $routeParams.token,
                password : $scope.newPassword
            }, function(res) {
                $rootScope.userSessionExpired = false;
                ErrorMsgSvc.showPopup("Password set successfully", "success", 2000);
                // setup a timer to monitor user idleness
                var timeoutVal = 30; // default 30 minutes.
                var timeout = _.find(res.companyobj.preferences.entry, function(record) {
                    return record.key === 'UI_INACTIVE_TIMEOUT';
                });
                if (timeout) {
                    timeoutVal = timeout.value;
                }
                $(document).idleTimer(timeoutVal * 60000, {
                    startImmediately : true, // starts a timeout as soon as the timer is set up; otherwise it waits for the first event.
                    idle : false, // indicates if the user is idle
                    enabled : true, // indicates if the idle timer is enabled
                    events : 'mousemove keydown DOMMouseScroll mousewheel mousedown touchstart touchmove' // activity is one of these events
                });

                // setup a function to be called when user is idle.
                $(document).on("idle.idleTimer", function() {
                    Auth.logout(function(res) {
                        $rootScope.userSessionExpired = true;
                        $location.path('/login');
                    }, function(err) {
                        alert('Unable to logout ' + err);
                    });
                });
                $location.path("/tickets");
            }, function(msg, status) {
                ErrorMsgSvc.showAlert(status, status + "_FOR_PASSWORD_RESET", "Set Password");
            });
        } else {
            $scope.showAllErrors = true;
        }
    };

    $scope.setForm = function(form) {
        $scope.resetPasswordForm = form;
    };
};

function TicketsCtrl($scope, $routeParams) {
	$scope.tickets = "This is tickets controller";
}

function AdminCtrl($scope, $routeParams, $location, Auth) {
    $scope.admin = "This is admin controller";
}