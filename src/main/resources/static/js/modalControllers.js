app.controller('EditPreferencesCtrl', function($scope, $location, $http, Auth, $rootScope, $modalInstance, ErrorMsgSvc) {
    $scope.user = Auth.user;
    $scope.userRoles = Auth.userRoles;
    $scope.accessLevels = Auth.accessLevels;

    // Error Messages
    $scope.showAllErrors = {
        passwordForm : false
    };
    $scope.fieldBlankMessage = ErrorMsgSvc.getMessage("FIELD_BLANK");
    $scope.passwordInvalidMessage = {
        maxlength : ErrorMsgSvc.getMessage("VALUE_OVER_100_CHAR"),
        minlength : ErrorMsgSvc.getMessage("PASSWORD_TOO_SHORT"),
        caseDiverse : ErrorMsgSvc.getMessage("PASSWORD_NOT_CASE_DIVERSE"),
        specChars : ErrorMsgSvc.getMessage("PASSWORD_NOT_SPECIAL"),
        correct : ErrorMsgSvc.getMessage("OLD_PASSWORD_INCORRECT")
    };
    $scope.confirmInvalidMessage = ErrorMsgSvc.getMessage("PASSWORD_DOES_NOT_MATCH");

    // Password Variables
    $scope.preferences = {
        oldPassword : "",
        newPassword : "",
        confirmPassword : ""
    };

    $scope.updatePreferences = function() {
        if ($scope.passwordForm.$dirty) {
            $scope.tryChangePassword();
            // var passwordResult = $scope.tryChangePassword();
            // if (passwordResult) {
            // console.log("CLOSE"); // DEBUG
            // $scope.close(); // When the rest of the preferences are enabled, this will close only when all subforms succeed.
            // Need a promise to properly implement...
        }
    };

    $scope.tryChangePassword = function() {
        $scope.showAllErrors.passwordForm = true;
        if ($scope.passwordForm.$valid) {
            aofs_debug("Form Valid, Changes Will Be Attempted");
            $http.put(($rootScope.APIServer + 'account/user/' + $scope.user.userId + '/password'), {
                credentials : {
                    oldPassword : $scope.preferences.oldPassword,
                    newPassword : $scope.preferences.newPassword
                }
            }).success(function() {
                $scope.close();
                // return true; //Enable when promises are implemented
            }).error(function(error, status) {
                $scope.changePasswordSuccess = false;
                $scope.$emit('changePasswordFail');
                aofs_debug("Change Password Error: " + status);
                if (status == 409) {
                    $scope.passwordForm.oldPassword.$setValidity('correct', false);
                } else {
                    ErrorMsgSvc.showAlert(status, status, "Change Password");
                }
                return false;
            });
        } else {
            return false;
        }
    };

    $scope.setPasswordForm = function(form) {
        $scope.passwordForm = form;
    };
    $scope.close = function() {
        $modalInstance.close();
    };
});

app.controller('CreateUserCtrl', function($scope, $location, $http, Auth, $rootScope, Users, $modalInstance, ErrorMsgSvc) {
    $scope.user = Auth.user;
    $scope.userRoles = Auth.userRoles;
    $scope.roleOptions = [];
    $scope.roleNameToIdMap = {};
    $scope.createUserForm = {};
    $scope.showAllErrors = false;
    $scope.emailUnavailable = false;

    // Error Messages
    $scope.fieldBlankMessage = ErrorMsgSvc.getMessage("FIELD_BLANK");
    $scope.emailInvalidMessage = ErrorMsgSvc.getMessage("EMAIL_INVALID_FORMAT");
    $scope.emailUnavailableMessage = ErrorMsgSvc.getMessage("EMAIL_ALREADY_TAKEN");
    $scope.maxlengthInvalidMessage = ErrorMsgSvc.getMessage("VALUE_OVER_100_CHAR");
    $scope.confirmInvalidMessage = ErrorMsgSvc.getMessage("PASSWORD_DOES_NOT_MATCH");

    // Create User Variables
    $scope.newUser = {
        email : "",
        firstname : "",
        lastname : "",
        roleid : ""
    };

    // getting roles to populate roleId select on create user modal
    $http.get($rootScope.APIServer + 'ui/admin/roles',{params:{userRole:Auth.user.role.title}}).success(function(data) {
        data.role.forEach(function(v) {
            $scope.roleOptions.push({
                name : v.roleDesc,
                value : v.roleName
            });
            $scope.roleNameToIdMap[v.roleName] = v.id;
        });
        $scope.newUser.roleid = "ROLE_USER";
    }).error(function(msg, status) {
        $scope.roleOptions = {};
        aofs_debug("Error retrieving role list");
        ErrorMsgSvc.showAlert("SERVER_DATA_NOT_FOUND", "SERVER_DATA_NOT_FOUND", "Get User Roles");
    });

    $scope.createUser = function() {
        aofs_debug("Attempting to Create User");
        $scope.showAllErrors = true; // Shows all outstanding invalidities
        if ($scope.createUserForm.$valid) {
            $http({
                method : 'POST',
                url : ($rootScope.APIServer + 'ui/admin/users'),
                params : {
                    email : $scope.newUser.email,
                    firstname : $scope.newUser.firstname,
                    lastname : $scope.newUser.lastname,
                    companyid : $scope.user.companyId,
                    roleid : $scope.roleNameToIdMap[$scope.newUser.roleid],
                    source : $rootScope.WebAppServer.replace(/\/$/, "")
                }
            }).success(function(status) {
                $scope.close(true);
            }).error(function(msg, status) {
                if (status == 400) {
                    if (msg.response.details.error == "This email is already in use") {
                        $scope.createUserForm.email.$setValidity('emailAvailable', false);
                    }
                } else if (status == 500) {
                    ErrorMsgSvc.showAlert(status, status, "Create User");
                } else {
                    ErrorMsgSvc.showAlert(status, status, "Create User");
                }
            });
        }
    };

    $scope.setForm = function(form) {
        $scope.createUserForm = form;
    };
    $scope.close = function(refreshUserData) {
        Users.setUserUpdateStatus(refreshUserData);
        $modalInstance.close(true);
    };

});

