'use strict';

angular.module('interfaceApp').factory('Auth', function($http, $cookieStore, $rootScope, ErrorMsgSvc) {

    var accessLevels = routingConfig.accessLevels, userRoles = routingConfig.userRoles, currentUser = $cookieStore.get('user') || {
        username : '',
        role : userRoles.public
    };

    $cookieStore.remove('user');

    function changeUser(user) {
        _.extend(currentUser, user);
        _.extend(userInfo, currentUser); // not right to use global
    }

    return {
        authorize : function(accessLevel, role) {
            if (role === undefined)
                role = currentUser.role;

            return accessLevel.bitMask & role.bitMask;
        },
        isLoggedIn : function(user) {
            if (user === undefined)
                user = currentUser;
            return user.role.title == userRoles.user.title || user.role.title == userRoles.admin.title;
        },
        register : function(user, success, error) {
            $http.post('/register', user).success(function(res) {
                changeUser(res);
                success();
            }).error(error);
        },
        getEntitlement : function() {
            function createEntitlement(forceMatch, manageUser, manageAdmin, manageTolerance) {
                return {
                    "forceMatch" : forceMatch,
                    "manageUser" : manageUser,
                    "manageAdmin" : manageAdmin,
                    "manageTolerance" : manageTolerance
                };
            }
            if (currentUser !== undefined && currentUser.role !== undefined) {
                var title = currentUser.role.title;
                if ("ROLE_USER" == title) {
                    return createEntitlement(true, false, false, false);
                } else if ("ROLE_ADMIN" == title) {
                    return createEntitlement(true, true, false, true);
                } else if ("ROLE_SUPPORT" == title) {
                    return createEntitlement(false, false, false, false);
                } else if ("ROLE_SUPER" == title) {
                    return createEntitlement(true, true, true, true);
                }
            }
            return createEntitlement(false, false, false, false);
        },
        login : function(user, success, error) {
            $http.get($rootScope.APIServer + 'ui/users/authenticate', {
                headers : {
                    "If-Modified-Since" : "01 Jan 1970 00:00:00 GMT" // IE fix: to keep results from being cached
                },
                params : {
                    username : user.username,
                    password : user.password
                }
            }).success(function(data) {

                var user = {
                    role : {
                        bitMask : 2,
                        title : data.entity.role
                    },
                    userId : data.entity.id,
                    username : data.entity.username,
                    firstName : data.entity.firstName,
                    lastName : data.entity.lastName,
                    roleID : data.entity.role
                };
                success(user);
            }).error(error, status);
        },
        logout : function(success, error) {
            $(document).idleTimer("destroy");
            changeUser({
                username : '',
                role : userRoles.public
            });
            success();
        },
        accessLevels : accessLevels,
        userRoles : userRoles,
        user : currentUser
    };
});

angular.module('interfaceApp').factory('Users', function($http) {
    var userUpdateStatus = null;
    return {
        getAll : function(success, error) {
            $http.get('/users').success(success).error(error);
        },
        getUserUpdateStatus : function() {
            return userUpdateStatus;
        },
        setUserUpdateStatus : function(status) {
            userUpdateStatus = status;
        }

    };
});

