/* Directives */
(function(angular) {
    "use strict";
    angular.module('interfaceApp.admin-directives', [
        'ui.bootstrap',
        'ngRoute'
    ]).directive(
        'adminMatchingtolerance',
        function() {
            return {
                restrict : 'E',
                templateUrl : 'views/admin-partials/matchingtolerance.html',
                replace : true,
                controller : function($scope, $http, $location, Auth, $rootScope, ErrorMsgSvc) {
                    $scope.user = Auth.user;
                    $scope.toleranceValue = 0;
                    $scope.tolerance = {};
                    $scope.toleranceErrorMessage = "";
                    $scope.changesSaved = null;

                    $scope.validateTolerance = function() {
                        $scope.toleranceErrorMessage = "";
                        if (!/^\d+\.?\d*$/.test($scope.toleranceValue)) {
                            $scope.toleranceErrorMessage = ErrorMsgSvc.getMessage("MATCHING_TOLERANCE_INVALID");
                            return false;
                        }
                        return true;
                    };

                    $scope.populateCurrentToleranceValue = function() {
                        $http({
                            headers : {
                                "If-Modified-Since" : "01 Jan 1970 00:00:00 GMT" // IE fix: to keep results from being cached
                            },
                            method : 'GET',
                            url : ($rootScope.APIServer + 'ui/admin/matcherconfig'),
                            params : {
                                companyid : $scope.user.companyId
                            }
                        }).success(function(data) {
                            $scope.toleranceValue = data;
                            $scope.tolerance = data;
                        }).error(
                            function(msg, status) {
                                if (status == 404) {
                                    ErrorMsgSvc.showAlert("Not Found Error (404)", "Cannot find Matcher Configs given the Company id ({0}) "
                                        .format($scope.user.companyId), "Get Tolerance");
                                } else {
                                    ErrorMsgSvc.showAlert(status, status, "Get Tolerance");
                                }
                                ;
                            });
                    };

                    $scope.update = function() {
                        if ($scope.validateTolerance()) {
                            $scope.toleranceValue;
                            $scope.tolerance = angular.copy($scope.toleranceValue);
                            aofs_debug("Attempting to update MatcherConfigs with new Tolerance : {0}".format($scope.toleranceValue));
                            $http({
                                method : 'PUT',
                                url : ($rootScope.APIServer + 'ui/admin/matcherconfig'),
                                params : {
                                    companyid : $scope.user.companyId,
                                    tolerance : $scope.toleranceValue
                                }
                            }).success(function(status) {}).error(function(msg, status) {
                                if (status == 404) {
                                    ErrorMsgSvc.showAlert("SERVER_DATA_NOT_FOUND", "SERVER_DATA_NOT_FOUND", "Update Tolerance");
                                } else {
                                    ErrorMsgSvc.showAlert(status, status, "Update Tolerance");
                                }
                            });
                        }
                        ;
                    };

                    $scope.reset = function() {
                        $scope.toleranceValue = angular.copy($scope.tolerance);
                    };

                    $scope.isUnchanged = function(toleranceValue) {
                        $scope.toleranceValue = toleranceValue.toString();
                        return angular.equals($scope.toleranceValue, $scope.tolerance);
                    };

                    $scope.toleranceChanged = function() {
                        $scope.toleranceErrorMessage = "";
                    };

                    $scope.go = function(path) {
                        $location.path(path);
                    };

                }
            };
            // }).directive('adminNumericsettings', function() {
            // return {
            // restrict : 'E',
            // templateUrl : 'views/admin-partials/numericsettings.html',
            // replace : true,
            // controller : function($scope, $location) {
            // $scope.master = {};
            //
            // $scope.update = function(numeric) {
            // $scope.master = angular.copy(numeric);
            // // TBD API
            // // console.log($scope.master);
            // };
            //
            // $scope.reset = function() {
            // $scope.numeric = angular.copy($scope.master);
            // };
            //
            // $scope.isUnchanged = function(numeric) {
            // return angular.equals(numeric, $scope.master);
            // };
            //
            // $scope.go = function(path) {
            // $location.path(path);
            // };
            // }
            // };
        }).directive('adminFixconnections', function() {
        return {
            restrict : 'E',
            templateUrl : 'views/admin-partials/fixconnections.html',
            replace : true,
            controller : function($scope) {
                $scope.master = {};

                $scope.update = function(fix) {
                    $scope.master = angular.copy(fix);
                    // TBD API
                    // console.log($scope.master);
                };

                $scope.reset = function() {
                    $scope.fix = angular.copy($scope.master);
                };

                $scope.isUnchanged = function(fix) {
                    return angular.equals(fix, $scope.master);
                };

                $scope.reset();
            }
        };
    }).directive('adminChangeuser', function($http, $modal) {
        return {
            restrict : 'E',
            templateUrl : 'views/admin-partials/changeuser.html',
            replace : true,
            controller : function($scope, $rootScope, $http, $modal, Auth, Users, ErrorMsgSvc) {
                // TBD take users from API
                $scope.users = [];
                $scope.selectedUser = null;

                $scope.userTableStructure = {
                    initialSort : [
                        "username:asc"
                    ],
                    autoWidth : false,
                    resizeWithWindow : false,
                    tableFilterId : "userTableFilter",
                    scrollHeight : 275,
                    columns : [
                        {
                            title : "Email",
                            data : "username",
                            width : "200px",
                            sortable : true
                        },
                        {
                            title : "First&nbsp;Name",
                            data : "firstName",
                            width : "100px",
                            sortable : true
                        },
                        {
                            title : "Last&nbsp;Name",
                            data : "lastName",
                            width : "100px",
                            sortable : true
                        },
                        {
                            title : "Access&nbsp;Level",
                            data : "role",
                            width : "100px",
                            sortable : true
                        },
                        {
                            title : "Active",
                            data : "isDeleted",
                            width : "50px",
                            sortable : true
                        },
                        {
                            title : "Reg. Complete",
                            data : "registrationComplete",
                            width : "70px",
                            sortable : true
                        },
                        {
                            title : "Created",
                            data : "createdTimestamp",
                            width : "100px",
                            sortable : true
                        },
                        {
                            title : "Modified",
                            data : "modifiedTimestamp",
                            width : "100px",
                            sortable : true
                        }
                    ]
                };

                $scope.selectUser = function(row) {
                    $("#userTable tr.selected").removeClass('selected');
                    $(row).addClass('selected');
                    $scope.selectedUser = $("#userTable").DataTable().row(row).data();
                    $scope.$digest();
                };

                $scope.populateUserList = function() {
                    $http.get($rootScope.APIServer + "ui/admin/users", {
                        headers : {
                            "If-Modified-Since" : "01 Jan 1970 00:00:00 GMT" // IE fix: to keep results from being cached
                        },
                        params : {
                            companyid : Auth.user.companyId,
                            userRole: Auth.user.role.title
                        }
                    }).success(function(data) {
                        var userList = data.user;
                        userList.forEach(function(user) {
                            var createdDate = new Date.fromISO(user.createdTimestamp);
                            var modifiedDate = new Date.fromISO(user.modifiedTimestamp);
                            user.createdTimestamp = (createdDate.getMonth() + 1) + "/" + createdDate.getDate() + "/" + createdDate.getFullYear();
                            user.modifiedTimestamp = (modifiedDate.getMonth() + 1) + "/" + modifiedDate.getDate() + "/" + modifiedDate.getFullYear();
                            user.isDeleted = user.isDeleted ? "No" : "Yes";
                            user.registrationComplete = user.registrationComplete ? "Yes" : "No";
                        });
                        $scope.selectedUser = null;
                        $scope.users = userList;
                    }).error(function(data, status) {
                        ErrorMsgSvc.showAlert("SERVER_DATA_NOT_FOUND", "SERVER_DATA_NOT_FOUND", "Get Users");
                    });
                };
                $scope.populateUserList();

                $scope.createUser = function() {
                    var opts = {
                        backdrop : true,
                        keyboard : true,
                        backdropClick : false,
                        templateUrl : 'views/modals/createUser.html',
                        controller : 'CreateUserCtrl',
                        resolve : {
                            onClose : $scope.populateUserList()
                        },
                        scope : $scope
                    };
                    $modal.open(opts).result.then(function() {
                        if (Users.getUserUpdateStatus())
                            $scope.populateUserList();
                    });
                };

                $scope.resetUserPassword = function() {
                    var opts = {
                        backdrop : true,
                        keyboard : true,
                        backdropClick : false,
                        templateUrl : 'views/modals/resetUserPassword.html',
                        controller : 'ResetUserPasswordCtrl',
                        resolve : {
                            user : function() {
                                return $scope.selectedUser;
                            }
                        }
                    };
                    $modal.open(opts);
                };

                $scope.editUser = function() {
                    var opts = {
                        backdrop : true,
                        keyboard : true,
                        backdropClick : false,
                        templateUrl : 'views/modals/editUser.html',
                        controller : 'EditUserCtrl',
                        resolve : {
                            editUser : function() {
                                return $scope.selectedUser;
                            }
                        }
                    };
                    $modal.open(opts).result.then(function() {
                        if (Users.getUserUpdateStatus())
                            $scope.populateUserList();
                    });
                };

                $scope.deactivateUser = function() {
                    var opts = {
                        backdrop : true,
                        keyboard : true,
                        backdropClick : false,
                        templateUrl : 'views/modals/deactivateUser.html',
                        controller : function($scope, $http, $modalInstance, user) {
                            $scope.user = user;

                            $scope.close = function(refreshUserData) {
                                Users.setUserUpdateStatus(refreshUserData);
                                $modalInstance.close();
                            };

                            $scope.confirm = function() {
                                $http.put($rootScope.APIServer + "ui/admin/users/" + user.userId + "/disable").success(function() {
                                    $scope.close(true);
                                }).error(function(data) {
                                    ErrorMsgSvc.showAlert(status, status, "Deactivate User");
                                });
                            };
                        },
                        resolve : {
                            user : function() {
                                return $scope.selectedUser;
                            }
                        }
                    };
                    $modal.open(opts).result.then(function() {
                        if (Users.getUserUpdateStatus())
                            $scope.populateUserList();
                    });
                };
            }
        };
    })

    .directive('uiValidateEquals', function() {
        return {
            restrict : 'A',
            require : 'ngModel',
            link : function(scope, elm, attrs, ctrl) {

                function validateEqual(myValue, otherValue) {
                    if (myValue === otherValue) {
                        ctrl.$setValidity('equal', true);
                        return myValue;
                    } else {
                        ctrl.$setValidity('equal', false);
                        return undefined;
                    }
                }

                scope.$watch(attrs.uiValidateEquals, function(otherModelValue) {
                    validateEqual(ctrl.$viewValue, otherModelValue);
                });

                ctrl.$parsers.unshift(function(viewValue) {
                    return validateEqual(viewValue, scope.$eval(attrs.uiValidateEquals));
                });

                ctrl.$formatters.unshift(function(modelValue) {
                    return validateEqual(modelValue, scope.$eval(attrs.uiValidateEquals));
                });
            }
        };
    })

})(angular);