app.controller('ChangeUserPasswordCtrl', function($scope, $location, $http, Auth, $rootScope, $modalInstance, cpUser, ErrorMsgSvc) {
    $scope.showAllErrors = false;
    $scope.myTitle = function() {
        return "Change Password for " + cpUser.firstName + " " + cpUser.lastName;
    };
    $scope.fieldBlankMessage = ErrorMsgSvc.getMessage("FIELD_BLANK");
    $scope.emailInvalidMessage = ErrorMsgSvc.getMessage("EMAIL_INVALID_FORMAT");
    $scope.emailUnavailableMessage = ErrorMsgSvc.getMessage("EMAIL_ALREADY_TAKEN");
    $scope.maxlengthInvalidMessage = ErrorMsgSvc.getMessage("VALUE_OVER_100_CHAR");
    $scope.passwordInvalidMessage = {
        minlength : ErrorMsgSvc.getMessage("PASSWORD_TOO_SHORT"),
        caseDiverse : ErrorMsgSvc.getMessage("PASSWORD_NOT_CASE_DIVERSE"),
        specChars : ErrorMsgSvc.getMessage("PASSWORD_NOT_SPECIAL")
    };
    $scope.confirmInvalidMessage = ErrorMsgSvc.getMessage("PASSWORD_DOES_NOT_MATCH");
    $scope.password = {
        newPassword : "",
        confirmPassword : ""
    };

    // OBSOLETE
    $scope.changeUserPassword = function() {
        aofs_debug("Attempting to change User password");
        $scope.showAllErrors = true; // Shows all outstanding invalidities
        if ($scope.changePasswordForm.$valid) {
            $http.put(($rootScope.APIServer + 'ui/admin/users/' + cpUser.userId + '/password'), {
                credentials : {
                    newPassword : $scope.password.newPassword
                }
            }).success(function(status) {
                $scope.close();
            }).error(function(msg, status) {
                if (status == 400) {
                    ErrorMsgSvc.showAlert(status, msg.response.details.error, "Change Password");
                } else if (status == 403) {
                    ErrorMsgSvc.showAlert(status, msg.response.details.error, "Change Password");
                } else if (status == 500) {
                    ErrorMsgSvc.showAlert(status, status, "Change Password");
                } else {
                    ErrorMsgSvc.showAlert(status, status, "Change Password");
                }
            });
        }
    };

    $scope.setForm = function(form) {
        $scope.changePasswordForm = form;
    };
    $scope.close = function() {
        $modalInstance.close();
    };
});

app.controller('LogoutCtrl', function($scope, $location, Auth, $modalInstance, DataStorageSvc) {
    $scope.logoutUser = function() {
        Auth.logout(function() {
            $scope.justLogout = true;
            $scope.sessionExpired = false;
            DataStorageSvc.clearAll();
            $location.path('/login');
            $scope.close();
        }, function(err) {
            alert('Unable to logout ' + err);
        });
    };

    $scope.close = function() {
        $modalInstance.close();
    };
});