app.factory('DataStorageSvc', [
    '$modal',
    '$rootScope',
    function() {
        var dataSets = {};
        var tradeDataService = {
            get : function(name) {
                return dataSets[name];
            },
            set : function(name, data) {
                dataSets[name] = data;
            },
            clearAll : function() {
                dataSets = {};
            }
        };
        return tradeDataService;
    }
]);
app
    .factory(
        'ErrorMsgSvc',
        [
            '$modal',
            '$rootScope',
            function($modal) {
                var titleMap = {
                    "default" : "Error",
                    0 : "Error",
                    400 : "Bad Request",
                    403 : "Error",
                    404 : "Error",
                    409 : "Error",
                    500 : "Internal Server Error",
                    "INTERNAL_ERROR" : "Internal Error",
                    "SERVER_DATA_NOT_FOUND" : "An Error Occurred",
                    "INVALID_MODAL_DATA" : "Unable to Process Request"
                };
                var messageMap = {
                    "default" : "An Error Occurred",
                    0 : "Server cannot be reached at this time.  If problem persists, please contact client support",
                    400 : "Bad Request (Error:400)",
                    401 : "Unauthorized (Error:401)",
                    403 : "This resource is forbidden (Error:403)",
                    404 : "Resource unavailable at this time (Error:404).  If problem persists, please contact client support",
                    409 : "Data conflict (Error:409).  Please refresh your data and try again.",
                    500 : "Internal Server Error (Error:500).  If problem persists, please contact client support",
                    "0_FOR_LINK" : "Please resubmit. If this problem persists contact client support (Error:0)",
                    "400_FOR_LINK" : "Please contact Client Support (Error:400)",
                    "404_FOR_LINK" : "Resource unavailable at this time (Error:404).  If problem persists, please contact client support",
                    "500_FOR_LINK" : "Please resubmit. If this problem persists contact client support (Error:500)",
                    "0_FOR_LINKABLES" : "Please contact client support (Error:0)",
                    "400_FOR_LINKABLES" : "Please contact client support (Error:400)",
                    "404_FOR_LINKABLES" : "Please contact client support (Error:404)",
                    "500_FOR_LINKABLES" : "Please contact client support (Error:500)",
                    "400_FOR_REJECT" : "Reject action failed.  If problem persists, please contact client support (Error:400)",
                    "404_FOR_REJECT" : "Resource unavailable at this time (Error:404).  If problem persists, please contact client support (Error:404)",
                    "409_FOR_REJECT" : "One or more of the trades you are trying to reject has recently been modified. Please reload the page to view the most recent trade data (Error:409)",
                    "500_FOR_REJECT" : "Internal Server Error (Error:500).  If problem persists, please contact client support",
                    "0_FOR_SEARCH" : "Could not connect to Database. Please try again or contact client support (Error:0)",
                    "404_FOR_SEARCH" : "Resource unavailable at this time (Error:404).  If problem persists, please contact client support",
                    "400_FOR_SEARCH" : "Could not connect to Database. Please try again or contact client support (Error:400)",
                    "500_FOR_SEARCH" : "Could not connect to Database. Please try again or contact client support (Error:500)",
                    "401_FOR_PASSWORD_RESET" : "Your password reset link is either invalid or expired.",
                    "500_FOR_PASSWORD_RESET" : "An error has occurred.  Please try again and if the problem persists, please contact client support.",
                    "TECH_SUPPORT" : "Please contact client support",
                    "LOGIN_DENIED" : "Authentication Failed",
                    "DISABLED_USER_LOGIN_FAIL" : "Disabled user",
                    "SERVER_DATA_NOT_FOUND" : "Unable to retrieve data from server.  If problem persists, please contact client support",
                    "FIELD_BLANK" : "Field cannot be blank. ",
                    "VALUE_OVER_100_CHAR" : "Maximum 100 characters. ",
                    "OLD_PASSWORD_INCORRECT" : "Old password is incorrect. ",
                    "PASSWORD_TOO_SHORT" : "Minimum 8 characters. ",
                    "PASSWORD_NOT_CASE_DIVERSE" : "Must contain upper and lower case letters. ",
                    "PASSWORD_NOT_SPECIAL" : "Must contain a number or special character. ",
                    "PASSWORD_DOES_NOT_MATCH" : "Passwords do not match. ",
                    "INVALID_PASSWORD_RESET_TOKEN" : "Your password reset link is either invalid or expired.",
                    "EMAIL_INVALID_FORMAT" : "Must be a valid email. ",
                    "EMAIL_ALREADY_TAKEN" : "This email is already in use. ",
                    "MATCHING_TOLERANCE_INVALID" : "You must enter a non-negative number",
                    "ALLOCATION_DATA_NOT_RECEIVED" : "Allocation not yet received",
                    "NO_TRADE_SELECTED_FOR_LINK" : "No trade selected",
                    "TOO_MANY_TRADES_SELECTED_FOR_LINK" : "Only one trade can be linked",
                    "INVALID_TRADE_STATUS_FOR_BROKER_LINK" : "Only Trades with a status of Mismatched, Unmatched, or Client Reject can be linked",
                    "INVALID_TRADE_STATUS_FOR_CLIENT_LINK" : "Only Trades with a status of Alleged, Unmatched, Broker Cxl or Affirmed Pending can be linked",
                    "NO_LINKABLE_BROKER_TRADES_FOUND" : "No broker trades with matching trade details",
                    "NO_LINKABLE_CLIENT_TRADES_FOUND" : "No client trades with matching trade details",
                    "NO_ALLOCATION_DATA_FOUND" : "Allocation data not yet received from Client",
                    "NO_BLOCK_CUSTOM_TAGS_FOUND" : "Custom tags not recieved",
                    "NO_ALLOC_CUSTOM_TAGS_FOUND" : "Custom tags not recieved",
                    "NO_RESULTS_FOUND" : "No results found"
                };
                var popupMessageTimeout = null;
                var errorService = {
                    getMessage : function(msg) {
                        return messageMap[msg] ? messageMap[msg] : messageMap["default"];
                    },
                    showPopup : function(message, type, lifespan) {
                        clearTimeout(popupMessageTimeout);
                        $("#PopupMessage").remove();
                        $("body").append(
                            "<div id=\"PopupMessage\" class=\"popup-message " + type + "\">"
                                + "<button type=\"button\" class=\"close\" onclick=\"fadeMeOut('#PopupMessage', 100)\">×</button>"
                                + "<div style='margin: 10px 30px 10px 20px;'>" + message + "</div>" + "</div>");
                        popupMessageTimeout = setTimeout(function() {
                            fadeMeOut("#PopupMessage", 1000);
                        }, lifespan);
                    },
                    clearPopups : function(fadeTime) {
                        clearTimeout(popupMessageTimeout);
                        fadeMeOut("#PopupMessage", fadeTime);
                    },
                    showAlert : function(title, message, serviceName) {
                        var alertOpts = {
                            backdrop : true,
                            keyboard : true,
                            backdropClick : false,
                            templateUrl : 'views/modals/alert.html',
                            controller : function($rootScope, $scope, $modalInstance) {
                                $scope.alertTitle = (serviceName != null ? serviceName + " : " : "")
                                    + (title !== null ? (titleMap[title] ? titleMap[title] : title) : titleMap["default"]);
                                $scope.alertMessage = message !== null ? (messageMap[message] ? messageMap[message] : message)
                                    : messageMap["default"];
                                $scope.close = function() {
                                    $modalInstance.close();
                                };
                            }
                        };
                        $modal.open(alertOpts);
                    }
                };
                return errorService;
            }
        ]);

angular.module('interfaceApp').factory('Utils', [
    function() {
        return {
            formatPrice : function(v) {
                return v == '-' ? '-' : formatValue(v, minPriceDecimals, maxPriceDecimals, thousandsSeparator);
            },
            formatQty : function(v) {
                return v == '-' ? '-' : formatValue(v, 0, 0, thousandsSeparator);
            },
            formatMoney : function(v) {
                return v == '-' ? '-' : formatValue(v, 2, 2, thousandsSeparator);
            },
            delta : function(op1, op2, anyOne) {
                if (chk(op1) == '' && chk(op2) == '')
                    return '-';
                else if (chk(op1) != '' && chk(op2) != '')
                    return Math.abs(parseFloat(op1) - parseFloat(op2));
                else if (chk(op1) == '' || chk(op2) == '')
                    return "-";
                if (anyOne)
                    return chk(op1) == '' ? parseFloat(op2) : parseFloat(op1);
            }
        }

    }
]);
