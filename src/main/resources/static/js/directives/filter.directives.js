/**
 * Created by Nathaniel on 5/8/14.
 */
/* Directives */
var filterApp = angular.module('filter-directives', [
    'ngRoute'
]);
filterApp.directive('inputFilter', function($timeout) {
    return {
        restrict : 'E',
        replace : true,
        scope : {
            fieldLabel : '@',
            fieldName : '=',
            fieldId : '@',
            fieldInit : '=',
            validation : '='
        },
        template : "<div class='ilb'>" + "<div class='label-container'>{{fieldLabel}}</div>" + "<div class='filter-column filter-text'>"
            + "<input ng-model='fieldName' type='text' class='filterInput' id='{{fieldId}}'/>" + "</div>" + "</div>",
        link : function(scope, elem, attrs) {
            $timeout(function() {
                scope.fieldName = angular.copy(scope.fieldInit);
            });
        }
    };
});
filterApp.directive('inputRangeFilter', function($timeout) {
    return {
        restrict : 'E',
        replace : true,
        scope : {
            fromFieldLabel : '@',
            fromFieldName : '=',
            fromFieldId : '@',
            fromFieldInit : '=',
            toFieldLabel : '@',
            toFieldName : '=',
            toFieldId : '@',
            toFieldInit : '='
        },
        template : "<div class='ilb'>" + "<div class='label-container'>{{fromFieldLabel}}</div>" + "<span class='filter-column filter-text'>"
            + "<input ng-model='fromFieldName' type='text' class='filterInput' id='{{fromFieldId}}'/>" + "</span>"
            + "<div class='label-container'>{{toFieldLabel}}</div>" + "<div class='filter-column filter-text'>"
            + "<input ng-model='toFieldName' type='text' class='filterInput' id='{{toFieldId}}'/>" + "</div>" + "</div>",
        link : function(scope, elem, attrs) {
            $timeout(function() {
                scope.toFieldName = angular.copy(scope.toFieldInit);
                scope.fromFieldName = angular.copy(scope.fromFieldInit);
            });
        }
    };
});
filterApp
    .directive(
        'inputAndTypeFilter',
        function($timeout) {
            return {
                restrict : 'E',
                replace : true,
                scope : {
                    fieldLabel : '@',
                    inputFieldName : '=',
                    typeFieldName : '=',
                    fieldId : '@',
                    inputFieldInit : '=',
                    typeFieldInit : '=',
                    defaultType : '@',
                    validation : '=',
                    optionList : '='
                },
                template : "<div class='ilb'>"
                    + "<div class='label-container'>{{fieldLabel}}</div>"
                    + "<div class='filter-column select-filter filter-text'>"
                    + "<input ng-model='inputFieldName' type='text' class='filterInput' id='{{fieldId}}-input'/>"
                    + "<select ng-model='typeFieldName' ng-options='option.value as option.name for option in optionsForUser' class='filterInput' id='{{fieldId}}-type'>"
                    + "</select>" + "</div>" + "</div>",
                link : function(scope, elem, attrs) {
                    scope.optionsForUser = {};
                    $timeout(function() {
                        // INITIALIZE
                        scope.inputFieldName = angular.copy(scope.inputFieldInit);
                        scope.typeFieldName = angular.copy(scope.typeFieldInit);
                    });

                    // EVENT HANDLING
                    var firstPass = true;
                    scope.$watch(function() {
                        return scope.inputFieldName !== "";
                    }, function(inputPresent) {
                        if (inputPresent) {
                            scope.optionsForUser = scope.optionList;
                            scope.typeFieldName = scope.inputFieldName == scope.inputFieldInit ? angular.copy(scope.typeFieldInit)
                                : scope.defaultType;
                            $("#" + scope.fieldId + "-type").removeAttr('disabled');
                        } else {
                            $("#" + scope.fieldId + "-type").attr('disabled', 'disabled');
                            if (!firstPass) {
                                scope.inputFieldInit = "";
                            } else {
                                firstPass = false;
                            }
                            scope.optionsForUser = {};
                            scope.typeFieldName = "";
                        }
                    });
                }
            };
        });