app.controller('EditUserCtrl', function($scope, $timeout, $location, $http, Auth, $rootScope, $modalInstance, Users, editUser, ErrorMsgSvc) {
    $scope.user = Auth.user;
    $scope.userRoles = Auth.userRoles;
    $scope.roleOptions = [];

    // Error Messages
    $scope.showAllErrors = false;
    $scope.maxlengthInvalidMessage = ErrorMsgSvc.getMessage("VALUE_OVER_100_CHAR");
    $scope.fieldBlankMessage = ErrorMsgSvc.getMessage("FIELD_BLANK");

    // Create User Variables
    $scope.newUserDetails = {
        firstname : angular.copy(editUser.firstName.toString()),
        lastname : editUser.lastName.toString(),
        roleid : -1
    };

    $scope.myTitle = function() {
        return "Edit Details for " + editUser.firstName + " " + editUser.lastName;
    };
    // getting roles to populate roleId select on edit user modal
    $http.get($rootScope.APIServer + 'ui/admin/roles',{params:{userRole:Auth.user.role.title}}).success(function(data) {
        for (var i = 0; i < data.role.length; i++) {
            var newOption = {
                name : data.role[i].roleDesc,
                value : data.role[i].id
            };
            $scope.roleOptions.push(newOption);
            if (editUser.role == newOption.name) {
                $scope.newUserDetails.roleid = newOption.value; // initialize subject user's roleid
            }
        }
    }).error(function(msg, status) {
        $scope.roleOptions = {};
        aofs_debug("Error retrieving role list");
        ErrorMsgSvc.showAlert(status, "SERVER_DATA_NOT_FOUND", "Get User Roles");
    });

    $scope.updateUser = function() {
        aofs_debug("Attempting to Edit User");
        $scope.showAllErrors = true; // Shows all outstanding invalidities
        if ($scope.editUserForm.$valid) {
            $http.put(($rootScope.APIServer + 'ui/admin/users/' + editUser.userId + '/updateprofile'), {
                user : {
                    firstName : $scope.newUserDetails.firstname,
                    lastName : $scope.newUserDetails.lastname,
                    roleId : $scope.newUserDetails.roleid
                }
            }).success(function(status) {
                $scope.close(true);
            }).error(function(msg, status) {
                if (status == 400) {
                    ErrorMsgSvc.showAlert(status, msg.response.details.error, "Edit User");
                } else if (status == 403) {
                    ErrorMsgSvc.showAlert(status, msg.response.details.error, "Edit User");
                } else if (status == 500) {
                    ErrorMsgSvc.showAlert(status, status, "Edit User");
                } else {
                    ErrorMsgSvc.showAlert(status, status, "Edit User");
                }
            });
        }
    };

    $scope.setForm = function(form) {
        $scope.editUserForm = form;
    };
    $scope.close = function(refreshUserData) {
        Users.setUserUpdateStatus(refreshUserData);
        $modalInstance.close();
    };

});

app.controller('ResetUserPasswordCtrl', function($scope, $timeout, $location, $http, Auth, $rootScope, $modalInstance, Users, ErrorMsgSvc, user) {
    $scope.user = user; // for modal access

    $scope.resetPassword = function() {
        $http.put(($rootScope.APIServer + 'ui/admin/users/' + user.userId + '/passwordreset'), null, {
            params : {
                source : $rootScope.WebAppServer.replace(/\/$/, "")
            }
        }).success(function() {
            $scope.close();
        }).error(function(msg, status) {
            ErrorMsgSvc.showAlert(status, status, "Reset Password");
        });
    };

    $scope.close = function(refreshUserData) {
        Users.setUserUpdateStatus(refreshUserData);
        $modalInstance.close();
    };

});

app
    .controller(
        'ForgotPasswordCtrl',
        function($scope, $compile, $timeout, $location, $http, Auth, $rootScope, $modalInstance, ErrorMsgSvc) {

            $scope.user = {};
            $scope.forgotPasswordForm = null;

            // Error Messages
            $scope.fieldBlankMessage = ErrorMsgSvc.getMessage("FIELD_BLANK");
            $scope.usernameInvalidMessage = ErrorMsgSvc.getMessage("EMAIL_INVALID_FORMAT");

            $scope.resetPassword = function() {
                $scope.showAllErrors = true; // Shows all outstanding invalidities
                if ($scope.forgotPasswordForm.$valid) {
                    $http
                        .put(($rootScope.APIServer + 'account/password/forgot'), null, {
                            params : {
                                email : $scope.user.email,
                                source : $rootScope.WebAppServer.replace(/\/$/, "")
                            }
                        })
                        .success(
                            function() {
                                $(".modal div.modal-body")
                                    .html(
                                        "<p class='text-center confirm-text'>An email has been sent to your account with further instructions for resetting your password.</p>"
                                            + "<div class='modalActionButtons'>"
                                            + "<button type='button' class='btn blue small-text' data-dismiss='modal' aria-hidden='true' ng-click='close()'>Close</button>"
                                            + "</div>");
                                $compile($(".modal div.modal-body"))($scope);
                            })
                        .error(
                            function(msg, status) {
                                if (status == 500) {
                                    ErrorMsgSvc.showAlert(status, "500_FOR_PASSWORD_RESET", "Forgot Password");
                                } else {
                                    $(".modal div.modal-body")
                                        .html(
                                            "<p class='text-center confirm-text'>Sorry, you will need to go to your administrator to have your password reset.</p>"
                                                + "<div class='modalActionButtons'>"
                                                + "<button type='button' class='btn red small-text' data-dismiss='modal' aria-hidden='true' ng-click='close()'>Close</button>"
                                                + "</div>");
                                    $compile($(".modal div.modal-body"))($scope);
                                }
                                ;
                            });
                }
            };

            $scope.setForm = function(form) {
                $scope.forgotPasswordForm = form;
            };

            $scope.close = function() {
                $modalInstance.close();
            };

        });