filterApp.directive('selectFilter', function($timeout) {
    return {
        restrict : 'E',
        replace : true,
        scope : {
            fieldLabel : '@',
            fieldName : '=',
            fieldInit : '=',
            fieldId : '@',
            optionList : '='
        },
        template : "<div class='ilb'>" + "<div class='label-container'>{{fieldLabel}}</div>"
            + "<div class='filter-column select-filter filter-text'>"
            + "<select ng-model='fieldName' ng-options='option.value as option.name for option in optionList' class='filterInput' id='{{fieldId}}'>"
            + "</select>" + "</div>" + "</div>",
        link : function(scope, elem, attrs) {
            $timeout(function() {
                scope.fieldName = angular.copy(scope.fieldInit); // Set filter value
            });
        }
    };
});
filterApp.directive('multiSelectFilter', function($timeout) {
    return {
        restrict : 'E',
        replace : true,
        scope : {
            fieldLabel : '@',
            fieldName : '=',
            fieldInit : '=',
            fieldId : '@',
            optionList : '=',
            classes : '@'
        },
        template : "<div class='ilb multi-select-filter'>" + "<div class='label-container'>{{fieldLabel}}</div>"
            + "<div class='filter-column filter-text'>   "
            + "<select ng-model='fieldName' class='filterInput' id='{{fieldId}}' multiple='multiple' style='width:80px;'>"
            + "<option value='{{option.value}}' ng-repeat='option in optionList'>{{option.name}}</option>" + "</select>" + "</div>" + "</div>",
        link : function(scope, elem, attrs) {
            $timeout(function() {
                scope.fieldName = scope.fieldInit;
                $('#' + scope.fieldId).multiselect({
                    selectedList : 1,
                    selectedText : "Multiple",
                    classes : scope.classes
                });

                $timeout(function() {
                    $('#' + scope.fieldId).multiselect("refresh");
                });
            });

            scope.$on('refreshFilters', function() {
                $('#' + scope.fieldId).multiselect("refresh");
            })
        }
    }
});
filterApp.directive('dateRangeFilter', function($timeout) {
    return {
        restrict : 'E',
        replace : true,
        scope : {
            fromFieldLabel : '@',
            fromFieldName : '=',
            fromFieldId : '@',
            fromFieldInit : '=',
            toFieldLabel : '@',
            toFieldName : '=',
            toFieldId : '@',
            toFieldInit : '=',
            fromFirstDay : '@',
            fromLastDay : '@',
            toFirstDay : '@',
            toLastDay : '@'
        },
        template : "<div class='ilb'>" + "<div class='label-container'>{{fromFieldLabel}}</div>" + "<span class='filter-column filter-text'>"
            + "<input ng-model='fromFieldName' type='text' class='filterInput' id='{{fromFieldId}}' style='width:70px;'>" + "</span>"
            + "<div class='label-container'>{{toFieldLabel}}</div>" + "<span class='filter-column filter-text'>"
            + "<input ng-model='toFieldName' type='text' class='filterInput' id='{{toFieldId}}' style='width:70px;'>" + "</span>" + "</div>",
        link : function(scope, elem, attrs) {
            $timeout(function() {
                $('#' + scope.fromFieldId).datepicker({
                    showOn : "both",
                    buttonImage : "img/calendar.png",
                    dateFormat : dateTemplate,
                    minDate : scope.fromFirstDay,
                    maxDate : scope.fromLastDay,
                    onSelect : function() {
                        var fromDate = new Date(this.value);
                        var toDate = new Date(scope.toFieldName);
                        scope.fromFieldName = this.value;
                        if (scope.toFieldName == "") {
                            scope.toFieldName = this.value;
                        } else if (fromDate > toDate) {
                            scope.toFieldName = this.value;
                        }
                        scope.$apply();
                    }
                });
                $('#' + scope.toFieldId).datepicker({
                    showOn : "both",
                    buttonImage : "img/calendar.png",
                    dateFormat : dateTemplate,
                    minDate : scope.toFirstDay,
                    maxDate : scope.toLastDay,
                    onSelect : function() {
                        var toDate = new Date(this.value);
                        var fromDate = new Date(scope.fromFieldName);
                        scope.toFieldName = this.value;
                        if (scope.fromFieldName == "") {
                            scope.fromFieldName = this.value;
                        } else if (toDate < fromDate) {
                            scope.fromFieldName = this.value;
                        }
                        scope.$apply();
                    }
                });
                // initialize fields
                scope.fromFieldName = scope.fromFieldInit;
                scope.toFieldName = scope.toFieldInit;
            });
        }
    };
});