app.controller('EventsLogCtrl', function($scope, $compile, $http, $modal, $modalInstance, $rootScope, type, selectedTrade, blockSummary, Auth,
    ErrorMsgSvc) {
    function createMapping(description, infoTemplate, msgType) {
        return {
            "description" : description,
            "infoTemplate" : infoTemplate,
            "msgType" : msgType
        };
    }
    $scope.title = blockSummary;
    $scope.fixMsgFormat = "parsed";
    $scope.rawFixMsg = "";
    $scope.parsedFixMsg = [];

    $scope.setFixMsgFormat = function(newVal) {
        if ($scope.fixMsgFormat != 'none') {
            $scope.fixMsgFormat = newVal;
        }
    };

    $scope.eventTableStructure = {
        initialSort : [
            "eventTime:asc"
        ],
        scrollHeight : 275,
        columns : [
            {
                title : "Event&nbsp;Time",
                classes : "text-left",
                width : "105px",
                data : "eventTime",
                datatype : "eventTime",
                sortable : true
            },
            {
                title : "Description",
                classes : "text-left",
                data : "event",
                sortable : true
            },
            {
                title : "Sender",
                classes : "text-left",
                data : "sender",
                sortable : true
            },
            {
                title : "Target",
                classes : "text-left",
                data : "target",
                sortable : true
            }
        ]
    };

    $scope.eventMapping = {
        "RCV_J_NEW" : "Block New (J)",
        "RCV_J_CANCEL" : "Block Cancel (J)",
        "RCV_J_REPLACE" : "Block Replace (J)",
        "SND_J_NEW" : "Block New (J)",
        "SND_J_CANCEL" : "Block Cancel (J)",
        "SND_J_REPLACE" : "Block Replace (J)",
        "SND_P_RECVD" : "Block Recvd (P)",
        "SND_P_ACCEPT" : "Block Accptd (P)",
        "SND_P_REJECT" : "Block Rejectd (P)",
        "RCV_P_RECVD" : "Block Recvd (P)",
        "RCV_P_ACCEPT" : "Block Accptd (P)",
        "RCV_P_REJECT" : "Block Rejectd (P)",
        "RCV_AE_NEW" : "Block New (AE)",
        "RCV_AE_ALLEGED" : "Block Alleged (AE)",
        "RCV_AE_CANCEL" : "Block Cancel (AE)",
        "RCV_AE_MATCHED" : "Block Matched (AE)",
        "RCV_AE_MISMATCHED" : "Block Mismatched (AE)",
        "RCV_AE_UNMATCHED" : "Block Unmatched (AE)",
        "SND_AE_NEW" : "Block New (AE)",
        "SND_AE_ALLEGED" : "Block Alleged (AE)",
        "SND_AE_CANCEL" : "Block Cancel (AE)",
        "SND_AE_MATCHED" : "Block Matched (AE)",
        "SND_AE_MISMATCHED" : "Block Mismatched (AE)",
        "SND_AE_UNMATCHED" : "Block Unmatched (AE)",
        "RCV_AK_NEW" : "Confirm New (AK)",
        "RCV_AK_CANCEL" : "Confirm Cancel (AK)",
        "RCV_AK_REPLACE" : "Confirm Replace (AK)",
        "SND_AK_NEW" : "Confirm New (AK)",
        "SND_AK_CANCEL" : "Confirm Cancel (AK)",
        "SND_AK_REPLACE" : "Confirm Replace (AK)",
        "RCV_AU_RECVD" : "Confirm Recvd (AU)",
        "RCV_AU_ACCEPT" : "Confirm Accptd (AU)",
        "RCV_AU_REJECT" : "Confirm Rejectd (AU)",
        "SND_AU_RECVD" : "Confirm Recvd (AU)",
        "SND_AU_ACCEPT" : "Confirm Accptd (AU)",
        "SND_AU_REJECT" : "Confirm Rejectd (AU)",
        "RCV_AR_ACCEPT" : "Block Accptd (AR)",
        "RCV_AR_REJECT" : "Block Rejected (AR)",
        "SND_AR_ACCEPT" : "Block Accptd (AR)",
        "SND_AR_REJECT" : "Block Rejected (AR)",
        "RCV_AS_ACCEPT" : "Report New (AS)",
        "RCV_AS_CANCEL" : "Report Cancel (AS)",
        "RCV_AS_REJECT" : "Report Rejectd (AS)",
        "SND_AS_ACCEPT" : "Report New (AS)",
        "SND_AS_CANCEL" : "Report Cancel (AS)",
        "SND_AS_REJECT" : "Report Rejectd (AS)",
        "RCV_AT_RECVD" : "Report Recvd (AT)",
        "RCV_AT_ACCEPT" : "Report Accptd (AT)",
        "RCV_AT_REJECT" : "Report Rejectd (AT)",
        "UI_FORCE_MATCH" : "User Force Match",
        "UI_CANCEL" : "User Cancel",
        "UI_LINK" : "User Link",
        "UI_REJECT" : "User Reject",
        "UNKNOWN_EVENT" : "Unknown event",
        "" : "Unknown event"
    };

    $scope.messageDisplayTableStructure = {
        initialSort : [],
        scrollHeight : 150,
        rowCallback : function(row, data, index) {
            row.className = "fixMessageIndentLevel" + data.level.toString() + (data.repeatingGroup ? " repeating-group" : "");
            $compile(row)($scope);
        },
        columns : [
            {
                title : "Tag",
                classes : "text-left",
                width : "50px",
                data : "number",
                render : function(data, type, row) {
                    return "<a class='link-style' ng-click='retrieveTagHelp(" + data + ")'>" + data + "</a>";
                },
                sortable : false
            },
            {
                title : "Description",
                classes : "text-left",
                width : "120px",
                data : "description",
                sortable : false
            },
            {
                title : "Value",
                classes : "text-left",
                width : "200px",
                data : "value",
                render : function(data, type, row) {
                    return data + (row.explanation ? " (" + row.explanation + ")" : "");
                },
                sortable : false
            }
        ]
    };

    $scope.retrieveTagHelp = function(tagNum) {
        var href = window.location.protocol + "//www.onixs.biz/fix-dictionary/4.4/tagNum_" + tagNum + ".html";
        var opts = {
            backdrop : true,
            keyboard : true,
            backdropClick : false,
            templateUrl : 'views/modals/tagHelp.html',
            resolve : {
                externalUrl : function() {
                    return href;
                }
            },
            controller : "TagHelpCtrl"
        };
        $modal.open(opts);

    };

    $scope.eventTableSelectRow = function(row) {
        var table = $("#eventTable").dataTable();
        if (!$(row).hasClass("selected")) {
            $(row).parent().children("tr.selected").removeClass("selected");
            $(row).addClass("selected");

            var data = table.fnGetData(row);
            if (data.eventType === "UI_CANCEL" || data.eventType === "UI_FORCE_MATCH" || data.eventType === "UI_LINK"
                || data.eventType === "UI_REJECT" || data.eventType === "UNKNOWN_EVENT") {
                $scope.rawFixMsg = "";
                $scope.parsedFixMsg = [];
                $scope.fixMsgFormat = 'none';
            } else {
                var eventMsgRequest = "";
                switch (type) {
                    case "search":
                        eventMsgRequest = $rootScope.APIServer
                            + "trades/sellside/{0}/{1}/msgs/{2}".format(Auth.user.company, selectedTrade.tradeID, data.msgID);
                        break;
                    case "client":
                        eventMsgRequest = $rootScope.APIServer
                            + "trades/buyside/{0}/{1}/msgs/{2}".format(selectedTrade.clientAcronym, selectedTrade.allocID, data.msgID);
                        break;
                }
                $http.get(eventMsgRequest, {
                    params : {
                        cacheKill : new Date().getTime()
                    }
                }).success(function(data) {
                    if ($scope.fixMsgFormat == 'none') {
                        $scope.fixMsgFormat = "parsed";
                    }
                    if (data !== undefined && data.message !== undefined) {
                        var messageString = data.message.raw.replace(/\u0001/g, "|");
                        $scope.parsedFixMsg = formatParsedFixMsg(data.message.tags || []);
                        $scope.rawFixMsg = messageString.charAt(messageString.length - 1) == '|' ? messageString.slice(0, -1) : messageString;
                    } else {
                        $scope.rawFixMsg = "";
                        $scope.parsedFixMsg = [];
                    }
                }).error(function(error, status) {
                    ErrorMsgSvc.showAlert(status, status, "Get Raw Message");
                });
            }
        }
    };

    $scope.close = function() {
        $modalInstance.close();
    };

    $scope.getEvents = function(targetTable) {
        var eventsLogRequest = "";
        switch (type) {
            case "search":
                eventsLogRequest = $rootScope.APIServer + "trades/sellside/{0}/{1}/events".format(Auth.user.company, selectedTrade.tradeID);
                break;
            case "client":
                eventsLogRequest = $rootScope.APIServer + "trades/buyside/{0}/{1}/events".format(selectedTrade.clientAcronym, selectedTrade.allocID);
                break;
        }

        $http.get(eventsLogRequest, {
            headers : {
                "If-Modified-Since" : "01 Jan 1970 00:00:00 GMT" // IE fix: to keep results from being cached
            },
            params : {
                skipNull : 'N',
                cacheKill : new Date().getTime()
            }
        }).success(
            function(data) {
                $scope.eventTableData = data.events.map(function(v) {
                    var eventType = $scope.eventMapping[v.eventType] ? v.eventType : "UNKNOWN_EVENT";

                    // Sender : If the event type is UI_LINK or UI_REJECT, then we show firstName&nbsp;lastName (userName). Else we show the sender.
                    // Also, for event type UI_LINK or UI_REJECT, if the userName is null (this could happen for old data where user name is not
                    // populated), then show empty
                    return {
                        "msgID" : chk(v.messageID),
                        "eventTime" : chk(v.eventTime),
                        "event" : $scope.eventMapping[eventType],
                        "eventType" : eventType,
                        "sender" : chk(v.eventType) == "UI_LINK" || chk(v.eventType) == "UI_REJECT" ? (chk(v.userName) != "" ? chk(v.firstName) + " "
                            + chk(v.lastName) + " (" + chk(v.userName) + ")" : "") : (chk(v.sender) + (chk(v.onBehalfOf) != "" ? " (" + v.onBehalfOf
                            + ")" : "")),
                        "target" : chk(v.target) + (chk(v.deliverTo) != "" ? " (" + v.deliverTo + ")" : "")
                    };
                });
                targetTable.clear(false);
                if ($scope.eventTableData.length >= 1) {
                    targetTable.rows.add($scope.eventTableData);
                }
                targetTable.draw();
            }).error(function(error, status) {
            var msg = $rootScope.ServerErrorMessage.format(status);
            ErrorMsgSvc.showAlert(status, msg, "Get Events Log");
        });
    };
});
app.controller('TagHelpCtrl', function($scope, $modalInstance, $sce, externalUrl) {

    $scope.externalContent = $sce.trustAsResourceUrl(externalUrl);

    $scope.close = function() {
        $modalInstance.close();
    };
});

app.controller('MiscFeesCtrl', function($scope, $http, $modalInstance, miscFeeRowData, totalMiscFees) {
    $scope.rowData = miscFeeRowData;
    $scope.colTotal = totalMiscFees;

    $scope.miscFeeStructure = {
        initialSort : [
            "type:asc"
        ],
        columns : [
            {
                title : "Type",
                classes : "right",
                width : "200px",
                data : "type",
                sortable : true
            },
            {
                title : "Manager",
                classes : "right",
                width : "100px",
                data : "manager",
                datatype : "money",
                sortable : true
            },
            {
                title : "Broker",
                classes : "right",
                width : "100px",
                data : "broker",
                datatype : "money",
                sortable : true
            },
            {
                title : "Delta",
                classes : "right",
                width : "100px",
                data : "delta",
                datatype : "money",
                sortable : true
            }
        ]
    };

    $scope.close = function() {
        $modalInstance.close();
    };
});

app.controller('LinkTradeCtrl',
    function($rootScope, $scope, $http, Auth, $modalInstance, $sce, $filter, ErrorMsgSvc, type, selectedTrade, linkables) {

        var linkPutRequest = "";
        $scope.selectedTrade = selectedTrade;
        if (selectedTrade) {
            switch (type) {
                case "search":
                    /*
                     * $scope.selectedTradeSummary = $sce.trustAsHtml("Client: <b>" + selectedTrade.clientAcronym + "</b> | Side: <b>" +
                     * selectedTrade.side + "</b> | Qty: <b>" + formatValue(selectedTrade.quantity, 0, 1, true) + "</b> | Avg Px: <b>" +
                     * formatPrice(selectedTrade.avgPx) + "</b> | Trade Date: <b>" + aofs_ymdToMdy(selectedTrade.tradeDate) + "</b> | Settle Date:
                     * <b>" + aofs_ymdToMdy(selectedTrade.settlDate) + "</b> | Broker Identifier: <b>" + selectedTrade.securityIDSource + ": " +
                     * selectedTrade.securityID);
                     */
                    linkPutRequest = $rootScope.APIServer + "trades/sellside/link";
                    break;
                case "client":
                    /*
                     * $scope.selectedTradeSummary = $sce.trustAsHtml("Client: <b>" + selectedTrade.clientAcronym + "</b> | Side: <b>" +
                     * selectedTrade.side + "</b> | Qty: <b>" + formatValue(selectedTrade.quantity, 0, 1, true) + "</b> | Avg Px: <b>" +
                     * formatPrice(selectedTrade.avgPx) + "</b> | Trade Date: <b>" + aofs_ymdToMdy(selectedTrade.tradeDate) + "</b> | Settle Date:
                     * <b>" + aofs_ymdToMdy(selectedTrade.settlDate) + "</b> | Client Identifier: <b>" + selectedTrade.securityIDSource + ": " +
                     * selectedTrade.securityID);
                     */
                    linkPutRequest = $rootScope.APIServer + "trades/buyside/link";
                    break;
            }
        } else {
            $modalInstance.close();
        }

        $scope.linkTableData = linkables;

        $scope.submitLink = function() {
            if ($("tr:has(input.rb_select:checked)").size() == 1) {
                var selectedRow = $("#modalTable").dataTable().fnGetData($("tr:has(input.rb_select:checked)").get(0));
                var brokerTrade = {};
                var clientTrade = {};
                switch (type) {
                    case "search":
                        brokerTrade = {
                            "brokerAcronym" : Auth.user.company,
                            "tradeID" : selectedTrade.tradeID,
                            "quantity" : selectedTrade.quantity,
                            "side" : encodeSide(selectedTrade.side),
                            "currency" : selectedTrade.currency,
                            "version" : selectedTrade.version
                        };
                        clientTrade = {
                            "clientAcronym" : selectedRow.clientAcronym,
                            "allocID" : selectedRow.allocID,
                            "quantity" : selectedRow.quantity,
                            "side" : encodeSide(selectedRow.side),
                            "currency" : selectedRow.currency,
                            "version" : selectedRow.version
                        };
                        break;
                    case "client":
                        brokerTrade = {
                            "brokerAcronym" : Auth.user.company,
                            "tradeID" : selectedRow.tradeID,
                            "quantity" : selectedRow.quantity,
                            "side" : encodeSide(selectedRow.side),
                            "currency" : selectedRow.currency,
                            "version" : selectedRow.version
                        };
                        clientTrade = {
                            "clientAcronym" : selectedTrade.clientAcronym,
                            "allocID" : selectedTrade.allocID,
                            "quantity" : selectedTrade.quantity,
                            "side" : encodeSide(selectedTrade.side),
                            "currency" : selectedTrade.currency,
                            "version" : selectedTrade.version
                        };
                        break;
                }
                $http.put(linkPutRequest, {
                    link : {
                        "requestId" : uniqueid(),
                        "userId" : Auth.user.userId,
                        "requestTime" : new Date().toISOString(),
                        "broker" : brokerTrade,
                        "client" : clientTrade
                    }
                }).success(function() {
                    $modalInstance.close();
                    ErrorMsgSvc.showPopup("Request to link trades successfully&nbsp;submitted", "success", 4000);
                    $scope.search();
                }).error(function(msg, status) {
                    ErrorMsgSvc.showAlert("INTERNAL_ERROR", status + "_FOR_LINK", "Link Trades");
                });
            } else {
                ErrorMsgSvc.showAlert("INVALID_MODAL_DATA", "NO_TRADE_SELECTED_FOR_LINK", "Link Trades");
            }
        };

        $scope.close = function() {
            $modalInstance.close();
        };
    });

app.controller('RejectTradesCtrl', function($rootScope, $scope, $http, Auth, $modalInstance, $sce, $filter, ErrorMsgSvc, selectedTrades) {

    $scope.rejectConfirm = false;
    $scope.rejectComment = "";

    $scope.rejectTableData = selectedTrades;

    $scope.reject = function() {
        var tradesToReject = [];
        var tradeToReject = {};
        _.each(selectedTrades, function(thisTrade) {
            tradeToReject.clientAcronym = thisTrade.clientAcronym;
            tradeToReject.allocID = thisTrade.allocID;
            tradeToReject.quantity = thisTrade.quantity;
            tradeToReject.side = thisTrade.side;
            tradeToReject.currency = thisTrade.currency;
            tradeToReject.version = thisTrade.version;
            tradesToReject.push(tradeToReject);
        });

        $http.put($rootScope.APIServer + "trades/buyside/reject", {
            "reject" : {
                "requestId" : uniqueid(),
                "userId" : Auth.user.userId,
                "requestTime" : new Date().toISOString(),
                "clients" : tradesToReject,
                "comment" : this.rejectComment
            }
        }).success(function() {
            $modalInstance.close();
            ErrorMsgSvc.showPopup("This trade has been submitted for rejection", "success", 4000);
            $scope.search();
        }).error(function(msg, status) {
            ErrorMsgSvc.showAlert(status, status + "_FOR_REJECT", "Reject Trade");
        });
    };

    $scope.close = function() {
        $modalInstance.close();
    };
});

app.controller('ExportCtrl', function($rootScope, $scope, $http, Auth, $modalInstance, $sce, $filter, ErrorMsgSvc) {

    $scope.startExport = function() {

    };

    $scope.close = function() {
        $modalInstance.close();
    };
});

app.controller('ClientValuesCtrl', function($rootScope, $scope, $http, Auth, $modalInstance, $sce, $filter, ErrorMsgSvc, selectedTrade) {
    $scope.close = function() {
        $modalInstance.close();
    };
});

app.controller('CustomTagsCtrl', function($rootScope, $sce, $filter, $scope, $http, Auth, $modalInstance, block, alloc, tags) {
    $scope.customTagStructure = {
        initialSort : [
            "tagName:asc"
        ],
        columns : [
            {
                title : "Custom&nbsp;Tag&nbsp;No.",
                data : "tagName"
            },
            {
                title : "Tag Value",
                data : "tagValue"
            }
        ]
    };

    if (alloc == null) {
        $scope.titleType = "Block";
        $scope.summaryBar = $sce.trustAsHtml("Client: <b>" + block.clientAcronym + "</b> | Side: <b>" + block.side + "</b> | Qty: <b>"
            + formatValue(block.quantity, minQuantityDecimals, maxQuantityDecimals, true) + "</b> | Avg Px: <b>" + formatPrice(block.avgPx)
            + "</b> | Broker Identifier: <b>" + block.securityID);
        $scope.customTagStructure.emptyTableMsg = "NO_BLOCK_CUSTOM_TAGS_FOUND";
        $scope.emptyTableMessage = "NO_BLOCK_CUSTOM_TAGS_FOUND";
    } else {
        $scope.titleType = "Allocation";
        $scope.summaryBar = $sce.trustAsHtml("Client: <b>" + block.clientAcronym + "</b> | Side: <b>" + block.side + "</b> | Qty: <b>"
            + formatValue(alloc.allocQty, minQuantityDecimals, maxQuantityDecimals, true) + "</b> | Avg Px: <b>" + formatPrice(alloc.avgPx)
            + "</b> | Broker Identifier: <b>" + block.securityID);
        $scope.customTagStructure.emptyTableMsg = "NO_ALLOC_CUSTOM_TAGS_FOUND";
        $scope.emptyTableMessage = "NO_ALLOC_CUSTOM_TAGS_FOUND";
    }
    ;

    $scope.customTagsTableData = tags;

    $scope.close = function() {
        $modalInstance.close();
    };
});

app.controller('ClientSupportCtrl', function($scope, $modalInstance, Auth) {

    $scope.manualURL = Auth.user.companyPreferences.USER_MANUAL_URL;

    $scope.close = function() {
        $modalInstance.close();
    };
});
